import { Badge } from "@/components/ui/Badge";
import { formatEuro, formatEuroRange } from "@/lib/format";
import type { AmountRange, QuoteSuccess } from "@/types/simulator";
import { cn } from "@/lib/cn";

function BigRange({ range, className, separatorClassName }: { range: AmountRange; className: string; separatorClassName: string }) {
  return (
    <p className={cn("tabular flex flex-wrap items-baseline gap-x-2 leading-tight font-bold tracking-tight", className)}>
      <span className="whitespace-nowrap">{formatEuro(range.min)}</span>
      {range.max !== range.min && (
        <span className="whitespace-nowrap">
          <span className={cn("mr-2 font-semibold", separatorClassName)}>à</span>
          {formatEuro(range.max)}
        </span>
      )}
    </p>
  );
}

/** Mise en avant du budget total : année 1 (création) et années suivantes (renouvellement). */
export function PriceSummary({ quote }: { quote: QuoteSuccess }) {
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <section
        aria-labelledby="total-year1"
        className="on-dark relative overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-[var(--shadow-raised)] sm:p-8 lg:col-span-3"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-gold-500/25 blur-3xl" />
        <p id="total-year1" className="relative text-xs font-semibold tracking-[0.18em] text-gold-400 uppercase">
          Budget total · 1ère année
        </p>
        <BigRange
          range={quote.year1.total}
          className="relative mt-3 text-[2rem] text-white sm:text-[2.6rem]"
          separatorClassName="text-xl text-gold-400 sm:text-2xl"
        />
        <p className="tabular relative mt-3 text-base text-white/80">
          soit <strong className="text-gold-400">{formatEuroRange(quote.year1.monthly.min, quote.year1.monthly.max)}</strong> / mois
        </p>
        <p className="relative mt-5 border-t border-white/10 pt-4 text-xs text-white/60">
          Montants TTC · prime d&apos;assurance
          {quote.legalProtection.included ? " + Protection Juridique" : ""} + frais de courtage
        </p>
      </section>

      <section
        aria-labelledby="total-following"
        className="flex flex-col rounded-2xl border border-line border-t-[3px] border-t-ink bg-surface p-7 lg:col-span-2"
      >
        <p id="total-following" className="text-xs font-semibold tracking-[0.18em] text-gold-700 uppercase">
          Années suivantes
        </p>
        <BigRange
          range={quote.followingYears.total}
          className="mt-3 text-[1.6rem] text-ink"
          separatorClassName="text-base text-ink-muted"
        />
        <p className="tabular mt-2 text-sm text-ink-muted">
          soit {formatEuroRange(quote.followingYears.monthly.min, quote.followingYears.monthly.max)} / mois
        </p>
        {quote.brokerageSavings > 0 && (
          <div className="mt-auto pt-5">
            <Badge tone="success">−{formatEuro(quote.brokerageSavings)} de frais de courtage dès la 2e année</Badge>
          </div>
        )}
      </section>
    </div>
  );
}
