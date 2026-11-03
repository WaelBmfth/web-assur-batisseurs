"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ArrowBadge, Icon } from "@/components/ui/Icon";
import { calculateQuote, findActivity, getLegalProtectionMode, getSelectableActivities } from "@/lib/calculator";
import { cn } from "@/lib/cn";
import { formatNumber, parseAmount } from "@/lib/format";
import {
  buildStudyRequestHref,
  CHOOSE_QUESTIONNAIRE,
  STUDY_REQUEST_PATH,
  type QuestionnaireRequest,
} from "@/lib/questionnaires/simulatorSnapshot";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";
import { emptySimulatorForm, simulatorFormSchema, type SimulatorFormValues } from "@/lib/simulator/formSchema";
import { buildResumeSearch, parseResumeState } from "@/lib/simulator/resumeState";
import { getSimulatorSteps, type SimulatorStep } from "@/lib/simulator/steps";
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
  /**
   * Lien vers la demande d'étude (par défaut : page questionnaire, simulation conservée).
   * `questionnaire` vaut « choisir » quand le CA dépasse la grille : affichage du choix des 3 questionnaires.
   */
  studyRequestHref?: (simulation: SimulatorSnapshot, questionnaire?: QuestionnaireRequest) => string;
  /** Masque la barre de progression pleine largeur (intégration dans un bloc existant). */
  hideProgress?: boolean;
};


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
  // Retour navigateur après la redirection « CA au-delà de la grille » : l'URL décrit la simulation,
  // qui reprend à l'étape 2 avec ses réponses (lu au premier rendu, identique côté serveur et client).
  const searchParams = useSearchParams();
  const [resume] = useState(() => {
    const state = parseResumeState(searchParams.toString());
    return state && findActivity(pricingConfig, state.activityId)?.active ? state : null;
  });
  const [stepId, setStepId] = useState<SimulatorStep["id"]>(resume ? "revenue" : "activity");
  // Le visiteur a validé l'étape PJ (sinon son choix n'est pas transmis : il n'a pas été posé).
  const [legalProtectionAnswered, setLegalProtectionAnswered] = useState(
    () =>
      resume !== null &&
      resume.includeLegalProtection !== null &&
      getLegalProtectionMode(pricingConfig, resume.activityId) === "optional",
  );
  const router = useRouter();
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
    defaultValues: resume
      ? {
          ...emptySimulatorForm,
          activityId: resume.activityId,
          revenue: formatNumber(resume.revenue),
          legalProtection: resume.includeLegalProtection === false ? "no" : "yes",
          companyName: resume.companyName,
        }
      : emptySimulatorForm,
    // Revalidation immédiate : l'erreur disparaît dès la correction (pas de décalage du bouton au clic).
    mode: "onChange",
  });
  const values = useWatch({ control }) as SimulatorFormValues;

  const activities = useMemo(() => getSelectableActivities(pricingConfig), [pricingConfig]);
  const selectedActivity = activities.find((a) => a.id === values.activityId);
  // Étape PJ affichée seulement si la PJ est optionnelle pour l'activité (avant tout choix : affichée).
  const legalProtectionMode = selectedActivity ? getLegalProtectionMode(pricingConfig, selectedActivity.id) : "optional";
  const steps = useMemo(() => getSimulatorSteps(legalProtectionMode === "optional"), [legalProtectionMode]);
  const stepIndex = Math.max(0, steps.findIndex((s) => s.id === stepId));
  const resultIndex = steps.length - 1;
  const inputStepCount = steps.length - 1;
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
    setStepId(steps[Math.max(0, Math.min(index, resultIndex))]!.id);
  }

  // Choix du simulateur transmis au questionnaire d'étude personnalisée.
  const studyHref = useMemo(
    () =>
      values.activityId && revenue > 0
        ? studyRequestHref({
            activityId: values.activityId,
            revenue,
            // PJ effectivement retenue (choix du client, ou incluse d'office selon l'activité).
            includeLegalProtection: quote?.ok ? quote.legalProtection.included : values.legalProtection === "yes",
            companyName: values.companyName ?? "",
          })
        : STUDY_REQUEST_PATH,
    [values.activityId, revenue, values.legalProtection, values.companyName, studyRequestHref, quote],
  );

  const step = steps[stepIndex]!;
  const isResult = step.id === "result";
  const isLastInput = stepIndex === resultIndex - 1;

  async function next() {
    if (!(await trigger(step.fields, { shouldFocus: true }))) return;
    // CA au-delà du plafond de la grille pour cette activité (250 000 € pour la plupart) :
    // pas d'estimation possible, accès direct au choix des 3 questionnaires.
    if (step.id === "revenue" && quote && !quote.ok && quote.code === "REVENUE_ABOVE_RANGE") {
      const simulation: SimulatorSnapshot = {
        activityId: values.activityId,
        revenue,
        includeLegalProtection:
          legalProtectionMode === "included" ? true : legalProtectionAnswered ? values.legalProtection === "yes" : null,
        companyName: values.companyName ?? "",
      };
      // L'entrée d'historique courante garde les réponses : le bouton Retour rouvre l'étape 2 complétée.
      const { pathname, hash } = window.location;
      window.history.replaceState(window.history.state, "", `${pathname}${buildResumeSearch(simulation)}${hash}`);
      router.push(studyRequestHref(simulation, CHOOSE_QUESTIONNAIRE));
      return;
    }
    if (step.id === "options") setLegalProtectionAnswered(true);
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
    goTo(resultIndex);
  }

  function restart() {
    reset(emptySimulatorForm);
    setLegalProtectionAnswered(false);
    // Nouvelle simulation : l'URL ne décrit plus la simulation précédente.
    if (parseResumeState(window.location.search)) {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
    }
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
              onEditRevenue={() => goTo(steps.findIndex((s) => s.id === "revenue"))}
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
