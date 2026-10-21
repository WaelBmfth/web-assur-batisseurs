import { get, head, list, put } from "@vercel/blob";
import type { PricingConfig } from "@/types/pricing";
import { VersionConflictError, type PricingStore } from "./types";

export type BlobStoreOptions = {
  /** Doit correspondre au type du Blob store créé sur Vercel. */
  access: "public" | "private";
  /** Dossier des versions dans le store. */
  prefix?: string;
  token?: string;
};

const pad = (version: number) => String(version).padStart(6, "0");

/** « pricing/v000012.json » → 12 */
function versionOf(pathname: string, prefix: string): number | null {
  const match = pathname.slice(prefix.length).match(/^v(\d+)\.json$/);
  return match ? Number(match[1]) : null;
}

/**
 * Stockage Vercel Blob (hébergement Vercel, système de fichiers en lecture seule).
 *
 * Chaque enregistrement crée un nouveau fichier immuable `pricing/v000002.json`
 * (jamais écrasé) : pas de cache CDN périmé, historique conservé, et deux
 * enregistrements simultanés de la même version sont refusés au lieu de s'écraser.
 */
export function createBlobStore({ access, prefix = "pricing/", token }: BlobStoreOptions): PricingStore {
  async function latestPathname(): Promise<string | null> {
    let best: { version: number; pathname: string } | null = null;
    let cursor: string | undefined;
    do {
      const page = await list({ prefix, cursor, token });
      for (const blob of page.blobs) {
        const version = versionOf(blob.pathname, prefix);
        if (version !== null && (!best || version > best.version)) best = { version, pathname: blob.pathname };
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return best?.pathname ?? null;
  }

  async function exists(pathname: string): Promise<boolean> {
    try {
      await head(pathname, { token });
      return true;
    } catch {
      return false;
    }
  }

  return {
    async readLatest() {
      const pathname = await latestPathname();
      if (!pathname) return null;
      const result = await get(pathname, { access, token, useCache: false });
      if (!result || result.statusCode !== 200) return null;
      return new Response(result.stream).json();
    },

    async write(config: PricingConfig) {
      const pathname = `${prefix}v${pad(config.version)}.json`;
      try {
        await put(pathname, JSON.stringify(config, null, 2), {
          access,
          token,
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: false,
        });
      } catch (error) {
        // allowOverwrite: false → l'écriture échoue si la version existe déjà.
        if (await exists(pathname)) {
          throw new VersionConflictError(
            "La grille a été modifiée entre-temps par un autre enregistrement. Rechargez la page puis recommencez.",
          );
        }
        throw error;
      }
    },
  };
}
