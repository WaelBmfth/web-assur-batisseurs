import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateQuote } from "@/lib/calculator";
import { defaultPricingConfig } from "@/data/pricing-data";
import { updatePremiumMin } from "@/lib/pricing/configOperations";
import { createRepository, VersionConflictError } from "@/lib/pricing/repository.server";
import { createBlobStore } from "@/lib/pricing/stores/blobStore.server";

// Vercel Blob simulé en mémoire (pagination de 2 résultats pour tester le curseur).
const blobs = vi.hoisted(() => new Map<string, string>());
vi.mock("@vercel/blob", () => ({
  list: vi.fn(async ({ prefix = "", cursor }: { prefix?: string; cursor?: string }) => {
    const all = [...blobs.keys()].filter((p) => p.startsWith(prefix)).sort();
    const start = cursor ? Number(cursor) : 0;
    const page = all.slice(start, start + 2);
    const hasMore = start + 2 < all.length;
    return { blobs: page.map((pathname) => ({ pathname })), hasMore, cursor: hasMore ? String(start + 2) : undefined };
  }),
  get: vi.fn(async (pathname: string) =>
    blobs.has(pathname) ? { statusCode: 200, stream: new Response(blobs.get(pathname)).body } : null,
  ),
  put: vi.fn(async (pathname: string, body: string, options: { allowOverwrite?: boolean }) => {
    if (blobs.has(pathname) && !options.allowOverwrite) throw new Error("This blob already exists");
    blobs.set(pathname, body);
    return { pathname };
  }),
  head: vi.fn(async (pathname: string) => {
    if (!blobs.has(pathname)) throw new Error("not found");
    return { pathname };
  }),
}));

const plumbing = { activityId: "plomberie-seul", revenue: 100_000, includeLegalProtection: false };

describe("Stockage Vercel Blob", () => {
  beforeEach(() => blobs.clear());

  it("retourne les valeurs Excel tant que rien n'est enregistré", async () => {
    const repo = createRepository(createBlobStore({ access: "private" }));
    expect(await repo.load()).toEqual(defaultPricingConfig);
  });

  it("enregistre chaque version dans un fichier immuable et relit la plus récente", async () => {
    const repo = createRepository(createBlobStore({ access: "private" }));
    for (const value of [500, 520, 540]) {
      await repo.save(updatePremiumMin(await repo.load(), "plomberie-seul", "plomberie-seul-1", value));
    }
    expect([...blobs.keys()].sort()).toEqual([
      "pricing/v000002.json",
      "pricing/v000003.json",
      "pricing/v000004.json",
    ]);
    const latest = await createRepository(createBlobStore({ access: "private" })).load();
    expect(latest.version).toBe(4);
    const result = calculateQuote(plumbing, latest);
    expect(result.ok && result.insurance.min).toBe(540);
  });

  it("refuse deux enregistrements simultanés de la même version", async () => {
    const store = createBlobStore({ access: "private" });
    const config = { ...defaultPricingConfig, version: 2 };
    await store.write(config);
    await expect(store.write(config)).rejects.toBeInstanceOf(VersionConflictError);
  });

  it("ignore les fichiers étrangers au format de version", async () => {
    blobs.set("pricing/notes.txt", "x");
    const repo = createRepository(createBlobStore({ access: "private" }));
    expect((await repo.load()).version).toBe(1);
  });

  it("réinitialise aux valeurs Excel dans une nouvelle version", async () => {
    const repo = createRepository(createBlobStore({ access: "private" }));
    await repo.save(updatePremiumMin(defaultPricingConfig, "plomberie-seul", "plomberie-seul-1", 500));
    const reset = await repo.reset();
    expect(reset.version).toBe(3);
    expect((await repo.load()).activities).toEqual(defaultPricingConfig.activities);
  });
});
