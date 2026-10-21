import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { StorageUnavailableError, type PricingStore } from "./types";

const READ_ONLY_CODES = new Set(["EROFS", "EACCES", "EPERM"]);

/**
 * Stockage dans un fichier JSON local (développement, serveur Node classique).
 * La version courante est dans `filePath`, chaque version est archivée dans `history/`.
 */
export function createFileStore(filePath: string): PricingStore {
  const historyDir = path.join(path.dirname(filePath), "history");

  return {
    async readLatest() {
      try {
        return JSON.parse(await readFile(filePath, "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error("[pricing] Lecture de la configuration impossible.", error);
        }
        return null;
      }
    },

    async write(config) {
      const json = `${JSON.stringify(config, null, 2)}\n`;
      try {
        await mkdir(historyDir, { recursive: true });
        // Écriture atomique puis archivage de la version (historique des tarifs).
        const tmp = `${filePath}.tmp`;
        await writeFile(tmp, json, "utf8");
        await rename(tmp, filePath);
        await writeFile(path.join(historyDir, `v${config.version}.json`), json, "utf8");
      } catch (error) {
        if (READ_ONLY_CODES.has((error as NodeJS.ErrnoException).code ?? "")) {
          throw new StorageUnavailableError(
            "Le serveur n'autorise pas l'écriture de fichiers. Sur Vercel, reliez un Blob store au projet (variable BLOB_READ_WRITE_TOKEN).",
          );
        }
        throw error;
      }
    },
  };
}
