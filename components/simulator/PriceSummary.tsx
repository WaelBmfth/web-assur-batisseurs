import { Badge } from "@/components/ui/Badge";
import { formatEuro, formatEuroRange } from "@/lib/format";
import type { QuoteSuccess } from "@/types/simulator";

/** Mise en avant du budget total : année 1 (création) et années suivantes (renouvellement). */
export function PriceSummary({ quote }: { quote: QuoteSuccess }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section
        aria-labelledby="total-year1"
        className="relative overflow-hidden rounded-[var(--radius-card)] bg-brand-800 p-6 text-white shadow-[var(--shadow-raised)] sm:p-7 lg:col-span-3"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-brand-600/40 blur-2xl"
        />
        <p id="total-year1" className="relative text-sm font-semibold text-brand-200">
          Budget total · 1ère année
        </p>
        <p className="tabular relative mt-2 flex flex-wrap items-baseline gap-x-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          <span className="whitespace-nowrap">{formatEuro(quote.year1.total.min)}</span>
          <span className="whitespace-nowrap">
            <span className="mr-2 text-xl font-semibold text-brand-200 sm:text-2xl">à</span>
            {formatEuro(quote.year1.total.max)}
          </span>
        </p>
        <p className="tabular relative mt-3 text-base text-brand-100">
          soit <strong className="text-white">{formatEuroRange(quote.year1.monthly.min, quote.year1.monthly.max)}</strong> / mois
        </p>
        <p className="relative mt-4 text-xs text-brand-200">
          Montants TTC · prime d&apos;assurance
          {quote.legalProtection.included ? " + Protection Juridique" : ""} + frais de courtage
        </p>
      </section>

      <section
        aria-labelledby="total-following"
        className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] lg:col-span-2"
      >
        <p id="total-following" className="text-sm font-semibold text-ink-muted">
          Budget total · années suivantes
        </p>
        <p className="tabular mt-2 flex flex-wrap items-baseline gap-x-1.5 text-2xl leading-tight font-bold text-brand-800">
          <span className="whitespace-nowrap">{formatEuro(quote.followingYears.total.min)}</span>
          <span className="whitespace-nowrap">
            <span className="mr-1.5 text-base font-semibold text-ink-muted">à</span>
            {formatEuro(quote.followingYears.total.max)}
          </span>
        </p>
        <p className="tabular mt-2 text-sm text-ink-muted">
          soit {formatEuroRange(quote.followingYears.monthly.min, quote.followingYears.monthly.max)} / mois
        </p>
        {quote.brokerageSavings > 0 && (
          <div className="mt-auto pt-4">
            <Badge tone="success">−{formatEuro(quote.brokerageSavings)} de frais de courtage dès la 2e année</Badge>
          </div>
        )}
      </section>
    </div>
  );
}
