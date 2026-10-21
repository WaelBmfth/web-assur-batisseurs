import type { UseFormRegister } from "react-hook-form";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { Badge } from "@/components/ui/Badge";
import { FieldError } from "@/components/ui/FormField";
import { formatEuro } from "@/lib/format";
import type { SimulatorFormValues } from "@/lib/simulator/formSchema";
import type { LegalProtectionSettings } from "@/types/pricing";

type Props = {
  register: UseFormRegister<SimulatorFormValues>;
  settings: LegalProtectionSettings;
  error?: string;
};

export function ProtectionJuridique({ register, settings, error }: Props) {
  if (!settings.enabled) {
    return (
      <p className="rounded-2xl border border-line bg-canvas p-5 text-sm text-ink-muted">
        L&apos;option Protection Juridique n&apos;est pas proposée en ligne actuellement. Vous pouvez poursuivre vers
        votre estimation.
      </p>
    );
  }

  const field = register("legalProtection");
  return (
    <fieldset aria-describedby={error ? "legalProtection-error" : undefined} className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-semibold text-ink">
        Inclure la Protection Juridique (PJ)
        <span className="ml-0.5 text-danger-700" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          {...field}
          value="yes"
          title="Oui, je l'inclus"
          description="Assistance et prise en charge de vos litiges professionnels (clients, fournisseurs, sous-traitants)."
          aside={<Badge tone="accent">+ {formatEuro(settings.price)} / an</Badge>}
        />
        <ChoiceCard
          {...field}
          value="no"
          title="Non merci"
          description="Votre estimation portera uniquement sur l'assurance et les frais de courtage."
        />
      </div>
      <FieldError id="legalProtection-error" message={error} />
    </fieldset>
  );
}
