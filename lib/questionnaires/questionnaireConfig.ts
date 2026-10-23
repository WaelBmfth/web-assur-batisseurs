import type { QuestionnaireType, SimulatorSnapshot } from "./types";

/** Description des trois fiches de pré-tarification (titres repris des fiches Excel). */
export const questionnaireConfig = {
  artisans: {
    title: "Fiche de pré-tarification assurance bâtiment (artisans)",
    heading: { title: "Fiche de pré-tarification", highlight: "assurance bâtiment (artisans)" },
    shortLabel: "Artisans / entreprise du bâtiment",
    description: "Pour les entreprises et artisans qui réalisent des travaux de bâtiment.",
    source: "Fiche_Pretarification_ASSURBATISSEURS_Artisans_A1.xlsx",
  },
  do: {
    title: "Fiche préta DO (Dommages Ouvrage)",
    heading: { title: "Fiche préta DO", highlight: "(Dommages Ouvrage)" },
    shortLabel: "Maître d'ouvrage — Dommages Ouvrage",
    description: "Pour les maîtres d'ouvrage qui font construire (D.O, RCMO, GFA, CNR).",
    source: "Fiche_Preta_DO.xlsx",
  },
  "rcd-pib": {
    title: "Fiche préta RCD PIB",
    heading: { title: "Fiche préta", highlight: "RCD PIB" },
    shortLabel: "Concepteurs / professions intellectuelles du bâtiment",
    description: "Pour les architectes, bureaux d'études, maîtres d'œuvre et autres activités intellectuelles du bâtiment.",
    source: "Fiche_Preta_RCD_PIB.xlsx",
  },
} as const satisfies Record<
  QuestionnaireType,
  { title: string; heading: { title: string; highlight: string }; shortLabel: string; description: string; source: string }
>;

/**
 * RÈGLES MÉTIER : activité du simulateur → questionnaire.
 *
 * QUESTION CLIENT:
 * Quel questionnaire correspond à chaque activité du simulateur ?
 * CONTEXTE:
 * Les règles définitives ne sont pas encore confirmées. Tant qu'une activité n'a
 * pas de règle ici, `getQuestionnaireType` renvoie `null` et la page propose au
 * visiteur de choisir lui-même son questionnaire.
 *
 * Pour ajouter une règle, associer l'identifiant d'activité (data/pricing-data.ts)
 * au type de questionnaire, par exemple :
 *   "plomberie-seul": "artisans",
 *   "architecte-avec-suivi-de-travaux-seul": "rcd-pib",
 */
export const questionnaireRulesByActivity: Readonly<Record<string, QuestionnaireType>> = {
  // TODO: renseigner les règles définitives une fois confirmées par la cliente.
};

/** Seul point de décision « simulation → questionnaire ». */
export function getQuestionnaireType(
  simulation: SimulatorSnapshot | null,
  rules: Readonly<Record<string, QuestionnaireType>> = questionnaireRulesByActivity,
): QuestionnaireType | null {
  if (!simulation) return null;
  return rules[simulation.activityId] ?? null;
}
