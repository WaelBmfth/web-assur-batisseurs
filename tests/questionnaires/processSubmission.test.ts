import { PDFDocument } from "pdf-lib";
import { describe, expect, it, vi } from "vitest";
import type { EmailSettings } from "@/lib/email/config.server";
import { EmailDeliveryError, EmailNotConfiguredError, type EmailMessage, type EmailTransport } from "@/lib/email/types";
import { processQuestionnaireSubmission, type SubmissionDeps } from "@/lib/questionnaires/processSubmission.server";
import type { SubmissionRecord, SubmissionStore } from "@/lib/questionnaires/submissionStore.server";
import { artisansValues, doValues, rcdPibValues, simulation, TEST_EMAIL } from "../fixtures/questionnaires";

const ID = "6b3f0f8e-1b2c-4d5e-8f90-123456789abc";

function memoryStore(): SubmissionStore & { records: Map<string, SubmissionRecord> } {
  const records = new Map<string, SubmissionRecord>();
  return {
    records,
    async get(id) {
      return records.get(id) ?? null;
    },
    async create(id, record) {
      if (records.has(id)) return false;
      records.set(id, record);
      return true;
    },
    async update(id, record) {
      records.set(id, record);
    },
    async remove(id) {
      records.delete(id);
    },
  };
}

function fakeTransport(behaviour: "ok" | "fail" = "ok") {
  const sent: { message: EmailMessage; idempotencyKey: string }[] = [];
  const transport: EmailTransport = {
    name: "fake",
    async send(message, { idempotencyKey }) {
      if (behaviour === "fail") throw new EmailDeliveryError("fournisseur indisponible");
      sent.push({ message, idempotencyKey });
      return { id: `email-${sent.length}` };
    },
  };
  return { transport, sent };
}

function deps(overrides: Partial<SubmissionDeps> & { settings?: Partial<EmailSettings> } = {}) {
  const store = memoryStore();
  const mail = fakeTransport();
  const { settings, ...rest } = overrides;
  const d: SubmissionDeps = {
    store,
    emailSettings: () => ({ transport: mail.transport, bcc: ["cabinet@example.com"], replyTo: "contact@example.com", ...settings }),
    activityName: async () => "Plomberie seul",
    now: () => new Date("2026-11-04T10:30:00Z"),
    log: () => undefined,
    ...rest,
  };
  return { d, store: (rest.store as ReturnType<typeof memoryStore>) ?? store, mail };
}

const request = (type: "artisans" | "do" | "rcd-pib", values: unknown, submissionId = ID) => ({ submissionId, type, values, simulation });

describe("Soumission d'un questionnaire — PDF et e-mail", () => {
  it.each([
    ["artisans", artisansValues()],
    ["do", doValues()],
    ["rcd-pib", rcdPibValues()],
  ] as const)("%s : PDF généré, joint à l'e-mail envoyé au demandeur, renvoyé au navigateur", async (type, values) => {
    const { d, mail, store } = deps();
    const outcome = await processQuestionnaireSubmission(request(type, values), d);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome).toMatchObject({ submissionId: ID, reference: "6B3F0F8E", emailSentTo: TEST_EMAIL, duplicate: false });

    expect(mail.sent).toHaveLength(1);
    const { message, idempotencyKey } = mail.sent[0]!;
    expect(message.to).toBe(TEST_EMAIL);
    expect(message.bcc).toEqual(["cabinet@example.com"]);
    expect(message.replyTo).toBe("contact@example.com");
    expect(idempotencyKey).toBe(ID);
    expect(message.subject).toContain("réf. 6B3F0F8E");
    expect(message.text).toContain("Nous avons bien reçu votre questionnaire");
    expect(message.attachments).toHaveLength(1);
    const [attachment] = message.attachments;
    expect(attachment!.contentType).toBe("application/pdf");
    expect(attachment!.filename).toMatch(new RegExp(`^questionnaire-${type}-.+\\.pdf$`));
    // La pièce jointe est bien le PDF renvoyé au navigateur, et un PDF valide.
    expect(Buffer.from(attachment!.content).toString("base64")).toBe(outcome.pdf.base64);
    expect((await PDFDocument.load(attachment!.content)).getPageCount()).toBeGreaterThanOrEqual(1);

    expect(store.records.get(ID)).toMatchObject({ status: "sent", type, recipient: TEST_EMAIL, emailId: "email-1" });
  });

  it("une seconde soumission (double clic, rechargement) n'envoie pas de second e-mail mais renvoie le PDF", async () => {
    const { d, mail } = deps();
    const first = await processQuestionnaireSubmission(request("do", doValues()), d);
    const second = await processQuestionnaireSubmission(request("do", doValues()), d);
    expect(mail.sent).toHaveLength(1);
    expect(second).toMatchObject({ ok: true, duplicate: true, submissionId: ID });
    expect(first.ok && second.ok && second.pdf.base64 === first.pdf.base64).toBe(true);
  });

  it("deux envois simultanés : un seul e-mail", async () => {
    const { d, mail } = deps();
    const outcomes = await Promise.all([
      processQuestionnaireSubmission(request("artisans", artisansValues()), d),
      processQuestionnaireSubmission(request("artisans", artisansValues()), d),
    ]);
    expect(mail.sent).toHaveLength(1);
    expect(outcomes.filter((o) => o.ok)).toHaveLength(1);
    expect(outcomes.find((o) => !o.ok)).toMatchObject({ status: 409, code: "IN_PROGRESS" });
  });

  it("échec de l'e-mail : pas de succès, verrou libéré, un nouvel essai fonctionne", async () => {
    const store = memoryStore();
    const failing = fakeTransport("fail");
    const { d } = deps({ store, settings: { transport: failing.transport } });
    const outcome = await processQuestionnaireSubmission(request("rcd-pib", rcdPibValues()), d);
    expect(outcome).toMatchObject({ ok: false, status: 502, code: "EMAIL_FAILED" });
    expect(store.records.size).toBe(0);

    const ok = fakeTransport();
    const retry = await processQuestionnaireSubmission(request("rcd-pib", rcdPibValues()), { ...d, emailSettings: () => ({ transport: ok.transport, bcc: [] }) });
    expect(retry.ok).toBe(true);
    expect(ok.sent).toHaveLength(1);
  });

  it("e-mail non configuré : pas de succès, rien n'est enregistré", async () => {
    const { d, store } = deps({
      emailSettings: () => {
        throw new EmailNotConfiguredError("RESEND_API_KEY manquant");
      },
    });
    expect(await processQuestionnaireSubmission(request("do", doValues()), d)).toMatchObject({ ok: false, status: 503, code: "EMAIL_NOT_CONFIGURED" });
    expect(store.records.size).toBe(0);
  });

  it("e-mail du client absent ou invalide : refus avec le détail, aucun envoi", async () => {
    const { d, mail } = deps();
    const missing = doValues();
    missing.owner.email = "";
    const invalid = artisansValues();
    invalid.identification.email = "pas-un-email";
    const a = await processQuestionnaireSubmission(request("do", missing), d);
    const b = await processQuestionnaireSubmission(request("artisans", invalid), d);
    expect(a).toMatchObject({ ok: false, status: 422, code: "INVALID_DATA" });
    expect(!a.ok && a.errors).toContain("owner.email : Veuillez renseigner votre e-mail.");
    expect(b).toMatchObject({ ok: false, status: 422 });
    expect(mail.sent).toHaveLength(0);
  });

  it("données de questionnaire invalides (champs obligatoires, totaux) : refus côté serveur", async () => {
    const { d } = deps();
    const v = artisansValues();
    v.activity.professionalShare = "10";
    v.activities = v.activities.map((a) => ({ ...a, selected: false }));
    const outcome = await processQuestionnaireSubmission(request("artisans", v), d);
    expect(!outcome.ok && outcome.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("Particuliers + Professionnels"), "activities : Sélectionnez au moins une activité."]),
    );
  });

  it("requête mal formée : refus", async () => {
    const { d } = deps();
    expect(await processQuestionnaireSubmission({ type: "do" }, d)).toMatchObject({ status: 400 });
    expect(await processQuestionnaireSubmission(request("inconnu" as never, {}), d)).toMatchObject({ status: 400 });
    expect(await processQuestionnaireSubmission({ ...request("do", doValues()), submissionId: "123" }, d)).toMatchObject({ status: 400 });
  });

  it("destinataire de test (QUESTIONNAIRE_EMAIL_REDIRECT_TO) : l'e-mail part vers l'adresse de test, jamais vers le client", async () => {
    const { d, mail } = deps({ settings: { redirectTo: "recette@example.com" } });
    await processQuestionnaireSubmission(request("do", doValues()), d);
    expect(mail.sent[0]!.message.to).toBe("recette@example.com");
    expect(mail.sent[0]!.message.subject).toContain(`[TEST — destinataire prévu : ${TEST_EMAIL}]`);
  });

  it("verrou « en cours » abandonné depuis plus de 5 minutes : libéré", async () => {
    const { d, store, mail } = deps();
    await store.create(ID, { status: "processing", type: "do", values: {}, simulation: null, submittedAt: "2026-11-04T10:00:00Z", recipient: TEST_EMAIL, updatedAt: "2026-11-04T10:00:00Z" });
    expect((await processQuestionnaireSubmission(request("do", doValues()), d)).ok).toBe(true);
    expect(mail.sent).toHaveLength(1);
  });
});

describe("Échec de génération du PDF", () => {
  it("pas de succès, aucun e-mail, rien d'enregistré", async () => {
    vi.resetModules();
    vi.doMock("@/lib/pdf/questionnairePdf", async (importOriginal) => ({
      ...(await importOriginal<object>()),
      renderQuestionnairePdf: async () => {
        throw new Error("pdf cassé");
      },
    }));
    const { processQuestionnaireSubmission: process } = await import("@/lib/questionnaires/processSubmission.server");
    const { d, mail, store } = deps();
    expect(await process(request("do", doValues()), d)).toMatchObject({ ok: false, status: 500, code: "PDF_FAILED" });
    expect(mail.sent).toHaveLength(0);
    expect(store.records.size).toBe(0);
    vi.doUnmock("@/lib/pdf/questionnairePdf");
  });
});
