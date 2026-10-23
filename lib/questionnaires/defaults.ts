import { formatNumber } from "@/lib/format";
import { artisanActivities, missionTypeShares, workTypeShares } from "./options";
import { shareRowsDefault } from "./schemas";
import type {
  ArtisansQuestionnaireValues,
  DOQuestionnaireValues,
  RCDPIBQuestionnaireValues,
  SimulatorSnapshot,
} from "./types";

const signature = { place: "", date: "", signature: "" };

const companyIdentification = (simulation: SimulatorSnapshot | null) => ({
  effectiveDate: "",
  endDate: "",
  paymentFrequency: "",
  // Pré-remplissage avec les informations déjà saisies dans le simulateur.
  companyName: simulation?.companyName ?? "",
  address: "",
  postalCode: "",
  city: "",
  applicantName: "",
  phone: "",
  email: "",
  creationDate: "",
  siret: "",
  nafCode: "",
  headcount: "",
  forecastRevenue: simulation ? formatNumber(simulation.revenue) : "",
} as const);

const revenueSplit = {
  privateShare: "",
  professionalShare: "",
  renovationShare: "",
  newBuildShare: "",
  subcontractedShare: "",
  asSubcontractorShare: "",
};

export function artisansDefaults(simulation: SimulatorSnapshot | null): ArtisansQuestionnaireValues {
  return {
    identification: { ...companyIdentification(simulation), previousYearRevenue: "" },
    activity: { largestSiteCost: "", managerTakesPart: "", ...revenueSplit },
    activities: shareRowsDefault(artisanActivities),
    claims: [],
    history: { previousInsurer: "", annualPremium: "", rate: "", renewalDate: "", policyInForce: "", receivership: "" },
    signature,
  };
}

export function doDefaults(): DOQuestionnaireValues {
  return {
    guarantees: [],
    owner: {
      ownerName: "",
      address: "",
      postalCode: "",
      city: "",
      applicantName: "",
      phone: "",
      email: "",
      programName: "",
      siret: "",
      siteAddress: "",
      sitePostalCode: "",
      siteCity: "",
      buildingPermitNumber: "",
      buildingPermitDate: "",
    },
    project: {
      destination: "",
      workTypes: [],
      buildingTypes: [],
      buildingTypeOther: "",
      buildingCount: "",
      housingCount: "",
      floorCount: "",
      basementCount: "",
      floorArea: "",
      description: "",
    },
    amounts: {
      worksAmount: "",
      technicalFeesAmount: "",
      totalConstructionAmount: "",
      existingToInsureAmount: "",
      startDate: "",
      endDate: "",
    },
    stakeholders: {
      ownerTakesPart: "",
      architectMission: "",
      architectOtherMission: "",
      designOffice: "",
      designOfficeMission: "",
      soilStudy: "",
      soilStudyMission: "",
      technicalController: "",
      technicalControllerMission: "",
    },
    signature,
  };
}

export function rcdPibDefaults(simulation: SimulatorSnapshot | null): RCDPIBQuestionnaireValues {
  return {
    identification: companyIdentification(simulation),
    activity: { largestSiteCost: "", ...revenueSplit },
    pib: { activities: [], yearsOfExperience: "" },
    workTypes: shareRowsDefault(workTypeShares),
    missionTypes: shareRowsDefault(missionTypeShares),
    claims: [],
    history: {
      previousInsurer: "",
      annualPremium: "",
      rate: "",
      renewalDate: "",
      policyInForce: "",
      collectiveProcedure: "",
      terminationReason: "",
      brokerValidated: "",
    },
    signature,
  };
}
