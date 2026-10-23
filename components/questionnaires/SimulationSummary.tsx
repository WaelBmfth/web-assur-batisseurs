import { Badge } from "@/components/ui/Badge";
import { formatEuro, formatEuroRange } from "@/lib/format";
import type { QuoteResult } from "@/types/simulator";
import type { SimulatorSnapshot } from "@/lib/questionnaires/types";

/** Rappel de la simulation à l'origine de la demande (données conservées depuis le simulateur). */
export function SimulationSummary({
  simulation,
  activityName,
  quote,
}: {
  simulation: SimulatorSnapshot;
  activityName?: string;
  quote: QuoteResult | null;
}) {
  return (
    <aside aria-label="Votre simulation" className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">Votre simulation</p>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {simulation.companyName && <Badge tone="neutral">{simulation.companyName}</Badge>}
          {activityName && <Badge tone="gold">{activityName}</Badge>}
          <Badge tone="neutral">CA {formatEuro(simulation.revenue, { decimals: false })} HT</Badge>
          <Badge tone={simulation.includeLegalProtection ? "success" : "neutral"}>
            PJ : {simulation.includeLegalProtection ? "Oui" : "Non"}
          </Badge>
        </div>
      </div>
      {quote?.ok && (
        <p className="shrink-0 text-sm text-ink-muted sm:text-right">
          Estimation 1ère année
          <strong className="tabular block text-lg text-ink">{formatEuroRange(quote.year1.total.min, quote.year1.total.max)}</strong>
        </p>
      )}
    </aside>
  );
}
