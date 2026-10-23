"use client";

import { rcdPibDefaults } from "@/lib/questionnaires/defaults";
import { missionTypeShares, pibActivities, workTypeShares, yesNo } from "@/lib/questionnaires/options";
import { rcdPibSchema } from "@/lib/questionnaires/schemas";
import { submitQuestionnaire } from "@/lib/questionnaires/submitQuestionnaire";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";
import { ClaimsTable } from "./ClaimsTable";
import { ActivityCharacteristicsSection, CompanyIdentificationSection } from "./CompanySections";
import { CheckboxGroupField, DateField, FieldGrid, NumberField, RadioGroupField, SubHeading, TextField } from "./fields";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireSection } from "./QuestionnaireSection";
import { SharePercentList } from "./SharePercentList";
import { SignatureFields } from "./SignatureFields";

/** Fiche préta RCD PIB (professions intellectuelles du bâtiment). Sections numérotées comme la fiche Excel. */
export function QuestionnaireRCDPIB({ simulation }: { simulation: SimulatorSnapshot | null }) {
  return (
    <QuestionnaireForm
      schema={rcdPibSchema}
      defaultValues={rcdPibDefaults(simulation)}
      onSubmit={(data) => submitQuestionnaire({ type: "rcd-pib", data, simulation })}
    >
      <CompanyIdentificationSection variant="rcd-pib" />
      <ActivityCharacteristicsSection variant="rcd-pib" />

      <QuestionnaireSection number={3} title="Activités intellectuelles du bâtiment (PIB)">
        <CheckboxGroupField
          name="pib.activities"
          legend="Activités exercées"
          options={pibActivities}
          required
          columns="sm:grid-cols-2 lg:grid-cols-3"
        />
        <NumberField name="pib.yearsOfExperience" label="Nombre d'années d'expérience du ou des activités" suffix="ans" className="sm:max-w-sm" />
      </QuestionnaireSection>

      <QuestionnaireSection number={4} title="Type d'ouvrage et type de mission">
        <SubHeading note="Cochez les types d'ouvrage concernés et indiquez leur part.">Répartition par Type d&apos;Ouvrage</SubHeading>
        <SharePercentList name="workTypes" legend="Répartition par Type d'Ouvrage" options={workTypeShares} percentLabel="%" />
        <SubHeading note="Cochez les missions exercées et indiquez leur part.">Répartition par Type de Mission</SubHeading>
        <SharePercentList name="missionTypes" legend="Répartition par Type de Mission" options={missionTypeShares} percentLabel="%" />
      </QuestionnaireSection>

      <QuestionnaireSection number={5} title="Déclaration des sinistres" description="Au cours des 5 dernières années.">
        <ClaimsTable />
      </QuestionnaireSection>

      <QuestionnaireSection number={6} title="Antécédents d'assurance & historique">
        <FieldGrid className="lg:grid-cols-4">
          <TextField name="history.previousInsurer" label="Nom de la compagnie précédente" className="sm:col-span-2 lg:col-span-1" />
          <NumberField name="history.annualPremium" label="Prime annuelle payée (€)" suffix="€" />
          <NumberField name="history.rate" label="Taux TTC (%)" suffix="%" />
          <DateField name="history.renewalDate" label="Date d'échéance" />
        </FieldGrid>
        <FieldGrid>
          <RadioGroupField name="history.policyInForce" legend="Police en cours ?" options={yesNo} />
          <RadioGroupField name="history.collectiveProcedure" legend="Procédure collective / Redressement judiciaire ?" options={yesNo} />
        </FieldGrid>
        <TextField name="history.terminationReason" label="Motif de résiliation (si résilié)" />
        <RadioGroupField name="history.brokerValidated" legend="Étude réalisée et validée par le courtier ?" options={yesNo} />
        <SignatureFields signatureLabel="Signature et tampon du prospect" />
      </QuestionnaireSection>
    </QuestionnaireForm>
  );
}
