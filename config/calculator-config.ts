/**
 * Paramètres applicatifs du simulateur (hors tarifs).
 * Les tarifs, eux, vivent dans data/pricing-data.ts et dans l'administration.
 */
export const localeConfig = {
  locale: "fr-FR",
  currency: "EUR",
} as const;

export const storageConfig = {
  /** Fichier où l'administration enregistre la configuration tarifaire en vigueur. */
  pricingConfigPath: process.env.PRICING_CONFIG_PATH ?? "storage/pricing-config.json",
} as const;

export const simulatorContent = {
  title: "Estimez votre assurance BTP en 2 minutes",
  subtitle:
    "Responsabilité civile & décennale pour les artisans et professionnels de la conception. Obtenez une fourchette de budget indicative, sans engagement.",
  disclaimer:
    "Estimation indicative et non contractuelle, établie à partir de notre grille tarifaire en vigueur. Le tarif définitif dépend de l'étude de votre dossier par nos équipes.",
  contactLabel: "Demander une étude personnalisée",
  contactHref: "mailto:contact@assurbatisseurs.fr",
} as const;
