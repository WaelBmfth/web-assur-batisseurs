import type { Metadata } from "next";
import Link from "next/link";
import { QuestionnaireRenderer } from "@/components/questionnaires/QuestionnaireRenderer";
import { SimulationSummary } from "@/components/questionnaires/SimulationSummary";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Icon } from "@/components/ui/Icon";
import { calculateQuote, findActivity } from "@/lib/calculator";
import { loadPricingConfig } from "@/lib/pricing/cachedPricing.server";
import { getQuestionnaireType, questionnaireConfig } from "@/lib/questionnaires/questionnaireConfig";
import {
  CHOOSE_QUESTIONNAIRE,
  parseRequestedQuestionnaire,
  parseSimulatorSnapshot,
  questionnaireHref,
} from "@/lib/questionnaires/simulatorSnapshot";

export const metadata: Metadata = {
  title: "Demande d'étude personnalisée | AssurBâtisseurs",
  description: "Questionnaire de pré-tarification pour obtenir une étude personnalisée de votre assurance construction.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StudyRequestPage({ searchParams }: Props) {
  const params = await searchParams;
  const simulation = parseSimulatorSnapshot(params);
  // Choix explicite du visiteur, sinon règle métier centralisée (getQuestionnaireType).
  const requested = parseRequestedQuestionnaire(params);
  const questionnaireType = requested === CHOOSE_QUESTIONNAIRE ? null : (requested ?? getQuestionnaireType(simulation));

  const pricingConfig = simulation ? await loadPricingConfig() : null;
  const activity = simulation && pricingConfig ? findActivity(pricingConfig, simulation.activityId) : undefined;
  const quote =
    simulation && pricingConfig
      ? calculateQuote(
          { activityId: simulation.activityId, revenue: simulation.revenue, includeLegalProtection: simulation.includeLegalProtection },
          pricingConfig,
        )
      : null;

  const config = questionnaireType ? questionnaireConfig[questionnaireType] : null;
  // Pour changer de questionnaire, retour au choix en conservant la simulation.
  const chooserHref = questionnaireHref(CHOOSE_QUESTIONNAIRE, simulation);

  return (
    <>
      <SiteHeader />
      <main className="bg-canvas">
        <div className="mx-auto flex max-w-[64rem] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeading
            as="h1"
            eyebrow="Demande d'étude personnalisée"
            title={config?.heading.title ?? "Votre questionnaire"}
            highlight={config?.heading.highlight ?? "de pré-tarification"}
          />
          <p className="mx-auto max-w-2xl text-center text-[1.05rem] text-ink-muted">
            {config
              ? "Complétez ce questionnaire pour que nos équipes établissent une proposition adaptée à votre activité."
              : "Choisissez le questionnaire qui correspond à votre situation : il permettra à nos équipes d'établir une proposition adaptée."}
          </p>

          {simulation && <SimulationSummary simulation={simulation} activityName={activity?.name} quote={quote} />}

          {config && (
            <p className="text-center text-sm text-ink-muted">
              Ce n&apos;est pas le bon questionnaire ?{" "}
              <Link href={chooserHref} className="font-semibold text-gold-700 underline-offset-2 hover:underline">
                Choisir un autre questionnaire
              </Link>
            </p>
          )}

          <QuestionnaireRenderer questionnaireType={questionnaireType} simulatorData={simulation} />

          <Link href="/" className="mx-auto flex items-center gap-1.5 rounded text-sm font-semibold text-ink-muted hover:text-ink">
            <Icon name="arrowLeft" className="size-4" /> Retour au simulateur
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
