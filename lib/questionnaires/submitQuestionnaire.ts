import type { QuestionnaireSubmission } from "./types";

export type SubmitResult = {
  /** `false` tant que l'API n'est pas branchée : l'état de succès le signale au visiteur. */
  delivered: boolean;
};

/**
 * Envoi d'un questionnaire validé.
 *
 * TODO: connecter à l'API AssurBâtisseurs (aucune API n'existe encore).
 * Remplacer le corps de cette fonction par l'appel réel et renvoyer
 * `{ delivered: true }` ; une erreur levée est affichée au visiteur.
 * Les formulaires l'appellent avec des données déjà validées et typées.
 */
export async function submitQuestionnaire(submission: QuestionnaireSubmission): Promise<SubmitResult> {
  if (process.env.NODE_ENV !== "production") {
    console.info("[questionnaire] Soumission (non envoyée : API à connecter)", submission);
  }
  return { delivered: false };
}
