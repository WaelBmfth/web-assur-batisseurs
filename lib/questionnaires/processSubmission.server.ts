import { z } from "zod";
import { getEmailSettings, type EmailSettings } from "@/lib/email/config.server";
import { EmailNotConfiguredError } from "@/lib/email/types";
import { questionnairePdfFilename, renderQuestionnairePdf } from "@/lib/pdf/questionnairePdf";
import { buildConfirmationEmail, shortReference } from "./confirmationEmail";
import { buildQuestionnaireDocument, type ValidatedQuestionnaire } from "./document";
import { artisansSchema, doSchema, rcdPibSchema } from "./schemas";
import { getSubmissionStore, type SubmissionRecord, type SubmissionStore } from "./submissionStore.server";
import { questionnaireTypes, type QuestionnaireType, type SimulatorSnapshot } from "./types";

/*
 * Traitement serveur d'un questionnaire soumis :
 * validation → (doublon ?) → PDF → verrou → e-mail avec le PDF en pièce jointe → enregistrement.
 * Aucun succès n'est renvoyé si le PDF ou l'e-mail a échoué.
 */

const requestSchema = z.object({
  submissionId: z.uuid(),
  type: z.enum(questionnaireTypes),
  values: z.unknown(),
  simulation: z
    .object({
      activityId: z.string().trim().min(1).max(200),
      revenue: z.number().finite().positive(),
      includeLegalProtection: z.boolean(),
      companyName: z.string().trim().max(200),
    })
    .nullable(),
});

export type SubmissionRequest = z.input<typeof requestSchema>;

export type SubmissionSuccess = {
  ok: true;
  submissionId: string;
  reference: string;
  /** Adresse à laquelle le PDF a été envoyé (saisie par le client). */
  emailSentTo: string;
  /** Vrai si cette soumission avait déjà été traitée : aucun nouvel e-mail. */
  duplicate: boolean;
  pdf: { filename: string; base64: string };
};

export type SubmissionFailure = {
  ok: false;
  status: 400 | 409 | 422 | 500 | 502 | 503;
  code: "INVALID_REQUEST" | "INVALID_DATA" | "IN_PROGRESS" | "EMAIL_NOT_CONFIGURED" | "PDF_FAILED" | "EMAIL_FAILED" | "STORAGE_FAILED";
  /** Message affichable au visiteur (français). */
  message: string;
  errors?: string[];
};

export type SubmissionOutcome = SubmissionSuccess | SubmissionFailure;

export type SubmissionDeps = {
  store: SubmissionStore;
  /** Lue à chaque appel : une configuration absente est signalée, pas ignorée. */
  emailSettings: () => EmailSettings;
  activityName: (activityId: string) => Promise<string | undefined>;
  now: () => Date;
  log: (message: string, detail?: unknown) => void;
};

/** Verrou « en cours » abandonné (fonction interrompue) : libéré après ce délai. */
const STALE_PROCESSING_MS = 5 * 60_000;

const schemas = { artisans: artisansSchema, do: doSchema, "rcd-pib": rcdPibSchema } as const;

function validate(type: QuestionnaireType, values: unknown): { ok: true; q: ValidatedQuestionnaire } | { ok: false; errors: string[] } {
  const result = schemas[type].safeParse(values);
  if (!result.success) {
    return { ok: false, errors: result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")} : ${i.message}` : i.message)) };
  }
  return { ok: true, q: { type, data: result.data } as ValidatedQuestionnaire };
}

const fail = (status: SubmissionFailure["status"], code: SubmissionFailure["code"], message: string, errors?: string[]): SubmissionFailure => ({
  ok: false,
  status,
  code,
  message,
  ...(errors ? { errors } : {}),
});

async function renderPdf(q: ValidatedQuestionnaire, submissionId: string, submittedAt: Date, simulation: SimulatorSnapshot | null, deps: SubmissionDeps) {
  const activityName = simulation ? await deps.activityName(simulation.activityId) : undefined;
  const doc = buildQuestionnaireDocument(q, { submissionId, submittedAt, simulation, activityName });
  const content = await renderQuestionnairePdf(doc);
  return { doc, filename: questionnairePdfFilename(doc), content };
}

export async function processQuestionnaireSubmission(input: unknown, deps: SubmissionDeps): Promise<SubmissionOutcome> {
  const request = requestSchema.safeParse(input);
  if (!request.success) return fail(400, "INVALID_REQUEST", "La demande est incomplète. Rechargez la page puis réessayez.");
  const { submissionId, type, values, simulation } = request.data;

  const validated = validate(type, values);
  if (!validated.ok) {
    return fail(422, "INVALID_DATA", "Certaines réponses sont invalides. Corrigez-les puis renvoyez le questionnaire.", validated.errors);
  }

  // Soumission déjà traitée (double clic, nouvel essai, rechargement) : PDF renvoyé, aucun nouvel e-mail.
  const existing = await deps.store.get(submissionId).catch(() => null);
  if (existing?.status === "sent") {
    const previous = validate(existing.type, existing.values);
    if (previous.ok) {
      const pdf = await renderPdf(previous.q, submissionId, new Date(existing.submittedAt), existing.simulation, deps);
      return success(submissionId, existing.recipient, true, pdf);
    }
  }
  if (existing?.status === "processing") {
    if (deps.now().getTime() - new Date(existing.updatedAt).getTime() < STALE_PROCESSING_MS) {
      return fail(409, "IN_PROGRESS", "Votre questionnaire est déjà en cours d'envoi. Patientez quelques instants.");
    }
    await deps.store.remove(submissionId);
  }

  let settings: EmailSettings;
  try {
    settings = deps.emailSettings();
  } catch (error) {
    if (error instanceof EmailNotConfiguredError) {
      deps.log("[questionnaire] e-mail non configuré", error.message);
      return fail(503, "EMAIL_NOT_CONFIGURED", "L'envoi en ligne est momentanément indisponible. Merci de réessayer plus tard ou de nous appeler.");
    }
    throw error;
  }

  const submittedAt = deps.now();
  let pdf: Awaited<ReturnType<typeof renderPdf>>;
  try {
    pdf = await renderPdf(validated.q, submissionId, submittedAt, simulation, deps);
  } catch (error) {
    deps.log("[questionnaire] génération du PDF impossible", error);
    return fail(500, "PDF_FAILED", "La génération du PDF a échoué. Votre questionnaire n'a pas été envoyé : merci de réessayer.");
  }

  const recipient = pdf.doc.applicant.email;
  const record: SubmissionRecord = {
    status: "processing",
    type,
    values,
    simulation,
    submittedAt: submittedAt.toISOString(),
    recipient,
    updatedAt: submittedAt.toISOString(),
  };
  try {
    if (!(await deps.store.create(submissionId, record))) {
      return fail(409, "IN_PROGRESS", "Votre questionnaire est déjà en cours d'envoi. Patientez quelques instants.");
    }
  } catch (error) {
    deps.log("[questionnaire] enregistrement impossible", error);
    return fail(500, "STORAGE_FAILED", "Votre questionnaire n'a pas pu être enregistré. Merci de réessayer.");
  }

  const email = buildConfirmationEmail(pdf.doc, { filename: pdf.filename, content: pdf.content });
  const to = settings.redirectTo ?? recipient;
  try {
    const { id } = await settings.transport.send(
      {
        ...email,
        to,
        subject: settings.redirectTo ? `[TEST — destinataire prévu : ${recipient}] ${email.subject}` : email.subject,
        bcc: settings.bcc,
        replyTo: settings.replyTo,
      },
      { idempotencyKey: submissionId },
    );
    await deps.store
      .update(submissionId, { ...record, status: "sent", emailId: id, updatedAt: deps.now().toISOString() })
      .catch((error) => deps.log("[questionnaire] e-mail envoyé mais statut non enregistré", error));
  } catch (error) {
    deps.log("[questionnaire] envoi de l'e-mail impossible", error);
    // Verrou libéré : le visiteur peut renvoyer le questionnaire.
    await deps.store.remove(submissionId).catch(() => undefined);
    return fail(502, "EMAIL_FAILED", "L'envoi de l'e-mail de confirmation a échoué. Votre questionnaire n'a pas été transmis : merci de réessayer.");
  }

  return success(submissionId, recipient, false, pdf);
}

function success(submissionId: string, recipient: string, duplicate: boolean, pdf: { filename: string; content: Uint8Array }): SubmissionSuccess {
  return {
    ok: true,
    submissionId,
    reference: shortReference(submissionId),
    emailSentTo: recipient,
    duplicate,
    pdf: { filename: pdf.filename, base64: Buffer.from(pdf.content).toString("base64") },
  };
}

/** Dépendances réelles (route API). */
export function defaultSubmissionDeps(activityName: SubmissionDeps["activityName"]): SubmissionDeps {
  return {
    store: getSubmissionStore(),
    emailSettings: () => getEmailSettings(),
    activityName,
    now: () => new Date(),
    log: (message, detail) => console.error(message, detail),
  };
}
