import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calculator";
import { defaultPricingConfig } from "@/data/pricing-data";

/**
 * Valeurs recopiées depuis l'Excel (cellules calculées, feuille « Tarificateur Global BTP »).
 * Grille récapitulative A25:C51 : fourchette de prime TTC par profil.
 */
const excelGrid: [name: string, revenueMax: number, min: number, max: number][] = [
  ["Cuisines seul", 250_000, 444, 1160],
  ["Plomberie seul", 250_000, 444, 1160],
  ["Installations thermiques seul", 250_000, 444, 1160],
  ["Calorifugeage seul", 250_000, 444, 1160],
  ["Menuiserie intérieur / extérieur seul", 250_000, 444, 1160],
  ["Plâtrerie / plaquiste / staff / stuc seul", 250_000, 444, 1160],
  ["Métallerie seul", 250_000, 444, 1160],
  ["Revêtement dur / souple seul", 250_000, 444, 1160],
  ["Serrurerie seul", 250_000, 444, 1160],
  ["Vitrerie - miroiterie seul", 250_000, 444, 1160],
  ["Isolation seul", 250_000, 444, 1160],
  ["Revêtement de façades seul", 250_000, 444, 1160],
  ["Aménagement seul", 250_000, 444, 1160],
  ["Maçon seul / Maçonnerie", 250_000, 1704, 2154],
  ["Couverture seul", 250_000, 1704, 2154],
  ["Charpente seul", 250_000, 1704, 2154],
  ["Étanchéité seul", 250_000, 1704, 2154],
  ["Terrassement / VRD seul", 250_000, 1704, 2154],
  ["Fumisterie seul", 250_000, 1704, 2154],
  ["Photovoltaïque seul", 250_000, 1704, 2154],
  ["Architecte d'intérieur (sans structure, seul)", 250_000, 1704, 2154],
  ["Maître d'œuvre (seul)", 250_000, 3704, 4249],
  ["Électricien seul", 50_000, 739, 800],
  ["Architecte avec suivi de travaux (seul)", 250_000, 4000, 4499],
  ["Paysagiste seul", 250_000, 1190, 1490],
  ["Peinture seul", 250_000, 1190, 1490],
  ["Démolition seul", 250_000, 1190, 1490],
];

describe("Parité avec l'Excel", () => {
  it("contient exactement les 27 activités de l'Excel, dans le même ordre", () => {
    expect(defaultPricingConfig.activities.map((a) => a.name)).toEqual(excelGrid.map(([name]) => name));
  });

  it.each(excelGrid)("%s : tranche 0 à %i €, prime %i € à %i €", (name, revenueMax, min, max) => {
    const activity = defaultPricingConfig.activities.find((a) => a.name === name)!;
    const result = calculateQuote(
      { activityId: activity.id, revenue: revenueMax, includeLegalProtection: false },
      defaultPricingConfig,
    );
    expect(result.ok && result.insurance).toEqual({ min, max });
    expect(result.ok && result.bracket.revenueMin).toBe(0);
  });

  it("reproduit l'exemple enregistré dans l'Excel (C13:D21)", () => {
    // B6 = « Architecte d'intérieur (sans structure, seul) », B7 = 150 000 €, B8 = « Oui »
    const result = calculateQuote(
      { activityId: "architecte-d-interieur-sans-structure-seul", revenue: 150_000, includeLegalProtection: true },
      defaultPricingConfig,
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.insurance).toEqual({ min: 1704, max: 2154 });
    expect(result.legalProtection.amount).toBe(296);
    expect(result.year1).toEqual({ brokerage: 450, total: { min: 2450, max: 2900 }, monthly: { min: 204.17, max: 241.67 } });
    expect(result.followingYears).toEqual({
      brokerage: 250,
      total: { min: 2250, max: 2700 },
      monthly: { min: 187.5, max: 225 },
    });
    expect(result.brokerageSavings).toBe(200); // E55
  });

  it("reprend les frais de l'Excel (E6, E7, E8)", () => {
    expect(defaultPricingConfig.brokerageFees).toEqual({ year1: 450, followingYears: 250 });
    expect(defaultPricingConfig.legalProtection.price).toBe(296);
    expect(defaultPricingConfig.installmentsPerYear).toBe(12);
  });
});
