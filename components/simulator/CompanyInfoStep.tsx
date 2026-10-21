import type { UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import type { SimulatorFormValues } from "@/lib/simulator/formSchema";

type Props = {
  register: UseFormRegister<SimulatorFormValues>;
  error?: string;
};

export function CompanyInfoStep({ register, error }: Props) {
  return (
    <FormField id="companyName" label="Nom / raison sociale" required error={error} hint="Ex. : Dupont Rénovation SARL">
      {(control) => (
        <TextInput
          {...control}
          {...register("companyName")}
          autoComplete="organization"
          placeholder="Nom de votre entreprise"
          leading={
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path d="M4 3a1 1 0 0 0-1 1v13H2v1h16v-1h-1V8a1 1 0 0 0-1-1h-4V4a1 1 0 0 0-1-1H4Zm1 3h2v2H5V6Zm4 0h2v2H9V6ZM5 10h2v2H5v-2Zm4 0h2v2H9v-2Zm4 0h2v2h-2v-2Zm-8 4h2v3H5v-3Zm8 0h2v3h-2v-3Z" />
            </svg>
          }
        />
      )}
    </FormField>
  );
}
