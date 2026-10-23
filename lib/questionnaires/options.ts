/**
 * Listes de choix des questionnaires, recopiées des fiches Excel de référence
 * (libellés conservés à l'identique). Les composants affichent ces listes :
 * ajouter / retirer une option se fait ici, sans dupliquer de JSX.
 */

export type Option<V extends string = string> = { value: V; label: string };

/** Fractionnement « [ ] A [ ] S [ ] T [ ] M » (Artisans, RCD PIB). */
export const paymentFrequencies = [
  { value: "annuel", label: "Annuel" },
  { value: "semestriel", label: "Semestriel" },
  { value: "trimestriel", label: "Trimestriel" },
  { value: "mensuel", label: "Mensuel" },
] as const satisfies readonly Option[];

/** Coût du plus gros chantier (Artisans, RCD PIB). */
export const largestSiteCosts = [
  { value: "lt-50k", label: "< 50 000 €" },
  { value: "lt-500k", label: "< 500 000 €" },
  { value: "lt-1m", label: "< 1 000 000 €" },
] as const satisfies readonly Option[];

export const yesNo = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
] as const satisfies readonly Option[];

/** Fiche Artisans — « 3. Activités bâtiment (Nomenclature France Assureurs 2019 - 40 Activités) ». */
export const artisanActivities: readonly Option[] = [
  "Démolition",
  "Terrassement / VRD / Excavation",
  "Fondations spéciales / Pieux / Forage",
  "Gros œuvre / Maçonnerie / Béton armé",
  "Charpente bois / Structure bois",
  "Charpente métallique / Métallerie de structure",
  "Couverture / Zinguerie",
  "Étanchéité de toiture-terrasse / Bardage",
  "Menuiserie extérieure / Fermetures",
  "Serrurerie / Vitrerie / Miroiterie",
  "Plâtrerie / Isolation thermique & acoustique",
  "Menuiserie intérieure / Agencement",
  "Carrelage / Faïence / Revêtements durs",
  "Revêtements de sols souples / Parquets",
  "Peinture / Ravalement de façade",
  "Isolation thermique par l'extérieur (ITE)",
  "Plomberie / Sanitaire",
  "Chauffage / Ventilation / Climatisation (CVC)",
  "Électricité générale / Courants faibles",
  "Énergies renouvelables (Photovoltaïque / PAC)",
  "Étanchéité des façades / Cimenterie",
  "Piscines / Spas (Construction & Étanchéité)",
  "Fumisterie / Ramonage / Cheminées",
  "Ascenseurs / Monte-charges / Escalators",
  "Espaces verts / Aménagements extérieurs",
  "Traitement des bois et charpentes / Termites",
  "Désamiantage / Dépollution",
  "Assainissement autonome / Fosses septiques",
  "Installations frigorifiques industrielles",
  "Automatisme de fermetures / Domotique",
  "Serrurerie de sécurité / Blindage",
  "Agencement de cuisines professionnelles",
  "Nettoyage de fin de chantier",
  "Échafaudage (Montage / Démontage)",
  "Sondages et forages d'eau",
  "Génie civil / Ouvrages d'art",
  "Maître d'œuvre / Assistance à maîtrise d'ouvrage",
  "Contractant général",
  "Infiltration / Assèchement après sinistre",
  "Autre activité spécialisée du bâtiment",
].map((label, index) => {
  const code = String(index + 1).padStart(2, "0");
  return { value: code, label: `${code}. ${label}` };
});

/** Fiche DO — « Garanties souhaitées ». */
export const doGuarantees = [
  { value: "do", label: "D.O (Dommages Ouvrage)" },
  { value: "rcmo", label: "RCMO (Responsabilité Civile du Maître d'Ouvrage)" },
  { value: "gfa", label: "GFA (Garantie Financière d'Achèvement)" },
  { value: "cnr", label: "CNR (Constructeur Non Réalisateur)" },
] as const satisfies readonly Option[];

export const doDestinations = [
  { value: "vente", label: "Vente" },
  { value: "exploitation-directe", label: "Exploitation directe" },
] as const satisfies readonly Option[];

export const doWorkTypes = [
  { value: "appel-offres", label: "Appel d'offres" },
  { value: "renovation", label: "Rénovation" },
  { value: "construction-neuve", label: "Construction neuve" },
  { value: "sur-existant", label: "Sur existant" },
  { value: "rehabilitation", label: "Réhabilitation" },
  { value: "autre", label: "Autre" },
] as const satisfies readonly Option[];

export const doBuildingTypes = [
  { value: "batiments-publics", label: "Bâtiments publics" },
  { value: "batiment-industriel", label: "Bâtiment industriel" },
  { value: "batiments-commerciaux", label: "Bâtiments commerciaux" },
  { value: "maison-individuelle", label: "Maison individuelle" },
  { value: "maison-jumelee", label: "Maison jumelée" },
  { value: "immeuble-bureaux", label: "Immeuble de bureaux" },
  { value: "immeuble-habitation", label: "Immeuble d'habitation" },
  { value: "autre", label: "Autre" },
] as const satisfies readonly Option[];

export const doArchitectMissions = [
  { value: "mission-complete", label: "Mission complète" },
  { value: "autre-mission", label: "Autre mission" },
] as const satisfies readonly Option[];

/** Fiche RCD PIB — « 3. Activités intellectuelles du bâtiment (PIB) ». */
export const pibActivities: readonly Option[] = [
  "Architecte",
  "Bureau d'études techniques (BET)",
  "Ordonnancement, Pilotage, Coordination (OPC)",
  "Architecte d'intérieur",
  "Maître d'œuvre",
  "Expert",
  "Topographe / Métreur",
  "Contrôleur technique",
  "Assistant à Maîtrise d'Ouvrage (AMO)",
  "Paysagiste / Décorateur",
  "Assistant Maître d'œuvre",
  "Économiste de la construction",
  "Dessinateur / Projeteur",
  "Autre",
].map((label, index) => ({ value: `pib-${String(index + 1).padStart(2, "0")}`, label }));

/** Fiche RCD PIB — « Répartition par Type d'Ouvrage ». */
export const workTypeShares: readonly Option[] = [
  { value: "maison-individuelle", label: "Maison individuelle" },
  { value: "immeuble-habitation", label: "Immeuble d'habitation" },
  { value: "immeubles-commerciaux", label: "Immeubles commerciaux" },
  { value: "immeuble-industriel", label: "Immeuble industriel" },
  { value: "immeuble-agricole", label: "Immeuble agricole" },
  { value: "hopitaux", label: "Hôpitaux" },
];

/** Fiche RCD PIB — « Répartition par Type de Mission ». */
export const missionTypeShares: readonly Option[] = [
  { value: "mission-pc", label: "1. Mission PC (Permis de Construire)" },
  { value: "mission-conception", label: "2. Mission Conception" },
  { value: "mission-exe-complete", label: "3. Mission EXE + Complète" },
];

export const optionValues = <T extends readonly Option[]>(options: T) =>
  options.map((o) => o.value) as unknown as [T[number]["value"], ...T[number]["value"][]];
