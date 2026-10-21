"use client";

import { Button } from "@/components/ui/Button";
import { addBracket, removeBracket, updateBracket } from "@/lib/pricing/configOperations";
import { sortBrackets } from "@/lib/calculator";
import type { Activity, PricingConfig } from "@/types/pricing";
import { AmountInput } from "./AmountInput";

type Props = {
  activity: Activity;
  draft: PricingConfig;
  onChange: (config: PricingConfig) => void;
};

/** Édition des tranches de CA d'une activité et de leur fourchette de prime. */
export function BracketEditor({ activity, draft, onChange }: Props) {
  const brackets = sortBrackets(activity.brackets);
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-sm font-bold text-ink">Tranches tarifaires</h4>
      <ul className="flex flex-col gap-3">
        {brackets.map((bracket, index) => {
          const prefix = `${activity.id}-${bracket.id}`;
          const set = (patch: Parameters<typeof updateBracket>[3]) =>
            onChange(updateBracket(draft, activity.id, bracket.id, patch));
          return (
            <li key={bracket.id} className="rounded-xl border border-line bg-canvas p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold tracking-wide text-ink-subtle uppercase">Tranche {index + 1}</p>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={brackets.length === 1}
                  title={brackets.length === 1 ? "Une activité doit conserver au moins une tranche" : undefined}
                  onClick={() => onChange(removeBracket(draft, activity.id, bracket.id))}
                >
                  Supprimer<span className="sr-only"> la tranche {index + 1}</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <AmountInput id={`${prefix}-rmin`} label="CA minimum (HT)" value={bracket.revenueMin} onChange={(v) => v !== null && set({ revenueMin: v })} />
                <AmountInput
                  id={`${prefix}-rmax`}
                  label="CA maximum (HT)"
                  value={bracket.revenueMax}
                  nullable
                  placeholder="Sans plafond"
                  onChange={(v) => set({ revenueMax: v })}
                />
                <AmountInput id={`${prefix}-pmin`} label="Minimum de prime (TTC)" value={bracket.premiumMin} onChange={(v) => v !== null && set({ premiumMin: v })} />
                <AmountInput
                  id={`${prefix}-pmax`}
                  label="Borne haute (TTC)"
                  value={bracket.premiumMax}
                  nullable
                  placeholder="= minimum"
                  onChange={(v) => set({ premiumMax: v })}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div>
        <Button variant="secondary" size="sm" onClick={() => onChange(addBracket(draft, activity.id))}>
          + Ajouter une tranche
        </Button>
      </div>
    </div>
  );
}
