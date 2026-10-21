import type { Activity, PremiumBracket, PricingConfig } from "@/types/pricing";
import type { AmountRange } from "@/types/simulator";

/** Arrondi au centime (les montants sont affichés à 2 décimales dans l'Excel). */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function sortBrackets(brackets: readonly PremiumBracket[]): PremiumBracket[] {
  return [...brackets].sort((a, b) => a.revenueMin - b.revenueMin);
}

/** Activités proposées dans le simulateur : actives, triées par ordre d'affichage. */
export function getSelectableActivities(config: PricingConfig): Activity[] {
  return config.activities
    .filter((activity) => activity.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"));
}

export function findActivity(config: PricingConfig, activityId: string): Activity | undefined {
  return config.activities.find((activity) => activity.id === activityId);
}

/** Plage de CA couverte par l'ensemble des tranches d'une activité. */
export function getCoveredRevenueRange(
  activity: Activity,
): { min: number; max: number | null } | null {
  const brackets = sortBrackets(activity.brackets);
  const first = brackets[0];
  if (!first) return null;
  const max = brackets.some((b) => b.revenueMax === null)
    ? null
    : Math.max(...brackets.map((b) => b.revenueMax ?? 0));
  return { min: first.revenueMin, max };
}

export type BracketLookup =
  | { found: true; bracket: PremiumBracket }
  | { found: false; reason: "below" | "above" | "gap" };

/**
 * Recherche la tranche couvrant le CA. Bornes incluses (« 0 à 250 000 € »).
 * Si deux tranches se chevauchent sur une borne, la première (CA min. le plus bas) l'emporte.
 */
export function findBracket(activity: Activity, revenue: number): BracketLookup {
  const brackets = sortBrackets(activity.brackets);
  const match = brackets.find(
    (b) => revenue >= b.revenueMin && (b.revenueMax === null || revenue <= b.revenueMax),
  );
  if (match) return { found: true, bracket: match };

  const range = getCoveredRevenueRange(activity);
  if (range && revenue < range.min) return { found: false, reason: "below" };
  if (range && range.max !== null && revenue > range.max) return { found: false, reason: "above" };
  return { found: false, reason: "gap" };
}

/**
 * Fourchette de prime d'assurance d'une tranche.
 * Bas = minimum de prime ; haut = borne haute, ou le minimum si aucune borne haute n'est définie.
 */
export function resolvePremiumRange(bracket: PremiumBracket): AmountRange {
  return {
    min: bracket.premiumMin,
    max: bracket.premiumMax ?? bracket.premiumMin,
  };
}

/** Excel : =IF($B$8="Oui",$E$8,0) — et 0 si l'option est désactivée dans l'administration. */
export function resolveLegalProtectionAmount(config: PricingConfig, include: boolean): number {
  return include && config.legalProtection.enabled ? config.legalProtection.price : 0;
}

/** Excel : =SUM(prime, PJ, courtage). */
export function addToRange(range: AmountRange, ...amounts: number[]): AmountRange {
  const extra = amounts.reduce((sum, amount) => sum + amount, 0);
  return { min: roundCurrency(range.min + extra), max: roundCurrency(range.max + extra) };
}

/** Excel : =total / 12. */
export function toMonthly(range: AmountRange, installmentsPerYear: number): AmountRange {
  return {
    min: roundCurrency(range.min / installmentsPerYear),
    max: roundCurrency(range.max / installmentsPerYear),
  };
}
