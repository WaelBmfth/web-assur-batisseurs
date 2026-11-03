import { buildStudyRequestHref, parseSimulatorSnapshot } from "@/lib/questionnaires/simulatorSnapshot";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";

/**
 * Reprise du simulateur après la redirection « CA au-delà de la grille » :
 * avant de quitter la page, les réponses sont écrites dans l'URL de l'entrée
 * d'historique courante ; le bouton Retour du navigateur y revient et le
 * simulateur rouvre l'étape 2 avec ces réponses. Mêmes paramètres que la page questionnaire.
 */
const RESUME_PARAM = "reprise";
const RESUME_AT_REVENUE = "chiffre-affaires";

/** Paramètres d'URL (« ?activite=…&ca=…&reprise=chiffre-affaires ») décrivant la simulation à reprendre. */
export function buildResumeSearch(snapshot: SimulatorSnapshot): string {
  const search = new URLSearchParams(buildStudyRequestHref(snapshot).split("?")[1]);
  search.set(RESUME_PARAM, RESUME_AT_REVENUE);
  return `?${search.toString()}`;
}

/** Simulation à reprendre, ou `null` si l'URL n'en décrit pas (visite normale). */
export function parseResumeState(search: string): SimulatorSnapshot | null {
  const params = new URLSearchParams(search);
  if (params.get(RESUME_PARAM) !== RESUME_AT_REVENUE) return null;
  return parseSimulatorSnapshot(Object.fromEntries(params));
}
