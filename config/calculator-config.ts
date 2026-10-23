/**
 * Paramètres applicatifs du simulateur (hors tarifs).
 * Les tarifs, eux, vivent dans data/pricing-data.ts et dans l'administration.
 */
export const localeConfig = {
  locale: "fr-FR",
  currency: "EUR",
} as const;

export const storageConfig = {
  /** Fichier où l'administration enregistre la grille (sans Blob store : développement, serveur Node). */
  pricingConfigPath: process.env.PRICING_CONFIG_PATH ?? "storage/pricing-config.json",
  /** Jeton fourni automatiquement par Vercel quand un Blob store est relié au projet. */
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
  /** Doit correspondre au type du Blob store créé sur Vercel (« private » par défaut). */
  blobAccess: process.env.PRICING_BLOB_ACCESS === "public" ? "public" : "private",
} as const;

export const simulatorContent = {
  disclaimer:
    "Estimation indicative et non contractuelle, établie à partir de notre grille tarifaire en vigueur. Le tarif définitif dépend de l'étude de votre dossier par nos équipes.",
  contactLabel: "Demander une étude personnalisée",
} as const;
