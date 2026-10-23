"use client";

import { useWatch } from "react-hook-form";
import { doDefaults } from "@/lib/questionnaires/defaults";
import {
  doArchitectMissions,
  doBuildingTypes,
  doDestinations,
  doGuarantees,
  doWorkTypes,
  yesNo,
} from "@/lib/questionnaires/options";
import { doSchema } from "@/lib/questionnaires/schemas";
import { submitQuestionnaire } from "@/lib/questionnaires/submitQuestionnaire";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";
import {
  CheckboxGroupField,
  DateField,
  FieldGrid,
  NumberField,
  RadioGroupField,
  SubHeading,
  TextareaField,
  TextField,
} from "./fields";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireSection } from "./QuestionnaireSection";
import { SignatureFields } from "./SignatureFields";

/** Fiche préta DO (Dommages Ouvrage). */
export function QuestionnaireDO({ simulation }: { simulation: SimulatorSnapshot | null }) {
  return (
    <QuestionnaireForm schema={doSchema} defaultValues={doDefaults()} onSubmit={(data) => submitQuestionnaire({ type: "do", data, simulation })}>
      <QuestionnaireSection title="Garanties souhaitées">
        <CheckboxGroupField name="guarantees" legend="Garanties souhaitées" options={doGuarantees} required columns="sm:grid-cols-2" />
      </QuestionnaireSection>

      <QuestionnaireSection number={1} title="Identification du maître d'ouvrage et du programme">
        <FieldGrid>
          <TextField
            name="owner.ownerName"
            label="Nom du maître d'ouvrage (celui qui fait construire / gérant)"
            required
            autoComplete="organization"
            className="sm:col-span-2"
          />
          <TextField name="owner.address" label="Adresse" autoComplete="street-address" className="sm:col-span-2" />
          <TextField name="owner.postalCode" label="Code postal" inputMode="numeric" autoComplete="postal-code" />
          <TextField name="owner.city" label="Ville" autoComplete="address-level2" />
          <TextField name="owner.applicantName" label="Nom de la personne faisant la demande" required autoComplete="name" className="sm:col-span-2" />
          <TextField name="owner.phone" label="Téléphone" type="tel" inputMode="tel" required autoComplete="tel" />
          <TextField name="owner.email" label="Email" type="email" inputMode="email" required autoComplete="email" />
        </FieldGrid>
        <SubHeading>Programme</SubHeading>
        <FieldGrid>
          <TextField name="owner.programName" label="Nom du programme" />
          <TextField name="owner.siret" label="SIRET" inputMode="numeric" hint="14 chiffres" />
          <TextField name="owner.siteAddress" label="Adresse du chantier" className="sm:col-span-2" />
          <TextField name="owner.sitePostalCode" label="Code postal du chantier" inputMode="numeric" />
          <TextField name="owner.siteCity" label="Ville du chantier" />
          <TextField name="owner.buildingPermitNumber" label="Numéro du permis de construire" />
          <DateField name="owner.buildingPermitDate" label="Date de délivrance" />
        </FieldGrid>
      </QuestionnaireSection>

      <QuestionnaireSection number={2} title="Caractéristiques du projet et des bâtiments">
        <RadioGroupField name="project.destination" legend="Construction destinée à" options={doDestinations} />
        <CheckboxGroupField name="project.workTypes" legend="Type de travaux" options={doWorkTypes} />
        <BuildingTypes />
        <FieldGrid className="lg:grid-cols-3">
          <NumberField name="project.buildingCount" label="Nombre de bâtiments" />
          <NumberField name="project.housingCount" label="Nombre de logements" />
          <NumberField name="project.floorCount" label="Nombre d'étages" />
          <NumberField name="project.basementCount" label="Dont sous-sol" />
          <NumberField name="project.floorArea" label="Surface plancher (m²)" suffix="m²" />
        </FieldGrid>
        <TextareaField name="project.description" label="Description de l'opération" rows={5} />
      </QuestionnaireSection>

      <QuestionnaireSection number={3} title="Montants et calendrier du chantier">
        <FieldGrid>
          <NumberField name="amounts.worksAmount" label="Montant des travaux TTC" suffix="€" />
          <NumberField
            name="amounts.technicalFeesAmount"
            label="Montant honoraires intervenants techniques TTC (BET, étude sol, MOE, etc.)"
            suffix="€"
          />
          <NumberField name="amounts.totalConstructionAmount" label="Montant total construction TTC" suffix="€" />
          <NumberField name="amounts.existingToInsureAmount" label="Montant des existants à garantir" suffix="€" />
          <DateField name="amounts.startDate" label="Date prévisionnelle de début de travaux" />
          <DateField name="amounts.endDate" label="Date prévisionnelle de fin de travaux" />
        </FieldGrid>
      </QuestionnaireSection>

      <QuestionnaireSection number={4} title="Intervenants et missions techniques">
        <RadioGroupField name="stakeholders.ownerTakesPart" legend="Le maître d'ouvrage intervient-il directement dans les travaux ?" options={yesNo} />
        <ArchitectMission />
        <StakeholderMission name="designOffice" legend="Bureau d'Études (BET)" />
        <StakeholderMission name="soilStudy" legend="Étude de sol" />
        <StakeholderMission name="technicalController" legend="Contrôleur Technique" />
      </QuestionnaireSection>

      <QuestionnaireSection title="Signature">
        <SignatureFields signatureLabel="Signature / Tampon du maître d'ouvrage" />
      </QuestionnaireSection>
    </QuestionnaireForm>
  );
}

function BuildingTypes() {
  const selected = (useWatch({ name: "project.buildingTypes" }) as string[] | undefined) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <CheckboxGroupField name="project.buildingTypes" legend="Type de bâtiment" options={doBuildingTypes} />
      {selected.includes("autre") && (
        <TextField name="project.buildingTypeOther" label="Autre type de bâtiment" required className="sm:max-w-md" />
      )}
    </div>
  );
}

function ArchitectMission() {
  const mission = useWatch({ name: "stakeholders.architectMission" }) as string | undefined;
  return (
    <div className="flex flex-col gap-4 border-t border-line pt-6">
      <RadioGroupField name="stakeholders.architectMission" legend="Maître d'œuvre / Architecte" options={doArchitectMissions} />
      {mission === "autre-mission" && (
        <TextField name="stakeholders.architectOtherMission" label="Précisez la mission" required className="sm:max-w-md" />
      )}
    </div>
  );
}

/** « [ ] Oui [ ] Non — Mission : ____ » (BET, étude de sol, contrôleur technique). */
function StakeholderMission({ name, legend }: { name: "designOffice" | "soilStudy" | "technicalController"; legend: string }) {
  return (
    <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-6">
      <RadioGroupField name={`stakeholders.${name}`} legend={legend} options={yesNo} />
      <TextField name={`stakeholders.${name}Mission`} label="Mission" />
    </div>
  );
}
