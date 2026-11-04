import type { SubmissionFailure, SubmissionSuccess } from "./processSubmission.server";
import type { QuestionnaireType, SimulatorSnapshot } from "./types";

export type { SubmissionSuccess };

export type SubmissionPayload = {
  /** Identifiant stable de la soumission : le serveur n'envoie jamais deux fois le même. */
  submissionId: string;
  type: QuestionnaireType;
  /** Valeurs saisies ; le serveur les revalide avec le même schéma que le formulaire. */
  values: unknown;
  simulation: SimulatorSnapshot | null;
};

export type ClientSubmissionResult = SubmissionSuccess | Pick<SubmissionFailure, "ok" | "message" | "code" | "errors">;

/**
 * Envoi d'un questionnaire validé à l'API : le serveur génère le PDF et l'envoie
 * par e-mail au demandeur, puis renvoie le PDF pour téléchargement.
 */
export async function submitQuestionnaire(payload: SubmissionPayload): Promise<ClientSubmissionResult> {
  try {
    const response = await fetch("/api/questionnaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ClientSubmissionResult | null;
    if (body && typeof body === "object" && "ok" in body) return body;
    return { ok: false, code: "EMAIL_FAILED", message: `L'envoi n'a pas abouti (erreur ${response.status}). Merci de réessayer.` };
  } catch {
    return { ok: false, code: "EMAIL_FAILED", message: "Le serveur est injoignable. Vérifiez votre connexion puis réessayez." };
  }
}
