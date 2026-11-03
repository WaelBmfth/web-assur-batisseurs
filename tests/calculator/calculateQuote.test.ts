import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/calculator";
import { defaultPricingConfig } from "@/data/pricing-data";
import type { QuoteResult, QuoteSuccess } from "@/types/simulator";

const config = defaultPricingConfig;

function expectOk(result: QuoteResult): QuoteSuccess {
  if (!result.ok) throw new Error(`Calcul en échec : ${result.code}`);
  return result;
}

describe("calculateQuote — activité", () => {
  it("calcule un devis pour une activité valide", () => {
    const result = expectOk(
      calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: true }, config),
    );
    expect(result.activity.name).toBe("Plomberie seul");
    expect(result.activity.category).toBe("Second Œuvre / Technique");
  });

  it("refuse une activité inexistante", () => {
    const result = calculateQuote(
      { activityId: "astronaute", revenue: 100_000, includeLegalProtection: false },
      config,
    );
    expect(result).toMatchObject({ ok: false, code: "ACTIVITY_NOT_FOUND" });
  });

  it("refuse une activité désactivée", () => {
    const disabled = {
      ...config,
      activities: config.activities.map((a) => (a.id === "plomberie-seul" ? { ...a, active: false } : a)),
    };
    const result = calculateQuote(
      { activityId: "plomberie-seul", revenue: 100_000, includeLegalProtection: false },
      disabled,
    );
    expect(result).toMatchObject({ ok: false, code: "ACTIVITY_INACTIVE" });
  });
});

describe("calculateQuote — chiffre d'affaires", () => {
  it("trouve la tranche contenant le CA (bornes incluses)", () => {
    for (const revenue of [1, 125_000, 250_000]) {
      const result = expectOk(
        calculateQuote({ activityId: "plomberie-seul", revenue, includeLegalProtection: false }, config),
      );
      expect(result.bracket).toMatchObject({ revenueMin: 0, revenueMax: 250_000 });
    }
  });

  it("ne produit pas d'estimation au-delà de la dernière tranche", () => {
    const result = calculateQuote(
      { activityId: "plomberie-seul", revenue: 250_001, includeLegalProtection: false },
      config,
    );
    expect(result).toMatchObject({ ok: false, code: "REVENUE_ABOVE_RANGE", maxCoveredRevenue: 250_000 });
  });

  it("applique la tranche spécifique de l'électricien (0 à 50 000 €)", () => {
    expect(
      calculateQuote({ activityId: "electricien-seul", revenue: 50_000, includeLegalProtection: false }, config).ok,
    ).toBe(true);
    expect(
      calculateQuote({ activityId: "electricien-seul", revenue: 60_000, includeLegalProtection: false }, config),
    ).toMatchObject({ ok: false, code: "REVENUE_ABOVE_RANGE", maxCoveredRevenue: 50_000 });
  });

  it("signale un CA inférieur à la première tranche", () => {
    const raised = {
      ...config,
      activities: config.activities.map((a) =>
        a.id === "plomberie-seul"
          ? { ...a, brackets: a.brackets.map((b) => ({ ...b, revenueMin: 10_000 })) }
          : a,
      ),
    };
    expect(
      calculateQuote({ activityId: "plomberie-seul", revenue: 5_000, includeLegalProtection: false }, raised),
    ).toMatchObject({ ok: false, code: "REVENUE_BELOW_RANGE", minCoveredRevenue: 10_000 });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("refuse un CA invalide (%s)", (revenue) => {
    expect(
      calculateQuote({ activityId: "plomberie-seul", revenue, includeLegalProtection: false }, config),
    ).toMatchObject({ ok: false, code: "INVALID_REVENUE" });
  });

  it("choisit la bonne tranche parmi plusieurs", () => {
    const multi = {
      ...config,
      activities: config.activities.map((a) =>
        a.id === "plomberie-seul"
          ? {
              ...a,
              brackets: [
                { id: "b2", revenueMin: 250_001, revenueMax: 500_000, premiumMin: 900, premiumMax: 1500 },
                { id: "b1", revenueMin: 0, revenueMax: 250_000, premiumMin: 444, premiumMax: 1160 },
              ],
            }
          : a,
      ),
    };
    const low = expectOk(
      calculateQuote({ activityId: "plomberie-seul", revenue: 250_000, includeLegalProtection: false }, multi),
    );
    const high = expectOk(
      calculateQuote({ activityId: "plomberie-seul", revenue: 300_000, includeLegalProtection: false }, multi),
    );
    expect(low.bracket.id).toBe("b1");
    expect(high.bracket.id).toBe("b2");
    expect(high.insurance).toEqual({ min: 900, max: 1500 });
  });
});

describe("calculateQuote — montants", () => {
  const plumbing = (includeLegalProtection: boolean) =>
    expectOk(calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection }, config));

  it("utilise le minimum de prime comme bas de fourchette et la borne haute comme haut", () => {
    expect(plumbing(false).insurance).toEqual({ min: 444, max: 1160 });
  });

  it("utilise le minimum comme prime fixe quand aucune borne haute n'est définie", () => {
    const fixed = {
      ...config,
      activities: config.activities.map((a) =>
        a.id === "plomberie-seul" ? { ...a, brackets: a.brackets.map((b) => ({ ...b, premiumMax: null })) } : a,
      ),
    };
    const result = expectOk(
      calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false }, fixed),
    );
    expect(result.insurance).toEqual({ min: 444, max: 444 });
  });

  it("n'ajoute pas la Protection Juridique si elle est désactivée dans l'administration", () => {
    const off = { ...config, legalProtection: { ...config.legalProtection, enabled: false } };
    for (const activityId of ["plomberie-seul", "photovoltaique-seul"]) {
      const result = expectOk(calculateQuote({ activityId, revenue: 150_000, includeLegalProtection: true }, off));
      expect(result.legalProtection).toMatchObject({ included: false, amount: 0 });
      expect(result.insuranceWithLegalProtection).toEqual(result.insurance);
    }
  });

  it("calcule l'année 1 avec le courtage de 1ère année", () => {
    const result = plumbing(true);
    expect(result.year1.brokerage).toBe(450);
    expect(result.year1.total).toEqual({ min: 1190, max: 1906 });
  });

  it("calcule les années suivantes avec le courtage de renouvellement", () => {
    const result = plumbing(true);
    expect(result.followingYears.brokerage).toBe(250);
    expect(result.followingYears.total).toEqual({ min: 990, max: 1706 });
    expect(result.brokerageSavings).toBe(200);
  });

  it("utilise les frais de courtage de la configuration", () => {
    const fees = { ...config, brokerageFees: { year1: 500, followingYears: 300 } };
    const result = expectOk(
      calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false }, fees),
    );
    // Plomberie : PJ (296 €) incluse d'office.
    expect(result.year1.total.min).toBe(444 + 296 + 500);
    expect(result.followingYears.total.min).toBe(444 + 296 + 300);
  });

  it("calcule les mensualités (total / 12, arrondi au centime)", () => {
    const result = plumbing(true);
    expect(result.year1.monthly).toEqual({ min: 99.17, max: 158.83 });
    expect(result.followingYears.monthly).toEqual({ min: 82.5, max: 142.17 });
  });
});

describe("Protection Juridique — activités à PJ optionnelle", () => {
  const solar = (includeLegalProtection: boolean) =>
    expectOk(calculateQuote({ activityId: "photovoltaique-seul", revenue: 150_000, includeLegalProtection }, config));

  it("ajoute la PJ quand elle est choisie", () => {
    const result = solar(true);
    expect(result.legalProtection).toEqual({ mode: "optional", included: true, amount: 296 });
    expect(result.year1.total).toEqual({ min: 1704 + 296 + 450, max: 2154 + 296 + 450 });
    expect(result.followingYears.total).toEqual({ min: 1704 + 296 + 250, max: 2154 + 296 + 250 });
  });

  it("n'ajoute rien quand la PJ est refusée", () => {
    const result = solar(false);
    expect(result.legalProtection).toEqual({ mode: "optional", included: false, amount: 0 });
    expect(result.insuranceWithLegalProtection).toEqual({ min: 1704, max: 2154 });
    expect(result.year1.total).toEqual({ min: 1704 + 450, max: 2154 + 450 });
    expect(result.year1.monthly).toEqual({ min: 179.5, max: 217 });
  });
});

describe("Protection Juridique — activités à PJ incluse d'office", () => {
  it("inclut la PJ même si le client ne l'a pas choisie", () => {
    for (const include of [true, false]) {
      const result = expectOk(calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: include }, config));
      expect(result.legalProtection).toEqual({ mode: "included", included: true, amount: 296 });
    }
  });

  it("prime avec PJ incluse : 444,00 € + 296,00 € = 740,00 € (et 1 160 € + 296 € = 1 456 €)", () => {
    const result = expectOk(calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false }, config));
    expect(result.insurance).toEqual({ min: 444, max: 1160 });
    expect(result.insuranceWithLegalProtection).toEqual({ min: 740, max: 1456 });
  });

  it("totaux et mensualités : PJ comptée une seule fois", () => {
    const result = expectOk(calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false }, config));
    expect(result.year1.total).toEqual({ min: 740 + 450, max: 1456 + 450 });
    expect(result.followingYears.total).toEqual({ min: 740 + 250, max: 1456 + 250 });
    expect(result.year1.monthly).toEqual({ min: 99.17, max: 158.83 });
    expect(result.followingYears.monthly).toEqual({ min: 82.5, max: 142.17 });
  });

  it("suit le prix de la PJ de la configuration (aucun montant codé en dur)", () => {
    const pricier = { ...config, legalProtection: { ...config.legalProtection, price: 310 } };
    const result = expectOk(calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: false }, pricier));
    expect(result.insuranceWithLegalProtection).toEqual({ min: 444 + 310, max: 1160 + 310 });
  });
});
