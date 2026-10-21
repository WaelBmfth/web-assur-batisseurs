import { describe, expect, it } from "vitest";
import { calculateQuote, getSelectableActivities } from "@/lib/calculator";
import { defaultPricingConfig } from "@/data/pricing-data";
import {
  addActivity,
  addBracket,
  bumpVersion,
  moveActivity,
  removeActivity,
  removeBracket,
  updateActivity,
  updateBracket,
  updateFees,
  updatePremiumMin,
} from "@/lib/pricing/configOperations";
import { validatePricingConfig } from "@/lib/pricing/schema";

const config = defaultPricingConfig;
const plumbingInput = { activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false };

describe("Minimum de prime modifié depuis l'administration", () => {
  it("minimum initial → modification → nouveau calcul utilisant le nouveau minimum", () => {
    const before = calculateQuote(plumbingInput, config);
    expect(before.ok && before.insurance.min).toBe(444);

    const edited = updatePremiumMin(config, "plomberie-seul", "plomberie-seul-1", 500);
    const after = calculateQuote(plumbingInput, edited);

    expect(after.ok && after.insurance).toEqual({ min: 500, max: 1160 });
    expect(after.ok && after.year1.total.min).toBe(500 + 450);
    expect(after.ok && after.followingYears.total.min).toBe(500 + 250);
    // L'original n'est pas muté, les autres activités ne bougent pas.
    expect(config.activities.find((a) => a.id === "plomberie-seul")!.brackets[0]!.premiumMin).toBe(444);
    const kitchens = calculateQuote({ ...plumbingInput, activityId: "cuisines-seul" }, edited);
    expect(kitchens.ok && kitchens.insurance.min).toBe(444);
  });

  it("rejette un minimum supérieur à la borne haute", () => {
    const edited = updatePremiumMin(config, "plomberie-seul", "plomberie-seul-1", 2000);
    expect(validatePricingConfig(edited).success).toBe(false);
  });
});

describe("Gestion des activités", () => {
  it("ajoute une nouvelle activité utilisable par le simulateur", () => {
    const edited = addActivity(config, {
      name: "Carreleur seul",
      category: "Second Œuvre / Sols",
      brackets: [{ revenueMin: 0, revenueMax: 150_000, premiumMin: 600, premiumMax: 900 }],
    });
    const added = edited.activities.at(-1)!;
    expect(added).toMatchObject({ id: "carreleur-seul", active: true, sortOrder: 280 });
    expect(validatePricingConfig(edited).success).toBe(true);

    const result = calculateQuote({ activityId: added.id, revenue: 80_000, includeLegalProtection: true }, edited);
    expect(result.ok && result.year1.total).toEqual({ min: 600 + 296 + 450, max: 900 + 296 + 450 });
  });

  it("génère un identifiant unique en cas de doublon de nom", () => {
    const edited = addActivity(config, { name: "Plomberie seul" });
    expect(edited.activities.at(-1)!.id).toBe("plomberie-seul-2");
  });

  it("supprime une activité", () => {
    const edited = removeActivity(config, "plomberie-seul");
    expect(edited.activities).toHaveLength(26);
    expect(calculateQuote(plumbingInput, edited)).toMatchObject({ ok: false, code: "ACTIVITY_NOT_FOUND" });
  });

  it("désactive une activité : elle disparaît du simulateur", () => {
    const edited = updateActivity(config, "plomberie-seul", { active: false });
    expect(getSelectableActivities(edited).map((a) => a.id)).not.toContain("plomberie-seul");
  });

  it("modifie l'ordre d'affichage", () => {
    const edited = moveActivity(config, "plomberie-seul", "up");
    expect(getSelectableActivities(edited).slice(0, 2).map((a) => a.id)).toEqual(["plomberie-seul", "cuisines-seul"]);
    expect(moveActivity(config, "cuisines-seul", "up")).toBe(config);
  });
});

describe("Gestion des tranches", () => {
  it("modifie une tranche (CA max. et fourchette)", () => {
    const edited = updateBracket(config, "plomberie-seul", "plomberie-seul-1", {
      revenueMax: 300_000,
      premiumMax: 1300,
    });
    const result = calculateQuote({ ...plumbingInput, revenue: 280_000 }, edited);
    expect(result.ok && result.insurance).toEqual({ min: 444, max: 1300 });
  });

  it("ajoute et supprime une tranche", () => {
    const withBracket = addBracket(config, "plomberie-seul");
    const plumbing = withBracket.activities.find((a) => a.id === "plomberie-seul")!;
    expect(plumbing.brackets).toHaveLength(2);
    expect(plumbing.brackets[1]).toMatchObject({ revenueMin: 250_001, revenueMax: null });

    const result = calculateQuote({ ...plumbingInput, revenue: 1_000_000 }, withBracket);
    expect(result.ok && result.bracket.id).toBe(plumbing.brackets[1]!.id);

    const removed = removeBracket(withBracket, "plomberie-seul", plumbing.brackets[1]!.id);
    expect(removed.activities.find((a) => a.id === "plomberie-seul")!.brackets).toHaveLength(1);
  });
});

describe("Frais et version", () => {
  it("modifie les frais de courtage et la Protection Juridique", () => {
    const edited = updateFees(config, { brokerageFees: { year1: 400 }, legalProtection: { price: 310 } });
    const result = calculateQuote({ ...plumbingInput, includeLegalProtection: true }, edited);
    expect(result.ok && result.year1.total.min).toBe(444 + 310 + 400);
    expect(result.ok && result.followingYears.brokerage).toBe(250);
  });

  it("incrémente la version à l'enregistrement", () => {
    const next = bumpVersion(config, 4, new Date("2027-01-01T00:00:00Z"));
    expect(next).toMatchObject({ version: 5, updatedAt: "2027-01-01T00:00:00.000Z" });
    const result = calculateQuote(plumbingInput, next);
    expect(result.ok && result.pricingVersion).toBe(5);
  });
});
