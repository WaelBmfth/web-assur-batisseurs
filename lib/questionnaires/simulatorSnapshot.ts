import { z } from "zod";
import { isQuestionnaireType, type QuestionnaireType, type SimulatorSnapshot } from "./types";

/**
 * Transmission des choix du simulateur vers la page questionnaire par l'URL :
 * pas d'état global, rechargement et retour arrière sans perte de données.
 */
export const STUDY_REQUEST_PATH = "/etude-personnalisee";

const params = {
  activityId: "activite",
  revenue: "ca",
  includeLegalProtection: "pj",
  companyName: "societe",
  questionnaire: "questionnaire",
} as const;

/** Valeur de `?questionnaire=` qui force l'affichage du choix du questionnaire. */
export const CHOOSE_QUESTIONNAIRE = "choisir";
export type QuestionnaireRequest = QuestionnaireType | typeof CHOOSE_QUESTIONNAIRE;

export function buildStudyRequestHref(snapshot: SimulatorSnapshot, questionnaire?: QuestionnaireRequest): string {
  const search = new URLSearchParams({
    [params.activityId]: snapshot.activityId,
    [params.revenue]: String(snapshot.revenue),
    [params.includeLegalProtection]: snapshot.includeLegalProtection ? "oui" : "non",
  });
  if (snapshot.companyName.trim()) search.set(params.companyName, snapshot.companyName.trim());
  if (questionnaire) search.set(params.questionnaire, questionnaire);
  return `${STUDY_REQUEST_PATH}?${search.toString()}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const snapshotSchema = z.object({
  activityId: z.string().trim().min(1).max(200),
  revenue: z.coerce.number().finite().positive(),
  includeLegalProtection: z.enum(["oui", "non"]).transform((v) => v === "oui"),
  companyName: z.string().trim().max(200).default(""),
});

/** Relit la simulation depuis l'URL ; `null` si absente ou invalide (accès direct à la page). */
export function parseSimulatorSnapshot(searchParams: SearchParams): SimulatorSnapshot | null {
  const result = snapshotSchema.safeParse({
    activityId: first(searchParams[params.activityId]),
    revenue: first(searchParams[params.revenue]),
    includeLegalProtection: first(searchParams[params.includeLegalProtection]),
    companyName: first(searchParams[params.companyName]),
  });
  return result.success ? result.data : null;
}

/** Questionnaire demandé explicitement (?questionnaire=…) : un type, le choix, ou `null` (règle métier). */
export function parseRequestedQuestionnaire(searchParams: SearchParams): QuestionnaireRequest | null {
  const value = first(searchParams[params.questionnaire]);
  return isQuestionnaireType(value) || value === CHOOSE_QUESTIONNAIRE ? value : null;
}

/** Lien vers un questionnaire donné (ou vers le choix), en conservant la simulation éventuelle. */
export function questionnaireHref(request: QuestionnaireRequest, snapshot: SimulatorSnapshot | null): string {
  return snapshot ? buildStudyRequestHref(snapshot, request) : `${STUDY_REQUEST_PATH}?${params.questionnaire}=${request}`;
}
