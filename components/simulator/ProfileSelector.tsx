import type { UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Icon } from "@/components/ui/Icon";
import { inputClasses } from "@/components/ui/TextInput";
import type { SimulatorFormValues } from "@/lib/simulator/formSchema";
import type { Activity } from "@/types/pricing";

type Props = {
  activities: Activity[];
  register: UseFormRegister<SimulatorFormValues>;
  selected?: Activity;
  error?: string;
};

/** Regroupe les activités par famille (1ère partie de la catégorie : « Second Œuvre », « Gros Œuvre »…). */
function groupByFamily(activities: Activity[]) {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const family = activity.category.split("/")[0]?.trim() || "Autres activités";
    groups.set(family, [...(groups.get(family) ?? []), activity]);
  }
  return [...groups.entries()];
}

export function ProfileSelector({ activities, register, selected, error }: Props) {
  return (
    <FormField
      id="activityId"
      label="Activité / profil exercé"
      hideLabel
      error={error}
      hint={selected?.category}
      hintClassName="text-center text-xs"
    >
      {(control) => (
        <div className="relative">
          <select {...control} {...register("activityId")} className={`${inputClasses} cursor-pointer appearance-none pr-11`}>
            <option value="" disabled>
              Sélectionnez votre activité
            </option>
            {groupByFamily(activities).map(([family, items]) => (
              <optgroup key={family} label={family}>
                {items.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Icon name="chevronDown" className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink" />
        </div>
      )}
    </FormField>
  );
}
