import { z } from "zod";
import { parseAmount } from "@/lib/format";

/** Schéma du formulaire du simulateur (valeurs saisies, avant calcul). */
export const simulatorFormSchema = z.object({
  companyName: z.string().trim().min(1, "Veuillez renseigner votre raison sociale."),
  activityId: z.string().min(1, "Veuillez sélectionner votre activité."),
  revenue: z
    .string()
    .trim()
    .min(1, "Veuillez renseigner un chiffre d'affaires valide.")
    .refine((v) => Number.isFinite(parseAmount(v)), "Veuillez renseigner un chiffre d'affaires valide.")
    .refine((v) => parseAmount(v) > 0, "Le chiffre d'affaires doit être supérieur à 0 €."),
  legalProtection: z.enum(["yes", "no"], { message: "Veuillez indiquer votre choix." }),
});

export type SimulatorFormValues = z.infer<typeof simulatorFormSchema>;

export const emptySimulatorForm: SimulatorFormValues = {
  companyName: "",
  activityId: "",
  revenue: "",
  legalProtection: "yes",
};
