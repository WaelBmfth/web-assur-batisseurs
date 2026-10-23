"use client";

import { largestSiteCosts, paymentFrequencies, yesNo } from "@/lib/questionnaires/options";
import { DateField, FieldGrid, NumberField, RadioGroupField, SubHeading, TextField } from "./fields";
import { QuestionnaireSection } from "./QuestionnaireSection";

/*
 * Sections 1 et 2, communes aux fiches Artisans et RCD PIB. Les libellés
 * diffèrent légèrement d'une fiche à l'autre : chaque variante garde ceux de sa fiche.
 */

type Variant = "artisans" | "rcd-pib";

const labels = {
  artisans: { companyName: "Raison sociale / Nom gérant", address: "Adresse complète", postalCode: "Code postal" },
  "rcd-pib": { companyName: "Raison sociale ou Nom du gérant", address: "Adresse", postalCode: "Code postal (CP)" },
} as const;

export function CompanyIdentificationSection({ variant }: { variant: Variant }) {
  const l = labels[variant];
  return (
    <QuestionnaireSection number={1} title="Identification de l'entreprise & du demandeur">
      <FieldGrid className="lg:grid-cols-3">
        <DateField name="identification.effectiveDate" label="Date d'effet souhaitée" />
        <DateField name="identification.endDate" label="Date de fin de garantie souhaitée" />
        <RadioGroupField name="identification.paymentFrequency" legend="Fractionnement" options={paymentFrequencies} className="sm:col-span-2 lg:col-span-1" />
      </FieldGrid>
      <SubHeading>Entreprise</SubHeading>
      <FieldGrid>
        <TextField name="identification.companyName" label={l.companyName} required autoComplete="organization" className="sm:col-span-2" />
        <TextField name="identification.address" label={l.address} autoComplete="street-address" className="sm:col-span-2" />
        <TextField name="identification.postalCode" label={l.postalCode} inputMode="numeric" autoComplete="postal-code" />
        <TextField name="identification.city" label="Ville" autoComplete="address-level2" />
      </FieldGrid>
      <SubHeading>Demandeur</SubHeading>
      <FieldGrid>
        <TextField name="identification.applicantName" label="Nom du demandeur" required autoComplete="name" className="sm:col-span-2" />
        <TextField name="identification.phone" label="Téléphone" type="tel" inputMode="tel" required autoComplete="tel" />
        <TextField name="identification.email" label="Email" type="email" inputMode="email" required autoComplete="email" />
      </FieldGrid>
      <SubHeading>Informations légales et chiffres clés</SubHeading>
      <FieldGrid className="lg:grid-cols-3">
        <DateField name="identification.creationDate" label="Date de création" />
        <TextField name="identification.siret" label="N° SIRET" inputMode="numeric" hint="14 chiffres" />
        <TextField name="identification.nafCode" label="Code NAF / APE" />
        <NumberField name="identification.headcount" label="Effectif total" />
        <NumberField name="identification.forecastRevenue" label="CA prévisionnel" suffix="€" />
        {variant === "artisans" && <NumberField name="identification.previousYearRevenue" label="CA N-1" suffix="€" />}
      </FieldGrid>
    </QuestionnaireSection>
  );
}

export function ActivityCharacteristicsSection({ variant }: { variant: Variant }) {
  const artisans = variant === "artisans";
  return (
    <QuestionnaireSection number={2} title="Caractéristiques & répartition de l'activité">
      <RadioGroupField name="activity.largestSiteCost" legend="Coût du plus gros chantier" options={largestSiteCosts} />
      {artisans && <RadioGroupField name="activity.managerTakesPart" legend="Le gérant participe-t-il aux travaux ?" options={yesNo} />}

      <SubHeading
        note={
          artisans
            ? "Total = 100 % : Particuliers + Professionnels = 100 % et Rénovation + Neuf = 100 %."
            : "Chaque répartition (Particuliers / Professionnels, Rénovation / Neuf) ne peut pas dépasser 100 %."
        }
      >
        {artisans ? "Répartition du CA (Total = 100%)" : "Répartition du Chiffre d'Affaires"}
      </SubHeading>
      <FieldGrid>
        <NumberField name="activity.privateShare" label="Part Particuliers" suffix="%" required={artisans} />
        <NumberField name="activity.professionalShare" label="Part Professionnels" suffix="%" required={artisans} />
        <NumberField name="activity.renovationShare" label="Part Rénovation" suffix="%" required={artisans} />
        <NumberField name="activity.newBuildShare" label="Part Neuf" suffix="%" required={artisans} />
      </FieldGrid>

      <SubHeading>{artisans ? "Sous-traitance (Total = 100%)" : "Sous-traitance"}</SubHeading>
      <FieldGrid>
        <NumberField
          name="activity.subcontractedShare"
          label={artisans ? "Sous-traitance effectuée (confiée à des tiers)" : "Pourcentage donné à la sous-traitance"}
          suffix="%"
        />
        <NumberField
          name="activity.asSubcontractorShare"
          label={artisans ? "Donnée en sous-traitance (travaillé comme sous-traitant)" : "Pourcentage donné à sous-traitant en tant que sous-traitant"}
          suffix="%"
        />
      </FieldGrid>
    </QuestionnaireSection>
  );
}
