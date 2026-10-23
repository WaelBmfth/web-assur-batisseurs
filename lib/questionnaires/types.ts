import type { z } from "zod";
import type { artisansSchema, doSchema, rcdPibSchema } from "./schemas";

export type QuestionnaireType = "artisans" | "do" | "rcd-pib";

export const questionnaireTypes = ["artisans", "do", "rcd-pib"] as const satisfies readonly QuestionnaireType[];

export function isQuestionnaireType(value: unknown): value is QuestionnaireType {
  return typeof value === "string" && (questionnaireTypes as readonly string[]).includes(value);
}

/** Choix faits dans le simulateur, transmis au questionnaire (via l'URL). */
export type SimulatorSnapshot = {
  activityId: string;
  /** Chiffre d'affaires prévisionnel (€ HT). */
  revenue: number;
  includeLegalProtection: boolean;
  companyName: string;
};

/** Données validées de chaque fiche (sortie des schémas Zod : nombres, `null` si vide…). */
export type ArtisansQuestionnaireData = z.output<typeof artisansSchema>;
export type DOQuestionnaireData = z.output<typeof doSchema>;
export type RCDPIBQuestionnaireData = z.output<typeof rcdPibSchema>;

/** Valeurs de formulaire (saisie brute, avant validation). */
export type ArtisansQuestionnaireValues = z.input<typeof artisansSchema>;
export type DOQuestionnaireValues = z.input<typeof doSchema>;
export type RCDPIBQuestionnaireValues = z.input<typeof rcdPibSchema>;

export type QuestionnaireSubmission =
  | { type: "artisans"; data: ArtisansQuestionnaireData; simulation: SimulatorSnapshot | null }
  | { type: "do"; data: DOQuestionnaireData; simulation: SimulatorSnapshot | null }
  | { type: "rcd-pib"; data: RCDPIBQuestionnaireData; simulation: SimulatorSnapshot | null };
