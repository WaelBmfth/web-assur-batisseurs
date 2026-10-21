"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { inputClasses } from "@/components/ui/TextInput";
import { calculateQuote, getSelectableActivities } from "@/lib/calculator";
import { formatEuroRange, parseAmount } from "@/lib/format";
import type { PricingConfig } from "@/types/pricing";

/** Calcul de contrôle sur la configuration en cours d'édition (avant enregistrement). */
export function QuotePreview({ draft }: { draft: PricingConfig }) {
  const activities = getSelectableActivities(draft);
  const [activityId, setActivityId] = useState(activities[0]?.id ?? "");
  const [revenue, setRevenue] = useState("150 000");
  const [withLp, setWithLp] = useState(true);
  const quote = calculateQuote(
    { activityId, revenue: parseAmount(revenue), includeLegalProtection: withLp },
    draft,
  );

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="font-bold text-ink">Tester la grille</h2>
        <p className="text-xs text-ink-muted">Calcul sur les valeurs en cours d&apos;édition.</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="preview-activity" className="text-xs font-semibold text-ink-muted">
          Activité
        </label>
        <select id="preview-activity" value={activityId} onChange={(e) => setActivityId(e.target.value)} className={`${inputClasses} py-2 text-sm`}>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="preview-revenue" className="text-xs font-semibold text-ink-muted">
          CA prévisionnel (€ HT)
        </label>
        <input id="preview-revenue" inputMode="decimal" value={revenue} onChange={(e) => setRevenue(e.target.value)} className={`${inputClasses} py-2 text-sm`} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={withLp} onChange={(e) => setWithLp(e.target.checked)} className="size-4 accent-gold-700" />
        Inclure la Protection Juridique
      </label>
      <div className="tabular rounded-xl bg-gold-50 p-4 text-sm" aria-live="polite">
        {quote.ok ? (
          <dl className="flex flex-col gap-1.5">
            <div className="flex justify-between gap-2">
              <dt className="whitespace-nowrap text-ink-muted">Prime</dt>
              <dd className="text-right font-semibold">{formatEuroRange(quote.insurance.min, quote.insurance.max)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="whitespace-nowrap text-ink-muted">Total an 1</dt>
              <dd className="text-right font-bold text-gold-800">{formatEuroRange(quote.year1.total.min, quote.year1.total.max)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="whitespace-nowrap text-ink-muted">Total an 2+</dt>
              <dd className="text-right font-semibold">{formatEuroRange(quote.followingYears.total.min, quote.followingYears.total.max)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-warning-800">{quote.message}</p>
        )}
      </div>
    </Card>
  );
}
