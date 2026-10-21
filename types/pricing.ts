/**
 * Modèle de données tarifaires.
 *
 * Ce modèle reproduit la structure du fichier Excel
 * « TARIFICATEUR ASSURBATISSEURS - FOURCHETTES - SITE INTERNET » :
 * une activité possède une ou plusieurs tranches de chiffre d'affaires,
 * chacune portant une fourchette de prime d'assurance TTC
 * (minimum de prime = bas de fourchette, borne haute = haut de fourchette).
 */

/** Tranche de chiffre d'affaires (€ HT) et fourchette de prime associée (€ TTC). */
export type PremiumBracket = {
  id: string;
  /** CA minimum couvert, inclus (€ HT). */
  revenueMin: number;
  /** CA maximum couvert, inclus (€ HT). `null` = pas de plafond. */
  revenueMax: number | null;
  /** Minimum de prime : bas de la fourchette (€ TTC). Valeur susceptible d'évoluer. */
  premiumMin: number;
  /** Borne haute de la fourchette (€ TTC). `null` = prime fixe égale au minimum. */
  premiumMax: number | null;
};

export type Activity = {
  id: string;
  name: string;
  /** Catégorie au format « Famille / Sous-famille » (colonne L de l'Excel). */
  category: string;
  active: boolean;
  sortOrder: number;
  brackets: PremiumBracket[];
};

export type BrokerageFees = {
  /** Frais de courtage / gestion de dossier la 1ère année (€). */
  year1: number;
  /** Frais de courtage à partir de la 2ème année (€). */
  followingYears: number;
};

export type LegalProtectionSettings = {
  /** Option proposée dans le simulateur. */
  enabled: boolean;
  /** Prix annuel TTC de l'option (€). */
  price: number;
};

export type PricingConfig = {
  /** Incrémenté à chaque enregistrement depuis l'administration. */
  version: number;
  /** Date ISO de dernière modification. */
  updatedAt: string;
  /** Nombre d'échéances pour la mensualité indicative (Excel : total / 12). */
  installmentsPerYear: number;
  brokerageFees: BrokerageFees;
  legalProtection: LegalProtectionSettings;
  activities: Activity[];
};
