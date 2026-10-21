import type { Activity, PremiumBracket } from "./pricing";

export type QuoteInput = {
  activityId: string;
  /** Chiffre d'affaires prévisionnel (€ HT). */
  revenue: number;
  includeLegalProtection: boolean;
};

export type AmountRange = {
  min: number;
  max: number;
};

export type PeriodTotals = {
  /** Frais de courtage appliqués sur la période. */
  brokerage: number;
  /** Budget annuel total (prime + PJ + courtage). */
  total: AmountRange;
  /** Mensualité indicative (total / nombre d'échéances). */
  monthly: AmountRange;
};

export type QuoteSuccess = {
  ok: true;
  activity: Pick<Activity, "id" | "name" | "category">;
  bracket: PremiumBracket;
  revenue: number;
  /** Prime d'assurance seule (fourchette TTC). */
  insurance: AmountRange;
  legalProtection: {
    included: boolean;
    /** Montant ajouté au budget (0 si non incluse). */
    amount: number;
  };
  year1: PeriodTotals;
  followingYears: PeriodTotals;
  /** Écart de courtage entre l'année 1 et les années suivantes. */
  brokerageSavings: number;
  installmentsPerYear: number;
  pricingVersion: number;
};

export type QuoteErrorCode =
  | "ACTIVITY_NOT_FOUND"
  | "ACTIVITY_INACTIVE"
  | "INVALID_REVENUE"
  | "REVENUE_ABOVE_RANGE"
  | "REVENUE_BELOW_RANGE"
  | "NO_MATCHING_BRACKET";

export type QuoteFailure = {
  ok: false;
  code: QuoteErrorCode;
  message: string;
  /** CA maximum couvert par l'activité, lorsqu'il est connu. */
  maxCoveredRevenue?: number;
  minCoveredRevenue?: number;
};

export type QuoteResult = QuoteSuccess | QuoteFailure;
