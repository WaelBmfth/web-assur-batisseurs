import { describe, expect, it } from "vitest";
import { defaultPricingConfig } from "@/data/pricing-data";
import { calculateQuote, getCoveredRevenueRange, getRevenueExample } from "@/lib/calculator";
import { parseAmount } from "@/lib/format";
import { optionalAmount, optionalPercent } from "@/lib/questionnaires/validation";
import { simulatorFormSchema } from "@/lib/simulator/formSchema";

const config = defaultPricingConfig;
const electrician = config.activities.find((a) => a.id === "electricien-seul")!;

function formMessages(revenue: string, activityId = "electricien-seul"): string[] {
  const r = simulatorFormSchema.safeParse({ companyName: "Elec", activityId, revenue, legalProtection: "yes" });
  return r.success ? [] : r.error.issues.map((i) => i.message);
}

describe("Lecture des montants au format français (parseAmount)", () => {
  it.each([
    ["150000", 150000],
    ["150 000", 150000],
    ["150 000", 150000],
    ["150 000", 150000],
    ["250000", 250000],
    ["250 000", 250000],
    ["150 000 €", 150000],
    ["150.000", 150000],
    ["1.500.000", 1500000],
    ["150.000,00", 150000],
    ["150.000,5", 150000.5],
    ["12,5", 12.5],
    ["150 000,50", 150000.5],
    ["150 000,50 €", 150000.5],
    ["0,125", 0.125],
    ["1500.50", 1500.5],
    ["12.5", 12.5],
    ["0", 0],
    ["-5", -5],
  ])("« %s » → %s", (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "150,000", "1,500,000", "1.5000", "0.125", "1.5.2", "150.00.0", "15.0000", "1,500.50", "12,5,3", "€", "-"])(
    "format invalide ou ambigu refusé : « %s »",
    (input) => {
      expect(parseAmount(input)).toBeNaN();
    },
  );
});

describe("Électricien seul — saisie du CA (indépendante du calcul de prime)", () => {
  it("grille en ligne inchangée : 0 à 50 000 €, prime 739 € à 800 €", () => {
    expect(getCoveredRevenueRange(electrician)).toEqual({ min: 0, max: 50_000 });
    expect(electrician.brackets).toEqual([{ id: "electricien-seul-1", revenueMin: 0, revenueMax: 50_000, premiumMin: 739, premiumMax: 800 }]);
  });

  it("0 € : refusé comme aujourd'hui (formulaire et calcul)", () => {
    expect(formMessages("0")).toEqual(["Le chiffre d'affaires doit être supérieur à 0 €."]);
    expect(calculateQuote({ activityId: "electricien-seul", revenue: 0, includeLegalProtection: false }, config)).toMatchObject({ ok: false, code: "INVALID_REVENUE" });
  });

  it("50 000 € : saisie acceptée et prime de la grille (739 € à 800 €)", () => {
    expect(formMessages("50 000")).toEqual([]);
    const q = calculateQuote({ activityId: "electricien-seul", revenue: 50_000, includeLegalProtection: false }, config);
    expect(q.ok && q.insurance).toEqual({ min: 739, max: 800 });
  });

  it.each(["50 001", "150000", "150 000", "150.000", "250 000", "250001", "250 001"])(
    "%s € : saisie acceptée, aucune prime calculée → étude personnalisée (option B)",
    (input) => {
      expect(formMessages(input)).toEqual([]);
      const revenue = parseAmount(input);
      expect(revenue).toBeGreaterThan(50_000);
      const q = calculateQuote({ activityId: "electricien-seul", revenue, includeLegalProtection: true }, config);
      expect(q).toMatchObject({ ok: false, code: "REVENUE_ABOVE_RANGE", maxCoveredRevenue: 50_000 });
      expect("insurance" in q).toBe(false);
    },
  );

  it("« 150.000 » n'est plus lu comme 150 € (aucune prime calculée sur un CA erroné)", () => {
    const q = calculateQuote({ activityId: "electricien-seul", revenue: parseAmount("150.000"), includeLegalProtection: false }, config);
    expect(q.ok).toBe(false);
  });
});

describe("Messages du champ CA", () => {
  it("champ vide : message dédié", () => {
    expect(formMessages("")).toEqual(["Veuillez saisir votre chiffre d'affaires."]);
    expect(formMessages("   ")).toEqual(["Veuillez saisir votre chiffre d'affaires."]);
  });

  it.each(["abc", "150,000", "1.5000", "150.000.0"])("valeur invalide ou ambiguë « %s » : message existant", (input) => {
    expect(formMessages(input)).toContain("Veuillez renseigner un chiffre d'affaires valide.");
  });
});

describe("Placeholder (exemple de CA) tiré de la grille de chaque activité", () => {
  it("Électricien : « 30 000 », dans la grille 0 à 50 000 €", () => {
    expect(getRevenueExample(electrician)).toBe(30_000);
  });

  it("les 26 activités à 250 000 € gardent l'exemple 150 000", () => {
    const capped = config.activities.filter((a) => getCoveredRevenueRange(a)?.max === 250_000);
    expect(capped).toHaveLength(26);
    expect(capped.every((a) => getRevenueExample(a) === 150_000)).toBe(true);
  });

  it("pour toutes les activités, l'exemple est dans la plage couverte et accepté par la validation", () => {
    for (const activity of config.activities) {
      const example = getRevenueExample(activity)!;
      const range = getCoveredRevenueRange(activity)!;
      expect(example).toBeGreaterThan(0);
      expect(example).toBeGreaterThanOrEqual(range.min);
      expect(example).toBeLessThanOrEqual(range.max ?? Infinity);
      const q = calculateQuote({ activityId: activity.id, revenue: example, includeLegalProtection: false }, config);
      expect(q.ok).toBe(true);
    }
  });

  it("suit la grille si elle change (aucune valeur codée en dur)", () => {
    const edited = { ...electrician, brackets: [{ ...electrician.brackets[0]!, revenueMax: 80_000 }] };
    expect(getRevenueExample(edited)).toBe(50_000);
    const small = { ...electrician, brackets: [{ ...electrician.brackets[0]!, revenueMin: 0, revenueMax: 5_000 }] };
    expect(getRevenueExample(small)).toBe(3_000);
    const uncapped = { ...electrician, brackets: [{ ...electrician.brackets[0]!, revenueMin: 10_000, revenueMax: null }] };
    expect(getRevenueExample(uncapped)).toBe(10_000);
  });
});

describe("Champs des questionnaires (même lecteur de montants)", () => {
  it("montants et pourcentages au format français", () => {
    expect(optionalAmount().parse("1.850.000")).toBe(1_850_000);
    expect(optionalAmount().parse("1 850 000")).toBe(1_850_000);
    expect(optionalPercent().parse("1,2")).toBe(1.2);
    expect(optionalPercent().parse("12.5")).toBe(12.5);
    expect(optionalAmount().safeParse("150,000").success).toBe(false);
  });
});
