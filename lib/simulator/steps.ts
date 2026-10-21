import type { SimulatorFormValues } from "./formSchema";

export type SimulatorStep = {
  id: "company" | "activity" | "revenue" | "options" | "result";
  label: string;
  title: string;
  description: string;
  /** Champs validés avant de passer à l'étape suivante. */
  fields: (keyof SimulatorFormValues)[];
};

export const simulatorSteps: SimulatorStep[] = [
  {
    id: "company",
    label: "Vos informations",
    title: "Faisons connaissance",
    description: "Indiquez le nom de votre entreprise pour personnaliser votre estimation.",
    fields: ["companyName"],
  },
  {
    id: "activity",
    label: "Votre activité",
    title: "Quel est votre métier ?",
    description: "Sélectionnez l'activité principale que vous exercez.",
    fields: ["activityId"],
  },
  {
    id: "revenue",
    label: "Votre chiffre d'affaires",
    title: "Votre chiffre d'affaires prévisionnel",
    description: "Le montant hors taxes que vous prévoyez de réaliser sur l'année.",
    fields: ["revenue"],
  },
  {
    id: "options",
    label: "Vos options",
    title: "Protection Juridique",
    description: "Souhaitez-vous inclure la Protection Juridique à votre contrat ?",
    fields: ["legalProtection"],
  },
  {
    id: "result",
    label: "Votre estimation",
    title: "Votre estimation",
    description: "",
    fields: [],
  },
];
