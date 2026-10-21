"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { inputClasses } from "@/components/ui/TextInput";
import { formatEuro, formatRevenueRange } from "@/lib/format";
import { sortBrackets } from "@/lib/calculator";
import { updatePremiumMin } from "@/lib/pricing/configOperations";
import type { PricingConfig } from "@/types/pricing";
import { AmountInput } from "./AmountInput";

type Props = {
  draft: PricingConfig;
  saved: PricingConfig;
  onChange: (config: PricingConfig) => void;
};

/**
 * Gestion des minimums de prime — la variable tarifaire que la cliente
 * a identifiée comme évolutive. Une ligne par activité et par tranche de CA.
 */
export function MinimumPremiumManager({ draft, saved, onChange }: Props) {
  const [query, setQuery] = useState("");
  const savedMinimums = useMemo(() => {
    const map = new Map<string, number>();
    saved.activities.forEach((a) => a.brackets.forEach((b) => map.set(`${a.id}/${b.id}`, b.premiumMin)));
    return map;
  }, [saved]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...draft.activities]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((a) => !q || `${a.name} ${a.category}`.toLowerCase().includes(q))
      .flatMap((activity) => sortBrackets(activity.brackets).map((bracket) => ({ activity, bracket })));
  }, [draft, query]);

  const changedCount = rows.filter(
    ({ activity, bracket }) => savedMinimums.get(`${activity.id}/${bracket.id}`) !== bracket.premiumMin,
  ).length;

  return (
    <section aria-labelledby="minimums-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="minimums-title" className="text-xl font-bold text-ink">
            Gestion des minimums de prime
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Le minimum de prime est le bas de la fourchette d&apos;assurance TTC affichée au client, pour une activité et
            une tranche de CA. Modifiez les montants puis enregistrez : le simulateur utilise immédiatement les nouvelles
            valeurs.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="minimums-search" className="sr-only">
            Filtrer les activités
          </label>
          <input
            id="minimums-search"
            type="search"
            placeholder="Filtrer les activités…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClasses} py-2.5 text-sm`}
          />
        </div>
      </div>

      {changedCount > 0 && (
        <p role="status" className="text-sm font-medium text-warning-800">
          {changedCount} minimum{changedCount > 1 ? "s" : ""} modifié{changedCount > 1 ? "s" : ""}, non enregistré
          {changedCount > 1 ? "s" : ""}.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_9rem_9rem] gap-4 border-b border-line bg-canvas px-5 py-3 text-xs font-semibold tracking-wide text-ink-subtle uppercase md:grid"
        >
          <span>Activité</span>
          <span>Tranche de CA (HT)</span>
          <span className="text-right">Minimum de prime</span>
          <span className="text-right">Borne haute</span>
        </div>
        <ul className="divide-y divide-line">
          {rows.map(({ activity, bracket }) => {
            const savedValue = savedMinimums.get(`${activity.id}/${bracket.id}`);
            const changed = savedValue !== bracket.premiumMin;
            const aboveMax = bracket.premiumMax !== null && bracket.premiumMin > bracket.premiumMax;
            return (
              <li
                key={`${activity.id}/${bracket.id}`}
                className="grid grid-cols-2 items-center gap-x-4 gap-y-2 px-5 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_9rem_9rem]"
              >
                <div className="col-span-2 min-w-0 md:col-span-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {activity.name}
                    {!activity.active && <Badge tone="neutral">Inactive</Badge>}
                    {changed && <Badge tone="accent">Modifié</Badge>}
                  </p>
                  <p className="truncate text-xs text-ink-muted">{activity.category}</p>
                </div>
                <p className="col-span-2 text-sm text-ink md:col-span-1">
                  <span className="text-ink-muted md:hidden">CA : </span>
                  {formatRevenueRange(bracket.revenueMin, bracket.revenueMax)}
                </p>
                <div>
                  <AmountInput
                    id={`min-${activity.id}-${bracket.id}`}
                    label={`Minimum de prime — ${activity.name}, ${formatRevenueRange(bracket.revenueMin, bracket.revenueMax)}`}
                    hideLabel
                    value={bracket.premiumMin}
                    changed={changed}
                    onChange={(value) =>
                      value !== null && onChange(updatePremiumMin(draft, activity.id, bracket.id, value))
                    }
                  />
                  {changed && savedValue !== undefined && (
                    <p className="mt-1 text-right text-xs text-ink-muted">Avant : {formatEuro(savedValue)}</p>
                  )}
                  {aboveMax && (
                    <p className="mt-1 text-right text-xs text-danger-700">Supérieur à la borne haute</p>
                  )}
                </div>
                <p className="tabular text-right text-sm text-ink-muted">
                  <span className="md:hidden">Haut : </span>
                  {bracket.premiumMax === null ? "—" : formatEuro(bracket.premiumMax)}
                </p>
              </li>
            );
          })}
          {rows.length === 0 && <li className="px-5 py-8 text-center text-sm text-ink-muted">Aucune activité trouvée.</li>}
        </ul>
      </div>
    </section>
  );
}
