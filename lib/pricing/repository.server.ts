import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { storageConfig } from "@/config/calculator-config";
import { defaultPricingConfig } from "@/data/pricing-data";
import type { PricingConfig } from "@/types/pricing";
import { bumpVersion } from "./configOperations";
import { validatePricingConfig } from "./schema";

/**
 * Accès à la configuration tarifaire en vigueur (côté serveur uniquement).
 *
 * Implémentation prototype : un fichier JSON local, initialisé à partir de
 * data/pricing-data.ts (valeurs Excel). Pour passer à une base de données,
 * il suffit de fournir une autre implémentation de `PricingRepository`.
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

export function createFileRepository(filePath: string): PricingRepository {
  const historyDir = path.join(path.dirname(filePath), "history");

  async function readStored(): Promise<PricingConfig | null> {
    try {
      const raw = await readFile(filePath, "utf8");
      const result = validatePricingConfig(JSON.parse(raw));
      if (result.success) return result.data;
      console.error("[pricing] Fichier de configuration invalide, valeurs par défaut utilisées.", result.errors);
      return null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.error("[pricing] Lecture de la configuration impossible.", error);
      }
      return null;
    }
  }

  async function write(config: PricingConfig): Promise<void> {
    await mkdir(historyDir, { recursive: true });
    const json = `${JSON.stringify(config, null, 2)}\n`;
    // Écriture atomique puis archivage de la version (historique des tarifs).
    const tmp = `${filePath}.tmp`;
    await writeFile(tmp, json, "utf8");
    await rename(tmp, filePath);
    await writeFile(path.join(historyDir, `v${config.version}.json`), json, "utf8");
  }

  async function load(): Promise<PricingConfig> {
    return (await readStored()) ?? defaultPricingConfig;
  }

  return {
    load,
    async save(input) {
      const result = validatePricingConfig(input);
      if (!result.success) throw new SaveValidationError(result.errors);
      const current = await load();
      const next = bumpVersion(result.data, current.version);
      await write(next);
      return next;
    },
    async reset() {
      const current = await load();
      const next = bumpVersion(defaultPricingConfig, current.version);
      await write(next);
      return next;
    },
  };
}

export const pricingRepository: PricingRepository = createFileRepository(
  path.resolve(/*turbopackIgnore: true*/ process.cwd(), storageConfig.pricingConfigPath),
);
