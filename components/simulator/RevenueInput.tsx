import type { UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { formatEuro, formatNumber, formatRevenueRange, parseAmount } from "@/lib/format";
import type { SimulatorFormValues } from "@/lib/simulator/formSchema";
import type { Activity } from "@/types/pricing";
import type { QuoteResult } from "@/types/simulator";
import { getCoveredRevenueRange } from "@/lib/calculator";

type Props = {
  register: UseFormRegister<SimulatorFormValues>;
  error?: string;
  activity?: Activity;
  quote: QuoteResult | null;
  onFormat: (formatted: string) => void;
};

export function RevenueInput({ register, error, activity, quote, onFormat }: Props) {
  const range = activity ? getCoveredRevenueRange(activity) : null;
  const outOfRange = quote && !quote.ok && quote.code.startsWith("REVENUE_") ? quote : null;
  const field = register("revenue", {
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      const value = parseAmount(event.target.value);
      if (Number.isFinite(value) && value > 0) onFormat(formatNumber(value));
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <FormField
        id="revenue"
        label="Chiffre d'affaires prévisionnel HT"
        required
        error={error}
        hint={
          activity && range
            ? `Grille en ligne pour « ${activity.name} » : CA de ${formatRevenueRange(range.min, range.max)}.`
            : "Montant annuel hors taxes, en euros."
        }
      >
        {(control) => (
          <TextInput
            {...control}
            {...field}
            inputMode="decimal"
            autoComplete="off"
            placeholder="150 000"
            suffix="€ HT"
            className="tabular text-lg font-semibold"
          />
        )}
      </FormField>

      {outOfRange && (
        <div role="status" className="rounded-2xl border border-accent-400/50 bg-warning-100 p-4 text-sm text-warning-800">
          <p className="font-semibold">{outOfRange.message}</p>
          <p className="mt-1">
            {outOfRange.maxCoveredRevenue !== undefined &&
              `Notre grille en ligne couvre jusqu'à ${formatEuro(outOfRange.maxCoveredRevenue, { decimals: false })} de CA. `}
            Vous pouvez poursuivre : nous vous proposerons une étude personnalisée.
          </p>
        </div>
      )}
    </div>
  );
}
