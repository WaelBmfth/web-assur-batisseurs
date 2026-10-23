"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ArrowBadge, Icon } from "@/components/ui/Icon";
import { calculateQuote, getSelectableActivities } from "@/lib/calculator";
import { cn } from "@/lib/cn";
import { parseAmount } from "@/lib/format";
import { buildStudyRequestHref, STUDY_REQUEST_PATH } from "@/lib/questionnaires/simulatorSnapshot";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";
import { emptySimulatorForm, simulatorFormSchema, type SimulatorFormValues } from "@/lib/simulator/formSchema";
import { inputStepCount, simulatorSteps } from "@/lib/simulator/steps";
import type { PricingConfig } from "@/types/pricing";
import type { QuoteResult } from "@/types/simulator";
import { CompanyInfoStep } from "./CompanyInfoStep";
import { ProfileSelector } from "./ProfileSelector";
import { ProgressBar } from "./ProgressBar";
import { ProtectionJuridique } from "./ProtectionJuridique";
import { QuoteResultView } from "./QuoteResultView";
import { RevenueInput } from "./RevenueInput";

export type QuoteSubmission = {
  values: SimulatorFormValues;
  quote: QuoteResult;
};

export type QuoteSimulatorProps = {
  /** Configuration tarifaire en vigueur (fournie par le site hôte). */
  pricingConfig: PricingConfig;
  /** Appelé quand l'utilisateur affiche son estimation (ex. : enregistrement d'un lead). */
  onQuote?: (submission: QuoteSubmission) => void;
  /** Lien du bouton « Demander une étude personnalisée » (par défaut : page questionnaire, simulation conservée). */
  studyRequestHref?: (simulation: SimulatorSnapshot) => string;
  /** Masque la barre de progression pleine largeur (intégration dans un bloc existant). */
  hideProgress?: boolean;
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
  studyRequestHref = buildStudyRequestHref,
  hideProgress = false,
}: QuoteSimulatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const headingRef = useRef<HTMLDivElement>(null);
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
    // Revalidation immédiate : l'erreur disparaît dès la correction (pas de décalage du bouton au clic).
    mode: "onChange",
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
    headingRef.current?.querySelector("h1")?.focus();
  }, [stepIndex]);

  function goTo(index: number) {
    hasNavigated.current = true;
    setStepIndex(Math.max(0, Math.min(index, RESULT_STEP)));
  }

  // Choix du simulateur transmis au questionnaire d'étude personnalisée.
  const studyHref = useMemo(
    () =>
      values.activityId && revenue > 0
        ? studyRequestHref({
            activityId: values.activityId,
            revenue,
            includeLegalProtection: values.legalProtection === "yes",
            companyName: values.companyName ?? "",
          })
        : STUDY_REQUEST_PATH,
    [values.activityId, revenue, values.legalProtection, values.companyName, studyRequestHref],
  );

  const step = simulatorSteps[stepIndex]!;
  const isResult = step.id === "result";
  const isLastInput = stepIndex === RESULT_STEP - 1;

  async function next() {
    if (!(await trigger(step.fields, { shouldFocus: true }))) return;
    goTo(stepIndex + 1);
  }

  function showResult(submitted: SimulatorFormValues) {
    const result = calculateQuote(
      {
        activityId: submitted.activityId,
        revenue: parseAmount(submitted.revenue),
        includeLegalProtection: submitted.legalProtection === "yes",
      },
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
    <div>
      {!hideProgress && <ProgressBar percent={(stepIndex / inputStepCount) * 100} label="Progression de la simulation" />}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (isLastInput) void handleSubmit(showResult)();
          else void next();
        }}
        className="mx-auto max-w-[64rem] px-4 py-14 sm:px-6 sm:py-20"
      >
        <div ref={headingRef}>
          <SectionHeading
            as="h1"
            eyebrow={isResult ? step.label : `Étape ${stepIndex + 1} · ${step.label}`}
            title={step.title}
            highlight={step.highlight}
          />
        </div>
        {step.description && <p className="mt-5 text-center text-[1.05rem] text-ink-muted">{step.description}</p>}

        <div className={cn("mx-auto", isResult ? "mt-12" : "mt-10 max-w-[36rem]")}>
          {step.id === "activity" && (
            <ProfileSelector activities={activities} register={register} selected={selectedActivity} error={errors.activityId?.message} />
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
            <ProtectionJuridique register={register} settings={pricingConfig.legalProtection} error={errors.legalProtection?.message} />
          )}
          {step.id === "company" && <CompanyInfoStep register={register} error={errors.companyName?.message} />}
          {isResult && (
            <QuoteResultView
              companyName={values.companyName}
              quote={quote}
              contactHref={studyHref}
              onEdit={() => goTo(0)}
              onEditRevenue={() => goTo(REVENUE_STEP)}
              onRestart={restart}
            />
          )}
        </div>

        {!isResult && (
          <div className="mx-auto max-w-[36rem]">
            <Button type="submit" size="lg" className="mt-6 w-full">
              {isLastInput ? "Voir mon estimation" : "Suivant"}
              <ArrowBadge />
            </Button>
            <div className="mt-4 flex items-center justify-between gap-4 text-xs text-ink-muted">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(stepIndex - 1)}
                  className="flex items-center gap-1.5 rounded font-semibold text-ink hover:text-gold-700"
                >
                  <Icon name="arrowLeft" className="size-3.5" /> Précédent
                </button>
              ) : (
                <span />
              )}
              <p>
                Étape {stepIndex + 1} sur {inputStepCount} · Sans engagement
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
