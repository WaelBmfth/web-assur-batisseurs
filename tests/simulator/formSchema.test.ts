import { describe, expect, it } from "vitest";
import { formatEuro, parseAmount } from "@/lib/format";
import { simulatorFormSchema } from "@/lib/simulator/formSchema";

const valid = { companyName: "Entreprise Exemple", activityId: "plomberie-seul", revenue: "150 000", legalProtection: "yes" };

function messages(values: Record<string, string>): string[] {
  const result = simulatorFormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("Validation du formulaire", () => {
  it("accepte un formulaire complet", () => {
    expect(messages(valid)).toEqual([]);
  });
  it("exige la raison sociale", () => {
    expect(messages({ ...valid, companyName: "  " })).toContain("Veuillez renseigner votre raison sociale.");
  });
  it("exige une activité", () => {
    expect(messages({ ...valid, activityId: "" })).toContain("Veuillez sélectionner votre activité.");
  });
  it("exige un CA numérique", () => {
    expect(messages({ ...valid, revenue: "abc" })).toContain("Veuillez renseigner un chiffre d'affaires valide.");
  });
  it("exige un CA strictement positif", () => {
    expect(messages({ ...valid, revenue: "0" })).toContain("Le chiffre d'affaires doit être supérieur à 0 €.");
  });
  it("lit les montants au format français", () => {
    expect(parseAmount("150 000")).toBe(150000);
    expect(parseAmount("150 000,50 €")).toBe(150000.5);
    expect(parseAmount("1.5.2")).toBeNaN();
  });
});

describe("Format monétaire", () => {
  it("affiche 1 704,00 €", () => {
    expect(formatEuro(1704)).toBe("1 704,00 €");
  });
});
