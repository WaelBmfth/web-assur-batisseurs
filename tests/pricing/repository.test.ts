import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calculator";
import { defaultPricingConfig } from "@/data/pricing-data";
import { updatePremiumMin } from "@/lib/pricing/configOperations";
import { createFileRepository, SaveValidationError } from "@/lib/pricing/repository.server";

describe("Stockage fichier de la configuration", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "pricing-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("retourne les valeurs Excel tant que rien n'est enregistré", async () => {
    const repo = createFileRepository(path.join(dir, "pricing.json"));
    expect(await repo.load()).toEqual(defaultPricingConfig);
  });

  it("persiste un minimum modifié, versionne et archive", async () => {
    const file = path.join(dir, "pricing.json");
    const repo = createFileRepository(file);
    const saved = await repo.save(updatePremiumMin(defaultPricingConfig, "plomberie-seul", "plomberie-seul-1", 500));
    expect(saved.version).toBe(2);

    const reloaded = await createFileRepository(file).load();
    const result = calculateQuote(
      { activityId: "plomberie-seul", revenue: 100_000, includeLegalProtection: false },
      reloaded,
    );
    expect(result.ok && result.insurance.min).toBe(500);
    expect(JSON.parse(await readFile(path.join(dir, "history", "v2.json"), "utf8")).version).toBe(2);
  });

  it("refuse d'enregistrer une configuration invalide", async () => {
    const repo = createFileRepository(path.join(dir, "pricing.json"));
    const invalid = updatePremiumMin(defaultPricingConfig, "plomberie-seul", "plomberie-seul-1", -5);
    await expect(repo.save(invalid)).rejects.toBeInstanceOf(SaveValidationError);
  });

  it("réinitialise aux valeurs Excel", async () => {
    const repo = createFileRepository(path.join(dir, "pricing.json"));
    await repo.save(updatePremiumMin(defaultPricingConfig, "plomberie-seul", "plomberie-seul-1", 500));
    const reset = await repo.reset();
    expect(reset.version).toBe(3);
    expect(reset.activities).toEqual(defaultPricingConfig.activities);
  });
});
