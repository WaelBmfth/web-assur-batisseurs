import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { questionnaireConfig } from "@/lib/questionnaires/questionnaireConfig";
import { questionnaireHref } from "@/lib/questionnaires/simulatorSnapshot";
import { questionnaireTypes, type QuestionnaireType, type SimulatorSnapshot } from "@/lib/questionnaires/types";
import { QuestionnaireArtisans } from "./QuestionnaireArtisans";
import { QuestionnaireDO } from "./QuestionnaireDO";
import { QuestionnaireRCDPIB } from "./QuestionnaireRCDPIB";

type Props = {
  questionnaireType: QuestionnaireType | null;
  simulatorData: SimulatorSnapshot | null;
};

/** Affiche le questionnaire correspondant au type ; sans type déterminé, propose le choix. */
export function QuestionnaireRenderer({ questionnaireType, simulatorData }: Props) {
  switch (questionnaireType) {
    case "artisans":
      return <QuestionnaireArtisans simulation={simulatorData} />;
    case "do":
      return <QuestionnaireDO simulation={simulatorData} />;
    case "rcd-pib":
      return <QuestionnaireRCDPIB simulation={simulatorData} />;
    default:
      return <QuestionnaireChooser simulatorData={simulatorData} />;
  }
}

/** État par défaut : le visiteur choisit le questionnaire qui correspond à sa situation. */
function QuestionnaireChooser({ simulatorData }: { simulatorData: SimulatorSnapshot | null }) {
  return (
    <section aria-labelledby="chooser-title" className="flex flex-col gap-5">
      <h2 id="chooser-title" className="text-center text-xl font-bold text-ink">
        Quelle situation vous correspond ?
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {questionnaireTypes.map((type) => {
          const config = questionnaireConfig[type];
          return (
            <li key={type}>
              <Link
                href={questionnaireHref(type, simulatorData)}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface p-6 transition-colors hover:border-gold-400 hover:bg-gold-50"
              >
                <span className="text-lg leading-snug font-bold text-ink">{config.shortLabel}</span>
                <span className="text-sm text-ink-muted">{config.description}</span>
                <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-semibold text-gold-700 group-hover:text-ink">
                  Remplir ce questionnaire <Icon name="arrowRight" className="size-4" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
