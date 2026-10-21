"use client";

import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { updateFees } from "@/lib/pricing/configOperations";
import type { PricingConfig } from "@/types/pricing";
import { AmountInput } from "./AmountInput";

type Props = {
  draft: PricingConfig;
  saved: PricingConfig;
  onChange: (config: PricingConfig) => void;
};

export function FeeSettings({ draft, saved, onChange }: Props) {
  return (
    <section aria-labelledby="fees-title" className="flex flex-col gap-5">
      <div>
        <h2 id="fees-title" className="text-xl font-bold text-ink">
          Frais & options
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Ces montants s&apos;appliquent à toutes les activités. Ils sont ajoutés à la prime d&apos;assurance pour obtenir le
          budget annuel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4 p-5">
          <h3 className="font-bold text-ink">Frais de courtage / gestion de dossier</h3>
          <AmountInput
            id="fee-year1"
            label="1ère année"
            value={draft.brokerageFees.year1}
            changed={draft.brokerageFees.year1 !== saved.brokerageFees.year1}
            onChange={(v) => v !== null && onChange(updateFees(draft, { brokerageFees: { year1: v } }))}
          />
          <AmountInput
            id="fee-following"
            label="2ème année et suivantes"
            value={draft.brokerageFees.followingYears}
            changed={draft.brokerageFees.followingYears !== saved.brokerageFees.followingYears}
            onChange={(v) => v !== null && onChange(updateFees(draft, { brokerageFees: { followingYears: v } }))}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-ink">Protection Juridique</h3>
            <Switch
              checked={draft.legalProtection.enabled}
              onChange={(enabled) => onChange(updateFees(draft, { legalProtection: { enabled } }))}
              label={draft.legalProtection.enabled ? "Proposée" : "Non proposée"}
            />
          </div>
          <AmountInput
            id="fee-legal"
            label="Prix annuel TTC"
            value={draft.legalProtection.price}
            changed={draft.legalProtection.price !== saved.legalProtection.price}
            onChange={(v) => v !== null && onChange(updateFees(draft, { legalProtection: { price: v } }))}
          />
          <p className="text-xs text-ink-muted">
            Lorsque l&apos;option n&apos;est pas proposée, l&apos;étape est informative et la PJ n&apos;est jamais ajoutée au
            calcul.
          </p>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <h3 className="font-bold text-ink">Mensualité indicative</h3>
          <AmountInput
            id="installments"
            label="Nombre d'échéances par an"
            suffix="×"
            value={draft.installmentsPerYear}
            changed={draft.installmentsPerYear !== saved.installmentsPerYear}
            onChange={(v) =>
              v !== null && v >= 1 && Number.isInteger(v) && onChange({ ...draft, installmentsPerYear: v })
            }
          />
          <p className="text-xs text-ink-muted">Excel : mensualité = total annuel ÷ 12.</p>
        </Card>
      </div>
    </section>
  );
}
