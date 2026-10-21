import type { PricingConfig } from "@/types/pricing";
import type { PeriodTotals, QuoteInput, QuoteResult, AmountRange } from "@/types/simulator";
import {
  addToRange,
  findActivity,
  findBracket,
  getCoveredRevenueRange,
  resolveLegalProtectionAmount,
  resolvePremiumRange,
  roundCurrency,
  toMonthly,
} from "./pricingRules";

function periodTotals(
  insurance: AmountRange,
  legalProtection: number,
  brokerage: number,
  installmentsPerYear: number,
): PeriodTotals {
  const total = addToRange(insurance, legalProtection, brokerage);
  return { brokerage, total, monthly: toMonthly(total, installmentsPerYear) };
}

/**
 * Moteur de calcul du devis — fonction pure, sans dépendance à React.
 *
 * Reproduit la feuille « Tarificateur Global BTP » de l'Excel :
 *   Total bas   = prime min. + PJ éventuelle + courtage de l'année
 *   Total haut  = prime max. + PJ éventuelle + courtage de l'année
 *   Mensualité  = total / 12
 * avec le courtage de 1ère année (E6) pour l'année 1 et celui des années suivantes (E7) ensuite.
 */
export function calculateQuote(input: QuoteInput, config: PricingConfig): QuoteResult {
  const activity = findActivity(config, input.activityId);
  if (!activity) {
    return { ok: false, code: "ACTIVITY_NOT_FOUND", message: "Activité introuvable." };
  }
  if (!activity.active) {
    return {
      ok: false,
      code: "ACTIVITY_INACTIVE",
      message: "Cette activité n'est plus proposée dans le simulateur.",
    };
  }
  if (!Number.isFinite(input.revenue) || input.revenue <= 0) {
    return {
      ok: false,
      code: "INVALID_REVENUE",
      message: "Le chiffre d'affaires doit être supérieur à 0 €.",
    };
  }

  const lookup = findBracket(activity, input.revenue);
  if (!lookup.found) {
    const range = getCoveredRevenueRange(activity);
    const coverage = {
      minCoveredRevenue: range?.min,
      maxCoveredRevenue: range?.max ?? undefined,
    };
    // QUESTION CLIENT:
    // Quel tarif appliquer lorsque le CA sort des tranches définies (ex. > 250 000 €,
    // ou > 50 000 € pour « Électricien seul ») ?
    // CONTEXTE:
    // L'Excel n'utilise pas le CA dans ses formules (B7 n'est référencé nulle part) et ne
    // définit qu'une tranche par activité. Faute de règle, aucune estimation n'est produite
    // et l'utilisateur est invité à demander une étude personnalisée.
    if (lookup.reason === "above") {
      return {
        ok: false,
        code: "REVENUE_ABOVE_RANGE",
        message:
          "Votre chiffre d'affaires dépasse la tranche couverte par notre grille en ligne pour cette activité.",
        ...coverage,
      };
    }
    if (lookup.reason === "below") {
      return {
        ok: false,
        code: "REVENUE_BELOW_RANGE",
        message:
          "Votre chiffre d'affaires est inférieur à la tranche couverte par notre grille en ligne pour cette activité.",
        ...coverage,
      };
    }
    return {
      ok: false,
      code: "NO_MATCHING_BRACKET",
      message: "Aucune tranche tarifaire ne correspond à ce chiffre d'affaires pour cette activité.",
      ...coverage,
    };
  }

  const { bracket } = lookup;
  const insurance = resolvePremiumRange(bracket);
  const legalProtection = resolveLegalProtectionAmount(config, input.includeLegalProtection);
  const { year1, followingYears } = config.brokerageFees;
  const installments = config.installmentsPerYear;

  return {
    ok: true,
    activity: { id: activity.id, name: activity.name, category: activity.category },
    bracket,
    revenue: input.revenue,
    insurance,
    legalProtection: {
      included: input.includeLegalProtection && config.legalProtection.enabled,
      amount: legalProtection,
    },
    year1: periodTotals(insurance, legalProtection, year1, installments),
    followingYears: periodTotals(insurance, legalProtection, followingYears, installments),
    brokerageSavings: roundCurrency(year1 - followingYears),
    installmentsPerYear: installments,
    pricingVersion: config.version,
  };
}
