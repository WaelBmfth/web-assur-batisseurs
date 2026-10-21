import type { SimulatorFormValues } from "./formSchema";

export type SimulatorStep = {
  id: "activity" | "revenue" | "options" | "company" | "result";
  /** Libellé court (sur-titre « Étape n · … »). */
  label: string;
  /** Titre en deux parties : la seconde est mise en valeur en doré. */
  title: string;
  highlight: string;
  description: string;
  /** Champs validés avant de passer à l'étape suivante. */
  fields: (keyof SimulatorFormValues)[];
};

export const simulatorSteps: SimulatorStep[] = [
  {
    id: "activity",
    label: "Votre activité",
    title: "Pour commencer, quelle est",
    highlight: "votre activité principale ?",
    description: "Votre devis RC Décennale en 2 minutes, sans engagement.",
    fields: ["activityId"],
  },
  {
    id: "revenue",
    label: "Votre chiffre d'affaires",
    title: "Quel est votre chiffre d'affaires",
    highlight: "prévisionnel ?",
    description: "Le montant hors taxes que vous prévoyez de réaliser sur l'année.",
    fields: ["revenue"],
  },
  {
    id: "options",
    label: "Vos options",
    title: "Souhaitez-vous ajouter la",
    highlight: "Protection Juridique ?",
    description: "Une option pour être accompagné en cas de litige lié à votre activité.",
    fields: ["legalProtection"],
  },
  {
    id: "company",
    label: "Vos informations",
    title: "Dernière étape, quel est le nom",
    highlight: "de votre entreprise ?",
    description: "Pour personnaliser votre estimation.",
    fields: ["companyName"],
  },
  {
    id: "result",
    label: "Votre estimation",
    title: "Voici votre",
    highlight: "budget d'assurance",
    description: "",
    fields: [],
  },
];

/** Nombre d'étapes de saisie (l'estimation n'est pas comptée : « Étape 1 sur 4 »). */
export const inputStepCount = simulatorSteps.filter((s) => s.id !== "result").length;
