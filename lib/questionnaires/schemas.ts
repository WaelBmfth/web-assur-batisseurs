import { z } from "zod";
import {
  doArchitectMissions,
  doBuildingTypes,
  doDestinations,
  doGuarantees,
  doWorkTypes,
  largestSiteCosts,
  optionValues,
  paymentFrequencies,
  pibActivities,
  yesNo,
  type Option,
} from "./options";
import {
  formatPercent,
  multiChoice,
  optionalAmount,
  optionalChoice,
  optionalDate,
  optionalNumber,
  optionalPercent,
  optionalPostalCode,
  optionalSiret,
  optionalText,
  requiredEmail,
  requiredPercent,
  requiredPhone,
  requiredText,
  sumPercents,
} from "./validation";

/*
 * Schémas des trois fiches de pré-tarification. Chaque schéma suit les sections
 * de la fiche Excel correspondante. Champs obligatoires retenus (les fiches n'en
 * marquent aucun) : coordonnées permettant de recontacter le demandeur, et les
 * éléments sans lesquels la demande n'a pas d'objet (activités, garanties).
 */

const yesNoValues = optionValues(yesNo);

/* ---------- Blocs communs ---------- */

const dateRange = <T extends z.ZodTypeAny>(schema: T, start: string, end: string, message: string) =>
  schema.superRefine((value, ctx) => {
    const data = value as Record<string, string | null>;
    if (data[start] && data[end] && data[end]! < data[start]!) {
      ctx.addIssue({ code: "custom", path: [end], message });
    }
  });

/** Ligne de sélection avec pourcentage (activités, types d'ouvrage, missions). */
const shareRow = z.object({
  code: z.string(),
  selected: z.boolean(),
  percent: z.string(),
});
export type ShareRowInput = z.input<typeof shareRow>;

export const shareRowsDefault = (options: readonly Option[]): ShareRowInput[] =>
  options.map((o) => ({ code: o.value, selected: false, percent: "" }));

/**
 * Liste « [ ] libellé — % » : valide les pourcentages des lignes cochées et leur
 * total (≤ 100 %), puis ne conserve que les lignes cochées.
 */
const shareList = ({ atLeastOne }: { atLeastOne?: string } = {}) =>
  z
    .array(shareRow)
    .superRefine((rows, ctx) => {
      const selected = rows.map((row, index) => ({ row, index })).filter(({ row }) => row.selected);
      if (atLeastOne && selected.length === 0) ctx.addIssue({ code: "custom", message: atLeastOne });
      for (const { row, index } of selected) {
        const check = optionalPercent().safeParse(row.percent);
        if (!check.success) {
          ctx.addIssue({ code: "custom", path: [index, "percent"], message: check.error.issues[0]!.message });
        }
      }
      const total = sumPercents(selected.map(({ row }) => row.percent));
      if (total > 100) {
        ctx.addIssue({ code: "custom", message: `Le total des pourcentages dépasse 100 % (actuellement ${formatPercent(total)}).` });
      }
    })
    .transform((rows) =>
      rows
        .filter((row) => row.selected)
        .map((row) => ({ code: row.code, percent: row.percent ? optionalPercent().parse(row.percent) : null })),
    );

/** Déclaration des sinistres (5 dernières années) — fiches Artisans et RCD PIB. */
export const claimSchema = z.object({
  date: z.string().trim().min(1, "Indiquez la date du sinistre.").pipe(optionalDate()),
  nature: requiredText("Indiquez la nature du sinistre."),
  responsibility: optionalPercent(),
  estimatedAmount: optionalAmount(),
  settledAmount: optionalAmount(),
  closed: optionalChoice(yesNoValues),
});
export type ClaimInput = z.input<typeof claimSchema>;
export const emptyClaim: ClaimInput = {
  date: "",
  nature: "",
  responsibility: "",
  estimatedAmount: "",
  settledAmount: "",
  closed: "",
};

const signatureSchema = z.object({ place: optionalText(), date: optionalDate(), signature: optionalText() });

const contactFields = {
  applicantName: requiredText("Veuillez renseigner le nom du demandeur."),
  phone: requiredPhone(),
  email: requiredEmail(),
};

/** Section 1 commune aux fiches Artisans et RCD PIB. */
const companyIdentification = {
  effectiveDate: optionalDate(),
  endDate: optionalDate(),
  paymentFrequency: optionalChoice(optionValues(paymentFrequencies)),
  companyName: requiredText("Veuillez renseigner la raison sociale ou le nom du gérant."),
  address: optionalText(),
  postalCode: optionalPostalCode(),
  city: optionalText(),
  ...contactFields,
  creationDate: optionalDate(),
  siret: optionalSiret(),
  nafCode: optionalText(),
  headcount: optionalNumber({ integer: true }),
  forecastRevenue: optionalAmount(),
};

const endAfterStart = "La date de fin doit être postérieure à la date d'effet.";

/** Section 2 commune : répartition du CA et sous-traitance. */
const revenueSplitFields = (required: boolean) => {
  const percent = required ? requiredPercent("Indiquez un pourcentage.") : optionalPercent();
  return { privateShare: percent, professionalShare: percent, renovationShare: percent, newBuildShare: percent };
};

const subcontractingFields = {
  subcontractedShare: optionalPercent(),
  asSubcontractorShare: optionalPercent(),
};

type SplitValues = Record<
  "privateShare" | "professionalShare" | "renovationShare" | "newBuildShare" | "subcontractedShare" | "asSubcontractorShare",
  number | null
>;

const total = (...values: (number | null)[]) => values.reduce<number>((sum, v) => sum + (v ?? 0), 0);

/**
 * Répartition du CA : deux axes indépendants (particuliers / professionnels et
 * rénovation / neuf). « Total = 100% » (fiche Artisans) s'applique à chaque axe ;
 * sans cette mention (fiche RCD PIB), chaque axe ne peut simplement pas dépasser 100 %.
 */
function checkRevenueSplit(data: SplitValues, ctx: z.RefinementCtx, mustTotal100: boolean) {
  const pairs = [
    ["privateShare", "professionalShare", "Particuliers + Professionnels"],
    ["renovationShare", "newBuildShare", "Rénovation + Neuf"],
  ] as const;
  for (const [a, b, label] of pairs) {
    const sum = total(data[a], data[b]);
    if (mustTotal100 ? sum !== 100 : sum > 100) {
      ctx.addIssue({
        code: "custom",
        path: [b],
        message: `${label} doit totaliser ${mustTotal100 ? "" : "au plus "}100 % (actuellement ${formatPercent(sum)}).`,
      });
    }
  }
  const subcontracting = total(data.subcontractedShare, data.asSubcontractorShare);
  if (subcontracting > 100) {
    ctx.addIssue({
      code: "custom",
      path: ["asSubcontractorShare"],
      message: `La sous-traitance ne peut pas dépasser 100 % au total (actuellement ${formatPercent(subcontracting)}).`,
    });
  }
}

/* ---------- Fiche Artisans ---------- */

export const artisansSchema = z.object({
  identification: dateRange(
    z.object({ ...companyIdentification, previousYearRevenue: optionalAmount() }),
    "effectiveDate",
    "endDate",
    endAfterStart,
  ),
  activity: z
    .object({
      largestSiteCost: optionalChoice(optionValues(largestSiteCosts)),
      managerTakesPart: optionalChoice(yesNoValues),
      ...revenueSplitFields(true),
      ...subcontractingFields,
    })
    .superRefine((data, ctx) => checkRevenueSplit(data, ctx, true)),
  activities: shareList({ atLeastOne: "Sélectionnez au moins une activité." }),
  claims: z.array(claimSchema),
  history: z.object({
    previousInsurer: optionalText(),
    annualPremium: optionalAmount(),
    rate: optionalPercent(),
    renewalDate: optionalDate(),
    policyInForce: optionalChoice(yesNoValues),
    receivership: optionalChoice(yesNoValues),
  }),
  signature: signatureSchema,
});

/* ---------- Fiche DO (Dommages Ouvrage) ---------- */

export const doSchema = z.object({
  guarantees: multiChoice(optionValues(doGuarantees)).min(1, "Sélectionnez au moins une garantie."),
  owner: z.object({
    ownerName: requiredText("Veuillez renseigner le nom du maître d'ouvrage."),
    address: optionalText(),
    postalCode: optionalPostalCode(),
    city: optionalText(),
    ...contactFields,
    programName: optionalText(),
    siret: optionalSiret(),
    siteAddress: optionalText(),
    sitePostalCode: optionalPostalCode(),
    siteCity: optionalText(),
    buildingPermitNumber: optionalText(),
    buildingPermitDate: optionalDate(),
  }),
  project: z
    .object({
      destination: optionalChoice(optionValues(doDestinations)),
      workTypes: multiChoice(optionValues(doWorkTypes)),
      buildingTypes: multiChoice(optionValues(doBuildingTypes)),
      buildingTypeOther: optionalText(),
      buildingCount: optionalNumber({ integer: true }),
      housingCount: optionalNumber({ integer: true }),
      floorCount: optionalNumber({ integer: true }),
      basementCount: optionalNumber({ integer: true }),
      floorArea: optionalNumber(),
      description: optionalText(),
    })
    .superRefine((data, ctx) => {
      if (data.buildingTypes.includes("autre") && !data.buildingTypeOther) {
        ctx.addIssue({ code: "custom", path: ["buildingTypeOther"], message: "Précisez le type de bâtiment." });
      }
    }),
  amounts: dateRange(
    z.object({
      worksAmount: optionalAmount(),
      technicalFeesAmount: optionalAmount(),
      totalConstructionAmount: optionalAmount(),
      existingToInsureAmount: optionalAmount(),
      startDate: optionalDate(),
      endDate: optionalDate(),
    }),
    "startDate",
    "endDate",
    "La date de fin doit être postérieure à la date de début des travaux.",
  ),
  stakeholders: z
    .object({
      ownerTakesPart: optionalChoice(yesNoValues),
      architectMission: optionalChoice(optionValues(doArchitectMissions)),
      architectOtherMission: optionalText(),
      designOffice: optionalChoice(yesNoValues),
      designOfficeMission: optionalText(),
      soilStudy: optionalChoice(yesNoValues),
      soilStudyMission: optionalText(),
      technicalController: optionalChoice(yesNoValues),
      technicalControllerMission: optionalText(),
    })
    .superRefine((data, ctx) => {
      if (data.architectMission === "autre-mission" && !data.architectOtherMission) {
        ctx.addIssue({ code: "custom", path: ["architectOtherMission"], message: "Précisez la mission." });
      }
    }),
  signature: signatureSchema,
});

/* ---------- Fiche RCD PIB ---------- */

export const rcdPibSchema = z.object({
  identification: dateRange(z.object(companyIdentification), "effectiveDate", "endDate", endAfterStart),
  activity: z
    .object({
      largestSiteCost: optionalChoice(optionValues(largestSiteCosts)),
      ...revenueSplitFields(false),
      ...subcontractingFields,
    })
    .superRefine((data, ctx) => checkRevenueSplit(data, ctx, false)),
  pib: z.object({
    activities: multiChoice(optionValues(pibActivities)).min(1, "Sélectionnez au moins une activité."),
    yearsOfExperience: optionalNumber({ integer: true, max: 99 }),
  }),
  workTypes: shareList(),
  missionTypes: shareList(),
  claims: z.array(claimSchema),
  history: z.object({
    previousInsurer: optionalText(),
    annualPremium: optionalAmount(),
    rate: optionalPercent(),
    renewalDate: optionalDate(),
    policyInForce: optionalChoice(yesNoValues),
    collectiveProcedure: optionalChoice(yesNoValues),
    terminationReason: optionalText(),
    brokerValidated: optionalChoice(yesNoValues),
  }),
  signature: signatureSchema,
});
