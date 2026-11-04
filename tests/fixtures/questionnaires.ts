import { artisansDefaults, doDefaults, rcdPibDefaults } from "@/lib/questionnaires/defaults";
import { emptyClaim } from "@/lib/questionnaires/schemas";
import type {
  ArtisansQuestionnaireValues,
  DOQuestionnaireValues,
  RCDPIBQuestionnaireValues,
  SimulatorSnapshot,
} from "@/lib/questionnaires/types";

/** Adresse de test sûre (domaine réservé example.com, RFC 2606) : jamais un vrai client. */
export const TEST_EMAIL = "test.questionnaire@example.com";

export const simulation: SimulatorSnapshot = {
  activityId: "plomberie-seul",
  revenue: 150_000,
  includeLegalProtection: true,
  companyName: "Dupont Rénovation",
};

const contact = { applicantName: "Jean Dupont", phone: "06 20 03 82 02", email: TEST_EMAIL };

export function artisansValues(): ArtisansQuestionnaireValues {
  const v = artisansDefaults(simulation);
  Object.assign(v.identification, contact, {
    effectiveDate: "2027-01-01",
    endDate: "2027-12-31",
    paymentFrequency: "mensuel",
    address: "12 rue de l'Église",
    postalCode: "35000",
    city: "Rennes",
    siret: "123 456 789 00012",
    nafCode: "4322A",
    headcount: "4",
    previousYearRevenue: "140 000",
  });
  Object.assign(v.activity, {
    largestSiteCost: "lt-500k",
    managerTakesPart: "oui",
    privateShare: "70",
    professionalShare: "30",
    renovationShare: "80",
    newBuildShare: "20",
    subcontractedShare: "10",
  });
  v.activities[16] = { ...v.activities[16]!, selected: true, percent: "70" };
  v.activities[17] = { ...v.activities[17]!, selected: true, percent: "30" };
  v.claims = [{ ...emptyClaim, date: "2024-03-15", nature: "Dégât des eaux chez un client", responsibility: "50", estimatedAmount: "4 500", settledAmount: "4 200", closed: "oui" }];
  Object.assign(v.history, { previousInsurer: "Compagnie Exemple", annualPremium: "1 800", rate: "1,2", renewalDate: "2027-01-01", policyInForce: "oui", receivership: "non" });
  Object.assign(v.signature, { place: "Rennes", date: "2026-11-04", signature: "Jean Dupont" });
  return v;
}

export function doValues(): DOQuestionnaireValues {
  const v = doDefaults();
  v.guarantees = ["do", "rcmo"];
  Object.assign(v.owner, { ownerName: "SCI Les Chênes", ...contact, programName: "Résidence Les Chênes", siteCity: "Vitré" });
  Object.assign(v.project, {
    destination: "vente",
    workTypes: ["construction-neuve"],
    buildingTypes: ["immeuble-habitation", "autre"],
    buildingTypeOther: "Local d'activité au rez-de-chaussée",
    housingCount: "12",
    floorArea: "950",
    description: "Construction d'un immeuble de 12 logements avec parking en sous-sol.",
  });
  Object.assign(v.amounts, { worksAmount: "1 850 000", totalConstructionAmount: "2 050 000", startDate: "2027-03-01", endDate: "2028-09-30" });
  Object.assign(v.stakeholders, { ownerTakesPart: "non", architectMission: "autre-mission", architectOtherMission: "Conception seule", designOffice: "oui", designOfficeMission: "Structure" });
  return v;
}

export function rcdPibValues(): RCDPIBQuestionnaireValues {
  const v = rcdPibDefaults(simulation);
  Object.assign(v.identification, contact);
  v.pib.activities = ["pib-01", "pib-12"];
  v.pib.yearsOfExperience = "12";
  v.workTypes[0] = { ...v.workTypes[0]!, selected: true, percent: "60" };
  v.missionTypes[2] = { ...v.missionTypes[2]!, selected: true, percent: "100" };
  Object.assign(v.history, { terminationReason: "Échéance", brokerValidated: "oui" });
  return v;
}

/** Texte très long (≈ 4 000 caractères) pour éprouver les retours à la ligne et sauts de page. */
export const LONG_TEXT = Array.from({ length: 60 }, (_, i) => `Phrase ${i + 1} : opération d'aménagement « clé en main » avec réhabilitation, extension et mise aux normes (coût estimé 125 000 €).`).join(" ");
