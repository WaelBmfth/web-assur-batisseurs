"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { inputClasses } from "@/components/ui/TextInput";
import { formatEuroRange, formatRevenueRange } from "@/lib/format";
import { sortBrackets } from "@/lib/calculator";
import { addActivity, moveActivity, removeActivity, updateActivity } from "@/lib/pricing/configOperations";
import type { PricingConfig } from "@/types/pricing";
import { BracketEditor } from "./BracketEditor";

type Props = {
  draft: PricingConfig;
  onChange: (config: PricingConfig) => void;
};

const smallInput = `${inputClasses} py-2 text-sm`;

export function ActivityManager({ draft, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const activities = [...draft.activities].sort((a, b) => a.sortOrder - b.sortOrder);
  const categories = [...new Set(draft.activities.map((a) => a.category).filter(Boolean))].sort();

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;
    const next = addActivity(draft, { name: newName, category: newCategory });
    onChange(next);
    setOpenId(next.activities.at(-1)?.id ?? null);
    setNewName("");
    setNewCategory("");
  }

  return (
    <section aria-labelledby="activities-title" className="flex flex-col gap-5">
      <div>
        <h2 id="activities-title" className="text-xl font-bold text-ink">
          Activités & tranches de CA
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Ajoutez, renommez, ordonnez ou désactivez les activités proposées dans le simulateur, et gérez leurs tranches de
          chiffre d&apos;affaires. Une activité inactive n&apos;est plus proposée aux visiteurs mais reste conservée.
        </p>
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="new-activity-name" className="text-xs font-semibold text-ink-muted">
            Nouvelle activité
          </label>
          <input id="new-activity-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex. : Carreleur seul" className={smallInput} required />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="new-activity-category" className="text-xs font-semibold text-ink-muted">
            Catégorie
          </label>
          <input
            id="new-activity-category"
            list="activity-categories"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Ex. : Second Œuvre / Sols"
            className={smallInput}
          />
          <datalist id="activity-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <Button type="submit" disabled={!newName.trim()}>
          Ajouter
        </Button>
      </form>

      <ul className="flex flex-col gap-3">
        {activities.map((activity, index) => {
          const open = openId === activity.id;
          const panelId = `activity-panel-${activity.id}`;
          const brackets = sortBrackets(activity.brackets);
          return (
            <li key={activity.id} className="rounded-2xl border border-line bg-surface">
              <div className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button
                    type="button"
                    className="rounded px-1 text-ink-muted hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => onChange(moveActivity(draft, activity.id, "up"))}
                    aria-label={`Monter « ${activity.name} »`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="rounded px-1 text-ink-muted hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30"
                    disabled={index === activities.length - 1}
                    onClick={() => onChange(moveActivity(draft, activity.id, "down"))}
                    aria-label={`Descendre « ${activity.name} »`}
                  >
                    ▼
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    <span className="tabular text-xs text-ink-subtle">#{index + 1}</span>
                    {activity.name || <em className="text-danger-700">Sans nom</em>}
                    {!activity.active && <Badge tone="neutral">Inactive</Badge>}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {activity.category || "Sans catégorie"} · {brackets.length} tranche{brackets.length > 1 ? "s" : ""}
                    {brackets[0] &&
                      ` · ${formatRevenueRange(brackets[0].revenueMin, brackets[0].revenueMax)} : ${formatEuroRange(
                        brackets[0].premiumMin,
                        brackets[0].premiumMax ?? brackets[0].premiumMin,
                        { decimals: false },
                      )}`}
                  </p>
                </div>
                <Switch
                  checked={activity.active}
                  onChange={(active) => onChange(updateActivity(draft, activity.id, { active }))}
                  label={activity.active ? "Active" : "Inactive"}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : activity.id)}
                >
                  {open ? "Fermer" : "Modifier"}
                  <span className="sr-only"> « {activity.name} »</span>
                </Button>
              </div>

              {open && (
                <div id={panelId} className="flex flex-col gap-5 border-t border-line p-4 sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`${panelId}-name`} className="text-xs font-semibold text-ink-muted">
                        Nom affiché
                      </label>
                      <input
                        id={`${panelId}-name`}
                        value={activity.name}
                        onChange={(e) => onChange(updateActivity(draft, activity.id, { name: e.target.value }))}
                        className={smallInput}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`${panelId}-category`} className="text-xs font-semibold text-ink-muted">
                        Catégorie
                      </label>
                      <input
                        id={`${panelId}-category`}
                        list="activity-categories"
                        value={activity.category}
                        onChange={(e) => onChange(updateActivity(draft, activity.id, { category: e.target.value }))}
                        className={smallInput}
                      />
                    </div>
                  </div>
                  <BracketEditor activity={activity} draft={draft} onChange={onChange} />
                  <div className="flex justify-end border-t border-line pt-4">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Supprimer définitivement l'activité « ${activity.name} » ?`)) {
                          onChange(removeActivity(draft, activity.id));
                          setOpenId(null);
                        }
                      }}
                    >
                      Supprimer l&apos;activité
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
