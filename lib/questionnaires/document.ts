import { formatEuro, formatNumber } from "@/lib/format";
import {
  artisanActivities,
  doArchitectMissions,
  doBuildingTypes,
  doDestinations,
  doGuarantees,
  doWorkTypes,
  largestSiteCosts,
  missionTypeShares,
  paymentFrequencies,
  pibActivities,
  workTypeShares,
  yesNo,
  type Option,
} from "./options";
import { questionnaireConfig } from "./questionnaireConfig";
import type {
  ArtisansQuestionnaireData,
  DOQuestionnaireData,
  QuestionnaireType,
  RCDPIBQuestionnaireData,
  SimulatorSnapshot,
} from "./types";

/*
 * Version « document » d'un questionnaire validé : sections et questions dans
 * l'ordre des fiches Excel, réponses mises en forme en français. Source unique
 * du PDF et de l'e-mail de confirmation. Toute question figure, même sans réponse.
 */

export type DocumentRow = { label: string; value: string };

export type DocumentBlock =
  | { kind: "fields"; title?: string; rows: DocumentRow[] }
  | { kind: "table"; title?: string; columns: string[]; rows: string[][]; emptyText: string };

export type DocumentSection = { title: string; blocks: DocumentBlock[] };

export type QuestionnaireDocument = {
  type: QuestionnaireType;
  title: string;
  submissionId: string;
  submittedAt: Date;
  applicant: { name: string; email: string; organisation: string };
  /** Rappel de la simulation à l'origine de la demande, si elle existe. */
  simulation: DocumentRow[] | null;
  sections: DocumentSection[];
};

export const NOT_ANSWERED = "Non renseigné";

const text = (value: string | null | undefined) => (value ? value : NOT_ANSWERED);
const euros = (value: number | null) => (value === null ? NOT_ANSWERED : formatEuro(value));
const percent = (value: number | null) => (value === null ? NOT_ANSWERED : `${formatNumber(value)} %`);
const count = (value: number | null, unit = "") => (value === null ? NOT_ANSWERED : `${formatNumber(value)}${unit}`);

/** « 2027-01-15 » → « 15/01/2027 » */
export function formatIsoDate(value: string | null): string {
  if (!value) return NOT_ANSWERED;
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}

const label = (options: readonly Option[], value: string | null) =>
  value === null ? NOT_ANSWERED : (options.find((o) => o.value === value)?.label ?? value);
const labels = (options: readonly Option[], values: readonly string[]) =>
  values.length ? values.map((v) => label(options, v)).join(" ; ") : NOT_ANSWERED;

type Claim = ArtisansQuestionnaireData["claims"][number];

function claimsTable(claims: Claim[]): DocumentBlock {
  return {
    kind: "table",
    columns: ["Date", "Nature du sinistre", "% Resp.", "Montant estimé (€)", "Montant réglé (€)", "Clos ?"],
    rows: claims.map((c) => [
      formatIsoDate(c.date),
      c.nature,
      percent(c.responsibility),
      euros(c.estimatedAmount),
      euros(c.settledAmount),
      label(yesNo, c.closed),
    ]),
    emptyText: "Aucun sinistre déclaré au cours des 5 dernières années.",
  };
}

function shareTable(rows: { code: string; percent: number | null }[], options: readonly Option[], firstColumn: string, emptyText: string): DocumentBlock {
  const total = rows.reduce((sum, r) => sum + (r.percent ?? 0), 0);
  return {
    kind: "table",
    columns: [firstColumn, "%"],
    rows: [
      ...rows.map((r) => [label(options, r.code), percent(r.percent)]),
      ...(rows.length ? [["Total", `${formatNumber(total)} %`]] : []),
    ],
    emptyText,
  };
}

function signatureRows(signature: { place: string | null; date: string | null; signature: string | null }, signatureLabel: string): DocumentBlock {
  return {
    kind: "fields",
    title: "Signature",
    rows: [
      { label: "Fait à", value: text(signature.place) },
      { label: "Le", value: formatIsoDate(signature.date) },
      { label: signatureLabel, value: text(signature.signature) },
    ],
  };
}

type Identification = ArtisansQuestionnaireData["identification"] | RCDPIBQuestionnaireData["identification"];

function identificationSection(id: Identification, variant: "artisans" | "rcd-pib"): DocumentSection {
  const artisans = variant === "artisans";
  return {
    title: "1. Identification de l'entreprise & du demandeur",
    blocks: [
      {
        kind: "fields",
        rows: [
          { label: "Date d'effet souhaitée", value: formatIsoDate(id.effectiveDate) },
          { label: "Date de fin de garantie souhaitée", value: formatIsoDate(id.endDate) },
          { label: "Fractionnement", value: label(paymentFrequencies, id.paymentFrequency) },
          { label: artisans ? "Raison sociale / Nom gérant" : "Raison sociale ou Nom du gérant", value: id.companyName },
          { label: artisans ? "Adresse complète" : "Adresse", value: text(id.address) },
          { label: artisans ? "Code postal" : "Code postal (CP)", value: text(id.postalCode) },
          { label: "Ville", value: text(id.city) },
          { label: "Nom du demandeur", value: id.applicantName },
          { label: "Téléphone", value: id.phone },
          { label: "Email", value: id.email },
          { label: "Date de création", value: formatIsoDate(id.creationDate) },
          { label: "N° SIRET", value: text(id.siret) },
          { label: "Code NAF / APE", value: text(id.nafCode) },
          { label: "Effectif total", value: count(id.headcount) },
          { label: "CA prévisionnel", value: euros(id.forecastRevenue) },
          ...("previousYearRevenue" in id ? [{ label: "CA N-1", value: euros(id.previousYearRevenue) }] : []),
        ],
      },
    ],
  };
}

type Activity = ArtisansQuestionnaireData["activity"] | RCDPIBQuestionnaireData["activity"];

function activitySection(a: Activity, variant: "artisans" | "rcd-pib"): DocumentSection {
  const artisans = variant === "artisans";
  return {
    title: artisans ? "2. Caractéristiques & répartition de l'activité" : "2. Caractéristiques et répartition de l'activité",
    blocks: [
      {
        kind: "fields",
        rows: [
          { label: "Coût du plus gros chantier", value: label(largestSiteCosts, a.largestSiteCost) },
          ...("managerTakesPart" in a ? [{ label: "Le gérant participe-t-il aux travaux ?", value: label(yesNo, a.managerTakesPart) }] : []),
        ],
      },
      {
        kind: "fields",
        title: artisans ? "Répartition du CA (Total = 100%)" : "Répartition du Chiffre d'Affaires",
        rows: [
          { label: "Part Particuliers", value: percent(a.privateShare) },
          { label: "Part Professionnels", value: percent(a.professionalShare) },
          { label: "Part Rénovation", value: percent(a.renovationShare) },
          { label: "Part Neuf", value: percent(a.newBuildShare) },
        ],
      },
      {
        kind: "fields",
        title: artisans ? "Sous-traitance (Total = 100%)" : "Sous-traitance",
        rows: [
          {
            label: artisans ? "Sous-traitance effectuée (confiée à des tiers)" : "Pourcentage donné à la sous-traitance",
            value: percent(a.subcontractedShare),
          },
          {
            label: artisans
              ? "Donnée en sous-traitance (travaillé comme sous-traitant)"
              : "Pourcentage donné à sous-traitant en tant que sous-traitant",
            value: percent(a.asSubcontractorShare),
          },
        ],
      },
    ],
  };
}

function artisansSections(d: ArtisansQuestionnaireData): DocumentSection[] {
  return [
    identificationSection(d.identification, "artisans"),
    activitySection(d.activity, "artisans"),
    {
      title: "3. Activités bâtiment (Nomenclature France Assureurs 2019 - 40 Activités)",
      blocks: [shareTable(d.activities, artisanActivities, "Code & Libellé Activité", "Aucune activité sélectionnée.")],
    },
    { title: "4. Déclaration des sinistres (au cours des 5 dernières années)", blocks: [claimsTable(d.claims)] },
    {
      title: "5. Antécédents d'assurance & signature",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Nom de la compagnie précédente", value: text(d.history.previousInsurer) },
            { label: "Prime annuelle (€)", value: euros(d.history.annualPremium) },
            { label: "Taux TTC (%)", value: percent(d.history.rate) },
            { label: "Date d'échéance", value: formatIsoDate(d.history.renewalDate) },
            { label: "Police en cours ?", value: label(yesNo, d.history.policyInForce) },
            { label: "Redressement judiciaire ?", value: label(yesNo, d.history.receivership) },
          ],
        },
        signatureRows(d.signature, "Signature / Cachet"),
      ],
    },
  ];
}

function doSections(d: DOQuestionnaireData): DocumentSection[] {
  const s = d.stakeholders;
  return [
    {
      title: "Garanties souhaitées",
      blocks: [{ kind: "fields", rows: [{ label: "Garanties souhaitées", value: labels(doGuarantees, d.guarantees) }] }],
    },
    {
      title: "1. Identification du maître d'ouvrage et du programme",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Nom du maître d'ouvrage (celui qui fait construire / gérant)", value: d.owner.ownerName },
            { label: "Adresse", value: text(d.owner.address) },
            { label: "CP", value: text(d.owner.postalCode) },
            { label: "Ville", value: text(d.owner.city) },
            { label: "Nom de la personne faisant la demande", value: d.owner.applicantName },
            { label: "Tél", value: d.owner.phone },
            { label: "Mail", value: d.owner.email },
            { label: "Nom du programme", value: text(d.owner.programName) },
            { label: "SIRET", value: text(d.owner.siret) },
            { label: "Adresse du chantier", value: text(d.owner.siteAddress) },
            { label: "CP du chantier", value: text(d.owner.sitePostalCode) },
            { label: "Ville du chantier", value: text(d.owner.siteCity) },
            { label: "Numéro du permis de construire", value: text(d.owner.buildingPermitNumber) },
            { label: "Date de délivrance", value: formatIsoDate(d.owner.buildingPermitDate) },
          ],
        },
      ],
    },
    {
      title: "2. Caractéristiques du projet et des bâtiments",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Construction destinée à", value: label(doDestinations, d.project.destination) },
            { label: "Type de travaux", value: labels(doWorkTypes, d.project.workTypes) },
            {
              label: "Type de bâtiment",
              value:
                labels(doBuildingTypes, d.project.buildingTypes) +
                (d.project.buildingTypes.includes("autre") && d.project.buildingTypeOther ? ` (${d.project.buildingTypeOther})` : ""),
            },
            { label: "Nombre de bâtiments", value: count(d.project.buildingCount) },
            { label: "Nombre de logements", value: count(d.project.housingCount) },
            { label: "Nombre d'étages", value: count(d.project.floorCount) },
            { label: "Dont sous-sol", value: count(d.project.basementCount) },
            { label: "Surface plancher (m²)", value: count(d.project.floorArea, " m²") },
            { label: "Description de l'opération", value: text(d.project.description) },
          ],
        },
      ],
    },
    {
      title: "3. Montants et calendrier du chantier",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Montant des travaux TTC", value: euros(d.amounts.worksAmount) },
            {
              label: "Montant honoraires intervenants techniques TTC (BET, étude sol, MOE, etc.)",
              value: euros(d.amounts.technicalFeesAmount),
            },
            { label: "Montant total construction TTC", value: euros(d.amounts.totalConstructionAmount) },
            { label: "Montant des existants à garantir", value: euros(d.amounts.existingToInsureAmount) },
            { label: "Date prévisionnelle de début de travaux", value: formatIsoDate(d.amounts.startDate) },
            { label: "Date prévisionnelle de fin de travaux", value: formatIsoDate(d.amounts.endDate) },
          ],
        },
      ],
    },
    {
      title: "4. Intervenants et missions techniques",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Le maître d'ouvrage intervient-il directement dans les travaux ?", value: label(yesNo, s.ownerTakesPart) },
            {
              label: "Maître d'œuvre / Architecte",
              value:
                label(doArchitectMissions, s.architectMission) +
                (s.architectMission === "autre-mission" && s.architectOtherMission ? ` : ${s.architectOtherMission}` : ""),
            },
            { label: "Bureau d'Études (BET)", value: label(yesNo, s.designOffice) },
            { label: "Bureau d'Études (BET) — Mission", value: text(s.designOfficeMission) },
            { label: "Étude de sol", value: label(yesNo, s.soilStudy) },
            { label: "Étude de sol — Mission", value: text(s.soilStudyMission) },
            { label: "Contrôleur Technique", value: label(yesNo, s.technicalController) },
            { label: "Contrôleur Technique — Mission", value: text(s.technicalControllerMission) },
          ],
        },
      ],
    },
    { title: "Signature", blocks: [signatureRows(d.signature, "Signature / Tampon du maître d'ouvrage")] },
  ];
}

function rcdPibSections(d: RCDPIBQuestionnaireData): DocumentSection[] {
  return [
    identificationSection(d.identification, "rcd-pib"),
    activitySection(d.activity, "rcd-pib"),
    {
      title: "3. Activités intellectuelles du bâtiment (PIB)",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Activités exercées", value: labels(pibActivities, d.pib.activities) },
            { label: "Nombre d'années d'expérience du ou des activités", value: count(d.pib.yearsOfExperience, " ans") },
          ],
        },
      ],
    },
    {
      title: "4. Type d'ouvrage et type de mission",
      blocks: [
        { ...shareTable(d.workTypes, workTypeShares, "Répartition par Type d'Ouvrage", "Aucun type d'ouvrage renseigné."), title: "Répartition par Type d'Ouvrage" },
        { ...shareTable(d.missionTypes, missionTypeShares, "Répartition par Type de Mission", "Aucun type de mission renseigné."), title: "Répartition par Type de Mission" },
      ],
    },
    { title: "5. Déclaration des sinistres (au cours des 5 dernières années)", blocks: [claimsTable(d.claims)] },
    {
      title: "6. Antécédents d'assurance & historique",
      blocks: [
        {
          kind: "fields",
          rows: [
            { label: "Nom de la compagnie précédente", value: text(d.history.previousInsurer) },
            { label: "Prime annuelle payée (€)", value: euros(d.history.annualPremium) },
            { label: "Taux TTC (%)", value: percent(d.history.rate) },
            { label: "Date d'échéance", value: formatIsoDate(d.history.renewalDate) },
            { label: "Police en cours ?", value: label(yesNo, d.history.policyInForce) },
            { label: "Procédure collective / Redressement judiciaire ?", value: label(yesNo, d.history.collectiveProcedure) },
            { label: "Motif de résiliation (si résilié)", value: text(d.history.terminationReason) },
            { label: "Étude réalisée et validée par le courtier ?", value: label(yesNo, d.history.brokerValidated) },
          ],
        },
        signatureRows(d.signature, "Signature et tampon du prospect"),
      ],
    },
  ];
}

export type ValidatedQuestionnaire =
  | { type: "artisans"; data: ArtisansQuestionnaireData }
  | { type: "do"; data: DOQuestionnaireData }
  | { type: "rcd-pib"; data: RCDPIBQuestionnaireData };

/** Coordonnées du demandeur (destinataire de l'e-mail de confirmation). */
export function getApplicant(q: ValidatedQuestionnaire) {
  if (q.type === "do") {
    return { name: q.data.owner.applicantName, email: q.data.owner.email, organisation: q.data.owner.ownerName };
  }
  const id = q.data.identification;
  return { name: id.applicantName, email: id.email, organisation: id.companyName };
}

export function buildQuestionnaireDocument(
  q: ValidatedQuestionnaire,
  meta: { submissionId: string; submittedAt: Date; simulation: SimulatorSnapshot | null; activityName?: string },
): QuestionnaireDocument {
  const sections = q.type === "artisans" ? artisansSections(q.data) : q.type === "do" ? doSections(q.data) : rcdPibSections(q.data);
  const sim = meta.simulation;
  return {
    type: q.type,
    title: questionnaireConfig[q.type].title,
    submissionId: meta.submissionId,
    submittedAt: meta.submittedAt,
    applicant: getApplicant(q),
    simulation: sim
      ? [
          { label: "Activité", value: meta.activityName ?? sim.activityId },
          { label: "CA prévisionnel HT", value: formatEuro(sim.revenue, { decimals: false }) },
          { label: "Protection Juridique", value: sim.includeLegalProtection ? "Oui" : "Non" },
          ...(sim.companyName ? [{ label: "Raison sociale saisie", value: sim.companyName }] : []),
        ]
      : null,
    sections,
  };
}
