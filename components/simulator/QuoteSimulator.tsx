"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { simulatorContent } from "@/config/calculator-config";
import { calculateQuote, getSelectableActivities } from "@/lib/calculator";
import { parseAmount } from "@/lib/format";
import { emptySimulatorForm, simulatorFormSchema, type SimulatorFormValues } from "@/lib/simulator/formSchema";
import { simulatorSteps } from "@/lib/simulator/steps";
import type { PricingConfig } from "@/types/pricing";
import type { QuoteResult } from "@/types/simulator";
import { CompanyInfoStep } from "./CompanyInfoStep";
import { LiveEstimate } from "./LiveEstimate";
import { ProfileSelector } from "./ProfileSelector";
import { ProtectionJuridique } from "./ProtectionJuridique";
import { QuoteResultView } from "./QuoteResultView";
import { RevenueInput } from "./RevenueInput";
import { Stepper } from "./Stepper";

export type QuoteSubmission = {
  values: SimulatorFormValues;
  quote: QuoteResult;
};

export type QuoteSimulatorProps = {
  /** Configuration tarifaire en vigueur (fournie par le site hôte). */
  pricingConfig: PricingConfig;
  /** Appelé quand l'utilisateur affiche son estimation (ex. : enregistrement d'un lead). */
  onQuote?: (submission: QuoteSubmission) => void;
  contactHref?: string;
  /** Masque le récapitulatif latéral (intégration dans une colonne étroite). */
  hideSidebar?: boolean;
};

const RESULT_STEP = simulatorSteps.length - 1;
const REVENUE_STEP = simulatorSteps.findIndex((s) => s.id === "revenue");

/**
 * Simulateur de devis autonome. Toute la logique tarifaire est déléguée à
 * `calculateQuote` ; ce composant ne gère que le parcours et l'affichage.
 */
export function QuoteSimulator({
  pricingConfig,
  onQuote,
  contactHref = simulatorContent.contactHref,
  hideSidebar = false,
}: QuoteSimulatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasNavigated = useRef(false);

  const {
    register,
    control,
    trigger,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorFormSchema),
    defaultValues: emptySimulatorForm,
    mode: "onTouched",
  });
  const values = useWatch({ control }) as SimulatorFormValues;

  const activities = useMemo(() => getSelectableActivities(pricingConfig), [pricingConfig]);
  const selectedActivity = activities.find((a) => a.id === values.activityId);
  const revenue = parseAmount(values.revenue ?? "");

  const quote = useMemo<QuoteResult | null>(() => {
    if (!values.activityId || !(revenue > 0)) return null;
    return calculateQuote(
      { activityId: values.activityId, revenue, includeLegalProtection: values.legalProtection === "yes" },
      pricingConfig,
    );
  }, [values.activityId, revenue, values.legalProtection, pricingConfig]);

  // Accessibilité : le focus suit le titre de l'étape affichée.
  useEffect(() => {
    if (!hasNavigated.current) return;
    headingRef.current?.focus();
  }, [stepIndex]);

  function goTo(index: number) {
    hasNavigated.current = true;
    setStepIndex(Math.max(0, Math.min(index, RESULT_STEP)));
  }

  const step = simulatorSteps[stepIndex]!;
  const isLastInput = stepIndex === RESULT_STEP - 1;
  // Sur l'étape résultat, le récapitulatif latéral ferait doublon : le résultat prend toute la largeur.
  const withSidebar = !hideSidebar && step.id !== "result";

  async function next() {
    if (!(await trigger(step.fields, { shouldFocus: true }))) return;
    goTo(stepIndex + 1);
  }

  function showResult(submitted: SimulatorFormValues) {
    const parsed = parseAmount(submitted.revenue);
    const result = calculateQuote(
      { activityId: submitted.activityId, revenue: parsed, includeLegalProtection: submitted.legalProtection === "yes" },
      pricingConfig,
    );
    onQuote?.({ values: submitted, quote: result });
    goTo(RESULT_STEP);
  }

  function restart() {
    reset(emptySimulatorForm);
    goTo(0);
  }

  return (
    <div className={withSidebar ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" : ""}>
      <Card className="p-5 sm:p-8">
        <Stepper steps={simulatorSteps} currentIndex={stepIndex} onSelect={goTo} />

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (isLastInput) void handleSubmit(showResult)();
            else void next();
          }}
          className="mt-8"
        >
          <div className="mb-6">
            <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold tracking-tight text-ink focus:outline-none sm:text-[1.75rem]">
              {step.title}
            </h2>
            {step.description && <p className="mt-1.5 text-ink-muted">{step.description}</p>}
          </div>

          {step.id === "company" && <CompanyInfoStep register={register} error={errors.companyName?.message} />}
          {step.id === "activity" && (
            <ProfileSelector
              activities={activities}
              register={register}
              selectedId={values.activityId}
              error={errors.activityId?.message}
            />
          )}
          {step.id === "revenue" && (
            <RevenueInput
              register={register}
              error={errors.revenue?.message}
              activity={selectedActivity}
              quote={quote}
              onFormat={(formatted) => setValue("revenue", formatted)}
            />
          )}
          {step.id === "options" && (
            <ProtectionJuridique
              register={register}
              settings={pricingConfig.legalProtection}
              error={errors.legalProtection?.message}
            />
          )}
          {step.id === "result" && (
            <QuoteResultView
              companyName={values.companyName}
              quote={quote}
              contactHref={contactHref}
              onEdit={() => goTo(0)}
              onEditRevenue={() => goTo(REVENUE_STEP)}
              onRestart={restart}
            />
          )}

          {step.id !== "result" && (
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              {stepIndex > 0 ? (
                <Button variant="ghost" onClick={() => goTo(stepIndex - 1)}>
                  <span aria-hidden="true">←</span> Précédent
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              <Button type="submit" variant={isLastInput ? "accent" : "primary"} size="lg" className="w-full sm:w-auto">
                {isLastInput ? "Voir mon estimation" : "Continuer"} <span aria-hidden="true">→</span>
              </Button>
            </div>
          )}
        </form>
      </Card>

      {withSidebar && (
        <aside className="hidden lg:sticky lg:top-6 lg:block" aria-label="Récapitulatif">
          <LiveEstimate
            companyName={values.companyName ?? ""}
            activityName={selectedActivity?.name}
            revenue={revenue}
            legalProtection={values.legalProtection}
            legalProtectionAvailable={pricingConfig.legalProtection.enabled}
            quote={quote}
          />
        </aside>
      )}
    </div>
  );
}
