import { describe, expect, it } from "vitest";
import { artisansDefaults, doDefaults, rcdPibDefaults } from "@/lib/questionnaires/defaults";
import { artisanActivities, pibActivities } from "@/lib/questionnaires/options";
import { artisansSchema, doSchema, emptyClaim, rcdPibSchema } from "@/lib/questionnaires/schemas";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";

const simulation: SimulatorSnapshot = { activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: true, companyName: "Dupont" };
const contact = { applicantName: "Jean Dupont", phone: "06 20 03 82 02", email: "jean@dupont.fr" };

function messages(result: { success: boolean; error?: { issues: { message: string; path: PropertyKey[] }[] } }) {
  return result.success ? [] : result.error!.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

function validArtisans() {
  const v = artisansDefaults(simulation);
  Object.assign(v.identification, contact);
  Object.assign(v.activity, { privateShare: "60", professionalShare: "40", renovationShare: "70", newBuildShare: "30" });
  v.activities[16] = { ...v.activities[16]!, selected: true, percent: "100" };
  return v;
}

describe("Fiche Artisans", () => {
  it("reprend les 40 activités de la nomenclature, numérotées comme la fiche", () => {
    expect(artisanActivities).toHaveLength(40);
    expect(artisanActivities[0]!.label).toBe("01. Démolition");
    expect(artisanActivities[39]!.label).toBe("40. Autre activité spécialisée du bâtiment");
  });

  it("pré-remplit la raison sociale et le CA depuis le simulateur", () => {
    const v = artisansDefaults(simulation);
    expect(v.identification.companyName).toBe("Dupont");
    expect(v.identification.forecastRevenue).toBe("150 000");
  });

  it("valide une fiche complète et convertit les valeurs", () => {
    const result = artisansSchema.safeParse(validArtisans());
    expect(messages(result)).toEqual([]);
    expect(result.data!.activities).toEqual([{ code: "17", percent: 100 }]);
    expect(result.data!.identification.forecastRevenue).toBe(150_000);
    expect(result.data!.history.policyInForce).toBeNull();
  });

  it("exige que chaque axe de répartition du CA totalise 100 %", () => {
    const v = validArtisans();
    v.activity.professionalShare = "30";
    expect(messages(artisansSchema.safeParse(v))).toContain(
      "activity.professionalShare: Particuliers + Professionnels doit totaliser 100 % (actuellement 90 %).",
    );
  });

  it("refuse une sous-traitance supérieure à 100 % au total", () => {
    const v = validArtisans();
    Object.assign(v.activity, { subcontractedShare: "70", asSubcontractorShare: "40" });
    expect(messages(artisansSchema.safeParse(v))).toContain(
      "activity.asSubcontractorShare: La sous-traitance ne peut pas dépasser 100 % au total (actuellement 110 %).",
    );
  });

  it("exige au moins une activité et un total d'activités ≤ 100 %", () => {
    const none = validArtisans();
    none.activities = none.activities.map((a) => ({ ...a, selected: false }));
    expect(messages(artisansSchema.safeParse(none))).toContain("activities: Sélectionnez au moins une activité.");

    const over = validArtisans();
    over.activities[17] = { ...over.activities[17]!, selected: true, percent: "20" };
    expect(messages(artisansSchema.safeParse(over))).toContain("activities: Le total des pourcentages dépasse 100 % (actuellement 120 %).");
  });

  it("ignore le pourcentage d'une activité décochée", () => {
    const v = validArtisans();
    v.activities[0] = { ...v.activities[0]!, selected: false, percent: "abc" };
    expect(artisansSchema.safeParse(v).success).toBe(true);
  });

  it("valide e-mail, téléphone, SIRET et dates", () => {
    const v = validArtisans();
    Object.assign(v.identification, { email: "x", phone: "123", siret: "123", effectiveDate: "2027-06-01", endDate: "2027-01-01" });
    const errors = messages(artisansSchema.safeParse(v));
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^identification.email/),
        expect.stringMatching(/^identification.phone/),
        "identification.siret: Le numéro SIRET doit comporter 14 chiffres.",
      ]),
    );
    Object.assign(v.identification, { email: "a@b.fr", phone: "+33 6 20 03 82 02", siret: "123 456 789 00012" });
    expect(messages(artisansSchema.safeParse(v))).toEqual([
      "identification.endDate: La date de fin doit être postérieure à la date d'effet.",
    ]);
  });

  it("gère les sinistres, y compris un « Clos ? » non répondu", () => {
    const v = validArtisans();
    v.claims = [{ ...emptyClaim, date: "2024-03-15", nature: "Dégât des eaux", estimatedAmount: "4 500", closed: null as never }];
    const result = artisansSchema.safeParse(v);
    expect(messages(result)).toEqual([]);
    expect(result.data!.claims[0]).toMatchObject({ estimatedAmount: 4500, closed: null });

    v.claims = [{ ...emptyClaim }];
    expect(messages(artisansSchema.safeParse(v))).toEqual([
      "claims.0.date: Indiquez la date du sinistre.",
      "claims.0.nature: Indiquez la nature du sinistre.",
    ]);
  });
});

describe("Fiche DO", () => {
  function validDo() {
    const v = doDefaults();
    v.guarantees = ["do"];
    Object.assign(v.owner, { ownerName: "SCI Les Chênes", ...contact });
    return v;
  }

  it("exige au moins une garantie et les coordonnées", () => {
    expect(messages(doSchema.safeParse(doDefaults()))).toEqual(
      expect.arrayContaining(["guarantees: Sélectionnez au moins une garantie.", "owner.ownerName: Veuillez renseigner le nom du maître d'ouvrage."]),
    );
    expect(messages(doSchema.safeParse(validDo()))).toEqual([]);
  });

  it("demande de préciser « Autre » type de bâtiment et « Autre mission »", () => {
    const v = validDo();
    v.project.buildingTypes = ["autre"];
    v.stakeholders.architectMission = "autre-mission";
    expect(messages(doSchema.safeParse(v))).toEqual([
      "project.buildingTypeOther: Précisez le type de bâtiment.",
      "stakeholders.architectOtherMission: Précisez la mission.",
    ]);
  });

  it("vérifie les montants et le calendrier", () => {
    const v = validDo();
    Object.assign(v.amounts, { worksAmount: "850 000", startDate: "2027-05-01", endDate: "2027-02-01" });
    expect(messages(doSchema.safeParse(v))).toEqual([
      "amounts.endDate: La date de fin doit être postérieure à la date de début des travaux.",
    ]);
    v.amounts.endDate = "2028-02-01";
    expect(doSchema.parse(v).amounts.worksAmount).toBe(850_000);
  });
});

describe("Fiche RCD PIB", () => {
  function validRcd() {
    const v = rcdPibDefaults(simulation);
    Object.assign(v.identification, contact);
    v.pib.activities = ["pib-01"];
    return v;
  }

  it("liste les 14 activités PIB et exige au moins une activité", () => {
    expect(pibActivities).toHaveLength(14);
    const v = validRcd();
    v.pib.activities = [];
    expect(messages(rcdPibSchema.safeParse(v))).toContain("pib.activities: Sélectionnez au moins une activité.");
    expect(messages(rcdPibSchema.safeParse(validRcd()))).toEqual([]);
  });

  it("répartition du CA : chaque axe au plus 100 % (pas d'obligation de 100 % sur cette fiche)", () => {
    const v = validRcd();
    Object.assign(v.activity, { privateShare: "50" });
    expect(rcdPibSchema.safeParse(v).success).toBe(true);
    Object.assign(v.activity, { professionalShare: "60" });
    expect(messages(rcdPibSchema.safeParse(v))).toContain(
      "activity.professionalShare: Particuliers + Professionnels doit totaliser au plus 100 % (actuellement 110 %).",
    );
  });

  it("types d'ouvrage et de mission : total ≤ 100 %, valeurs converties", () => {
    const v = validRcd();
    v.workTypes[0] = { ...v.workTypes[0]!, selected: true, percent: "70" };
    v.workTypes[1] = { ...v.workTypes[1]!, selected: true, percent: "40" };
    expect(messages(rcdPibSchema.safeParse(v))).toContain("workTypes: Le total des pourcentages dépasse 100 % (actuellement 110 %).");
    v.workTypes[1] = { ...v.workTypes[1]!, percent: "30" };
    v.missionTypes[2] = { ...v.missionTypes[2]!, selected: true, percent: "100" };
    v.pib.yearsOfExperience = "12";
    const data = rcdPibSchema.parse(v);
    expect(data.workTypes).toEqual([
      { code: "maison-individuelle", percent: 70 },
      { code: "immeuble-habitation", percent: 30 },
    ]);
    expect(data.missionTypes).toEqual([{ code: "mission-exe-complete", percent: 100 }]);
    expect(data.pib.yearsOfExperience).toBe(12);
  });
});
