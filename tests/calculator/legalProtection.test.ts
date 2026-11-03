import { describe, expect, it } from "vitest";
import { defaultPricingConfig } from "@/data/pricing-data";
import { getLegalProtectionMode } from "@/lib/calculator";
import { validatePricingConfig } from "@/lib/pricing/schema";
import { getSimulatorSteps } from "@/lib/simulator/steps";

const optionalIds = [
  "etancheite-seul",
  "fumisterie-seul",
  "photovoltaique-seul",
  "architecte-d-interieur-sans-structure-seul",
  "maitre-d-oeuvre-seul",
  "architecte-avec-suivi-de-travaux-seul",
  "paysagiste-seul",
];

describe("Éligibilité à la Protection Juridique optionnelle", () => {
  it("seules les 7 activités demandées ont une PJ optionnelle", () => {
    const optional = defaultPricingConfig.activities
      .filter((a) => getLegalProtectionMode(defaultPricingConfig, a.id) === "optional")
      .map((a) => a.id);
    expect(optional.sort()).toEqual([...optionalIds].sort());
  });

  it("chaque identifiant éligible correspond à une activité existante", () => {
    const ids = new Set(defaultPricingConfig.activities.map((a) => a.id));
    expect(optionalIds.every((id) => ids.has(id))).toBe(true);
  });

  it("les 20 autres activités ont la PJ incluse d'office", () => {
    const included = defaultPricingConfig.activities.filter((a) => getLegalProtectionMode(defaultPricingConfig, a.id) === "included");
    expect(included).toHaveLength(20);
    expect(included.map((a) => a.id)).toContain("plomberie-seul");
  });

  it("une grille enregistrée avant cette évolution reçoit la liste par défaut au chargement", () => {
    const legacy = structuredClone(defaultPricingConfig) as unknown as { legalProtection: Record<string, unknown> };
    delete legacy.legalProtection.optionalActivityIds;
    const result = validatePricingConfig(legacy);
    expect(result.success && result.data.legalProtection.optionalActivityIds.sort()).toEqual([...optionalIds].sort());
  });
});

describe("Étapes du simulateur", () => {
  it("affiche l'étape PJ uniquement pour une activité à PJ optionnelle", () => {
    expect(getSimulatorSteps(true).map((s) => s.id)).toEqual(["activity", "revenue", "options", "company", "result"]);
    expect(getSimulatorSteps(false).map((s) => s.id)).toEqual(["activity", "revenue", "company", "result"]);
  });
});
