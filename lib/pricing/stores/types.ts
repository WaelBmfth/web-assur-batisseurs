import type { PricingConfig } from "@/types/pricing";

/**
 * Support de stockage brut de la grille tarifaire.
 * Le dépôt (repository.server.ts) s'occupe de la validation et du versioning ;
 * un store se contente de lire la dernière version et d'en écrire une nouvelle.
 */
export interface PricingStore {
  /** Dernière configuration enregistrée (non validée), ou `null` si aucune. */
  readLatest(): Promise<unknown | null>;
  /** Écrit une nouvelle version. Doit échouer si cette version existe déjà. */
  write(config: PricingConfig): Promise<void>;
}

/** Stockage indisponible (ex. : Vercel sans Blob store relié au projet). */
export class StorageUnavailableError extends Error {}

/** Une autre version a été enregistrée entre-temps (deux enregistrements simultanés). */
export class VersionConflictError extends Error {}
