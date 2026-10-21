import { Card } from "@/components/ui/Card";
import { formatEuro, formatEuroRange } from "@/lib/format";
import type { QuoteResult } from "@/types/simulator";

type Props = {
  companyName: string;
  activityName?: string;
  revenue: number;
  legalProtection: "yes" | "no";
  legalProtectionAvailable: boolean;
  quote: QuoteResult | null;
};

function Line({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value || <span className="font-normal text-ink-subtle">—</span>}</dd>
    </div>
  );
}

/** Récapitulatif latéral, mis à jour en temps réel pendant la saisie. */
export function LiveEstimate({ companyName, activityName, revenue, legalProtection, legalProtectionAvailable, quote }: Props) {
  return (
    <Card className="p-6">
      <h2 className="text-base font-bold text-ink">Votre estimation</h2>
      <dl className="mt-3 divide-y divide-line">
        <Line label="Entreprise" value={companyName.trim()} />
        <Line label="Activité" value={activityName} />
        <Line label="CA prévisionnel" value={revenue > 0 ? `${formatEuro(revenue, { decimals: false })} HT` : undefined} />
        {legalProtectionAvailable && (
          <Line label="Protection Juridique" value={legalProtection === "yes" ? "Oui" : "Non"} />
        )}
      </dl>
      <div className="mt-4 rounded-2xl bg-brand-50 p-4" aria-live="polite">
        {quote?.ok ? (
          <>
            <p className="text-xs font-semibold text-brand-700">Budget 1ère année</p>
            <p className="tabular mt-1 text-lg font-extrabold text-brand-800">
              {formatEuroRange(quote.year1.total.min, quote.year1.total.max)}
            </p>
            <p className="tabular mt-1 text-xs text-ink-muted">
              {formatEuroRange(quote.year1.monthly.min, quote.year1.monthly.max)} / mois
            </p>
          </>
        ) : quote ? (
          <p className="text-sm text-warning-800">Étude personnalisée nécessaire pour ce profil.</p>
        ) : (
          <p className="text-sm text-ink-muted">Renseignez votre activité et votre chiffre d&apos;affaires pour voir votre fourchette.</p>
        )}
      </div>
      <ul className="mt-5 flex flex-col gap-2 text-xs text-ink-muted">
        {["Sans engagement", "Résultat immédiat", "Tarifs TTC"].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-success-700">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}
