import type { ReactNode } from "react";
import { formatEuro, formatRevenueRange } from "@/lib/format";
import type { AmountRange, QuoteSuccess } from "@/types/simulator";
import { cn } from "@/lib/cn";

function RangeCell({ range }: { range: AmountRange }) {
  if (range.min === range.max) return <>{formatEuro(range.min)}</>;
  return (
    <>
      <span className="block">{formatEuro(range.min)}</span>
      <span className="block text-ink-muted">
        <span className="sr-only">à </span>
        <span aria-hidden="true">à </span>
        {formatEuro(range.max)}
      </span>
    </>
  );
}

type Row = { label: string; detail?: string; year1: ReactNode; following: ReactNode; strong?: boolean };

/** Détail du calcul — reprend la section « 3. Décompte détaillé » de l'Excel. */
export function PriceBreakdown({ quote }: { quote: QuoteSuccess }) {
  const lp = quote.legalProtection;
  const rows: Row[] = [
    {
      label: "Prime d'assurance",
      detail: `Fourchette TTC · tranche ${formatRevenueRange(quote.bracket.revenueMin, quote.bracket.revenueMax)}`,
      year1: <RangeCell range={quote.insurance} />,
      following: <RangeCell range={quote.insurance} />,
    },
    {
      label: "Protection Juridique",
      detail: lp.included ? "Option incluse" : "Non incluse",
      year1: formatEuro(lp.amount),
      following: formatEuro(lp.amount),
    },
    {
      label: "Frais de courtage",
      detail: "Gestion de dossier, selon l'année",
      year1: formatEuro(quote.year1.brokerage),
      following: formatEuro(quote.followingYears.brokerage),
    },
    {
      label: "Total annuel",
      detail: "Prime + PJ + courtage",
      year1: <RangeCell range={quote.year1.total} />,
      following: <RangeCell range={quote.followingYears.total} />,
      strong: true,
    },
    {
      label: "Mensualité indicative",
      detail: `Total ÷ ${quote.installmentsPerYear}`,
      year1: <RangeCell range={quote.year1.monthly} />,
      following: <RangeCell range={quote.followingYears.monthly} />,
    },
  ];

  return (
    <section aria-labelledby="breakdown-title" className="rounded-[var(--radius-card)] border border-line bg-surface">
      <h3 id="breakdown-title" className="border-b border-line px-5 py-4 text-base font-bold text-ink sm:px-6">
        Détail du calcul
      </h3>
      <table className="tabular w-full table-fixed text-sm">
        <caption className="sr-only">
          Détail de l&apos;estimation pour la 1ère année et les années suivantes, montants TTC
        </caption>
        <thead>
          <tr className="text-left text-xs font-semibold tracking-wide text-ink-subtle uppercase">
            <th scope="col" className="w-[38%] py-3 pr-2 pl-4 sm:px-6">
              Poste
            </th>
            <th scope="col" className="px-2 py-3 text-right">
              1ère année
            </th>
            <th scope="col" className="py-3 pr-4 pl-2 text-right sm:pr-6">
              <span className="sm:hidden">Suivantes</span>
              <span className="hidden sm:inline">Années suivantes</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={cn("border-t border-line align-top", row.strong && "bg-brand-50")}>
              <th scope="row" className="py-3.5 pr-2 pl-4 text-left font-normal sm:px-6">
                <span className={cn("block text-ink", row.strong ? "font-bold" : "font-semibold")}>{row.label}</span>
                {row.detail && <span className="mt-0.5 block text-xs break-words text-ink-muted">{row.detail}</span>}
              </th>
              <td className={cn("px-2 py-3.5 text-right", row.strong ? "font-bold text-brand-800" : "text-ink")}>
                {row.year1}
              </td>
              <td className={cn("py-3.5 pr-4 pl-2 text-right sm:pr-6", row.strong ? "font-bold text-brand-800" : "text-ink")}>
                {row.following}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
