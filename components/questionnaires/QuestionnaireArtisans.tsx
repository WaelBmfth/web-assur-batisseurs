"use client";

import { artisansDefaults } from "@/lib/questionnaires/defaults";
import { artisanActivities, yesNo } from "@/lib/questionnaires/options";
import { artisansSchema } from "@/lib/questionnaires/schemas";
import { submitQuestionnaire } from "@/lib/questionnaires/submitQuestionnaire";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";
import { ClaimsTable } from "./ClaimsTable";
import { ActivityCharacteristicsSection, CompanyIdentificationSection } from "./CompanySections";
import { DateField, FieldGrid, NumberField, RadioGroupField, TextField } from "./fields";
import { QuestionnaireForm } from "./QuestionnaireForm";
import { QuestionnaireSection } from "./QuestionnaireSection";
import { SharePercentList } from "./SharePercentList";
import { SignatureFields } from "./SignatureFields";

/** Fiche de pré-tarification assurance bâtiment (artisans). */
export function QuestionnaireArtisans({ simulation }: { simulation: SimulatorSnapshot | null }) {
  return (
    <QuestionnaireForm
      schema={artisansSchema}
      defaultValues={artisansDefaults(simulation)}
      onSubmit={(data) => submitQuestionnaire({ type: "artisans", data, simulation })}
    >
      <CompanyIdentificationSection variant="artisans" />
      <ActivityCharacteristicsSection variant="artisans" />

      <QuestionnaireSection
        number={3}
        title="Activités bâtiment"
        description="Nomenclature France Assureurs 2019 — 40 activités. Cochez vos activités et indiquez la part de votre CA pour chacune."
      >
        <SharePercentList name="activities" legend="Activités bâtiment" options={artisanActivities} percentLabel="% CA" totalLabel="Total % CA" />
      </QuestionnaireSection>

      <QuestionnaireSection number={4} title="Déclaration des sinistres" description="Au cours des 5 dernières années.">
        <ClaimsTable />
      </QuestionnaireSection>

      <QuestionnaireSection number={5} title="Antécédents d'assurance & signature">
        <FieldGrid className="lg:grid-cols-4">
          <TextField name="history.previousInsurer" label="Nom de la compagnie précédente" className="sm:col-span-2 lg:col-span-1" />
          <NumberField name="history.annualPremium" label="Prime annuelle (€)" suffix="€" />
          <NumberField name="history.rate" label="Taux TTC (%)" suffix="%" />
          <DateField name="history.renewalDate" label="Date d'échéance" />
        </FieldGrid>
        <FieldGrid>
          <RadioGroupField name="history.policyInForce" legend="Police en cours ?" options={yesNo} />
          <RadioGroupField name="history.receivership" legend="Redressement judiciaire ?" options={yesNo} />
        </FieldGrid>
        <SignatureFields signatureLabel="Signature / Cachet" />
      </QuestionnaireSection>
    </QuestionnaireForm>
  );
}
