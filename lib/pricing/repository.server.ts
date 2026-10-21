import path from "node:path";
import { storageConfig } from "@/config/calculator-config";
import { defaultPricingConfig } from "@/data/pricing-data";
import type { PricingConfig } from "@/types/pricing";
import { bumpVersion } from "./configOperations";
import { validatePricingConfig } from "./schema";
import { createBlobStore } from "./stores/blobStore.server";
import { createFileStore } from "./stores/fileStore.server";
import type { PricingStore } from "./stores/types";

export { StorageUnavailableError, VersionConflictError } from "./stores/types";

/**
 * Accès à la configuration tarifaire en vigueur (côté serveur uniquement).
 *
 * Tant que rien n'a été enregistré, la grille initiale de data/pricing-data.ts
 * (valeurs Excel) s'applique. Le support de stockage est interchangeable
 * (`PricingStore`) : fichier JSON en local, Vercel Blob en production.
 */
export interface PricingRepository {
  load(): Promise<PricingConfig>;
  /** Valide puis enregistre une configuration ; retourne la version enregistrée. */
  save(config: unknown): Promise<PricingConfig>;
  reset(): Promise<PricingConfig>;
}

export class SaveValidationError extends Error {
  constructor(public readonly errors: string[]) {
    super("Configuration tarifaire invalide.");
  }
}

export function createRepository(store: PricingStore): PricingRepository {
  async function load(): Promise<PricingConfig> {
    const stored = await store.readLatest();
    if (stored === null) return defaultPricingConfig;
    const result = validatePricingConfig(stored);
    if (result.success) return result.data;
    console.error("[pricing] Configuration enregistrée invalide, valeurs par défaut utilisées.", result.errors);
    return defaultPricingConfig;
  }

  async function writeNext(config: PricingConfig): Promise<PricingConfig> {
    const current = await load();
    const next = bumpVersion(config, current.version);
    await store.write(next);
    return next;
  }

  return {
    load,
    async save(input) {
      const result = validatePricingConfig(input);
      if (!result.success) throw new SaveValidationError(result.errors);
      return writeNext(result.data);
    },
    reset: () => writeNext(defaultPricingConfig),
  };
}

export function createFileRepository(filePath: string): PricingRepository {
  return createRepository(createFileStore(filePath));
}

/** Vercel Blob si un Blob store est relié au projet (BLOB_READ_WRITE_TOKEN), sinon fichier local. */
function createDefaultRepository(): PricingRepository {
  if (storageConfig.blobToken) {
    return createRepository(createBlobStore({ access: storageConfig.blobAccess, token: storageConfig.blobToken }));
  }
  return createFileRepository(path.resolve(/*turbopackIgnore: true*/ process.cwd(), storageConfig.pricingConfigPath));
}

export const pricingRepository: PricingRepository = createDefaultRepository();
