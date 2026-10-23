import type { IconName } from "@/components/ui/Icon";

/**
 * Contenus éditoriaux du site (en-tête, atouts, FAQ, pied de page), repris de la maquette.
 * Séparés du simulateur : le futur site pourra les remplacer sans toucher au tarificateur.
 * Les liens pointent vers « # » tant que les pages du futur site n'existent pas.
 */

export const contact = {
  phone: "06 20 03 82 02",
  phoneHref: "tel:+33620038202",
  hours: ["Lundi-jeudi : 9 h-17 h", "Vendredi : 9 h-12 h 30"],
  address: ["Hôtel d'entreprises,", "Parc d'activités de la Gaultière,", "35220 Châteaubourg"],
  /** QUESTION CLIENT: adresse e-mail de contact à afficher. */
  email: null as string | null,
};

export type NavLink = { label: string; href: string };

export const insuranceLinks = {
  companies: {
    title: "Entreprises du bâtiment",
    links: [
      { label: "Assurance décennale", href: "#" },
      { label: "Assurance décennale auto-entrepreneur", href: "#" },
      { label: "Responsabilité Civile Professionnelle", href: "#" },
      { label: "TRC Tous Risques Chantier", href: "#" },
      { label: "Garantie biennale", href: "#" },
      { label: "Dommages immatériels", href: "#" },
    ],
  },
  owners: {
    title: "Maîtres d'ouvrage et constructeurs",
    links: [
      { label: "Dommages-ouvrage", href: "#" },
      { label: "Constructeur non réalisateur", href: "#" },
      { label: "RC maître d'ouvrage", href: "#" },
      { label: "Garantie financière d'achèvement", href: "#" },
    ],
  },
} satisfies Record<string, { title: string; links: NavLink[] }>;

export const mainNav: NavLink[] = [
  { label: "Agents et courtiers", href: "#" },
  { label: "À propos", href: "#" },
];

export const headerCta = { label: "Demander mon étude décennale", href: "/#simulateur" };

export const footerColumns: { title: string; links: NavLink[] }[] = [
  {
    title: "Zone d'intervention",
    links: [
      { label: "Rennes et sa métropole", href: "#" },
      { label: "Vitré (35) et le pays de Vitré", href: "#" },
      { label: "Châteaubourg et ses environs", href: "#" },
      { label: "Laval et la Mayenne", href: "#" },
      { label: "Toute l'Ille-et-Vilaine", href: "#" },
    ],
  },
  insuranceLinks.companies,
  insuranceLinks.owners,
  {
    title: "Le cabinet",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Nos assurances", href: "#" },
      { label: "Demande d'étude", href: "#" },
      { label: "Agents et courtiers", href: "#" },
      { label: "À propos", href: "#" },
    ],
  },
];

export const legalLinks: NavLink[] = [
  { label: "Immatriculation ORIAS en cours", href: "#" },
  { label: "Mentions légales", href: "#" },
  { label: "Politique de confidentialité", href: "#" },
];

export const strengths: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "headset",
    title: "Un conseiller dédié",
    text: "Un interlocuteur unique suit votre dossier décennale, de la souscription aux éventuels sinistres.",
  },
  {
    icon: "award",
    title: "Des assureurs reconnus",
    text: "Nous travaillons avec des compagnies solides, spécialistes de la construction.",
  },
  {
    icon: "fileText",
    title: "Des offres sur mesure",
    text: "Des garanties ajustées à votre métier, votre chiffre d'affaires et vos chantiers.",
  },
  {
    icon: "shieldCheck",
    title: "Une couverture complète",
    text: "RC Décennale, RC Professionnelle et garanties annexes réunies dans un seul contrat.",
  },
  {
    icon: "smartphone",
    title: "Attestation rapide",
    text: "Votre attestation décennale remise par e-mail, prête à joindre à vos devis.",
  },
  {
    icon: "scale",
    title: "Négociation des tarifs",
    text: "En tant que courtier, nous comparons et négocions pour vous le meilleur rapport garanties / prix.",
  },
];

/** Réponse de FAQ : texte simple, ou liste structurée (pièces à fournir). */
export type FaqAnswer =
  | { kind: "text"; text: string }
  | { kind: "steps"; intro: string; steps: { title: string; items?: string[] }[] };

export type FaqItem = { id: string; question: string; answer: FaqAnswer };

/**
 * FAQ (contenu validé par la cliente). Source unique : l'accordéon et le
 * balisage FAQPage (JSON-LD) sont générés à partir de ce tableau.
 * Les espaces insécables (avant « ? : », entre nombre et « € » / « h ») sont
 * ajoutés à l'affichage : écrire ici des espaces normales.
 */
export const faq: FaqItem[] = [
  {
    id: "obligation",
    question: "L'assurance décennale est-elle obligatoire pour mon activité ?",
    answer: {
      kind: "text",
      text: "Oui, pour tout professionnel qui participe à la construction d'un ouvrage : artisans, entreprises du bâtiment, maîtres d'œuvre ou bureaux d'études. Elle doit être souscrite avant l'ouverture du chantier.",
    },
  },
  {
    id: "cost",
    question: "Combien coûte une assurance décennale pour un artisan du BTP ?",
    answer: {
      kind: "text",
      text: "Le tarif dépend de votre activité, de votre chiffre d'affaires et de votre effectif. Sur notre grille actuelle, la prime d'assurance démarre à 740 € TTC par an (soit moins de 62 € / mois), hors frais de courtage et options. Le simulateur ci-dessus vous donne une fourchette personnalisée en 2 minutes.",
    },
  },
  {
    id: "documents",
    question: "Quels documents fournir pour obtenir un devis ?",
    answer: {
      kind: "steps",
      intro:
        "Juste un relevé de sinistralité et l'attestation en cours (si assuré). Pour la souscription, voici la liste des pièces à fournir :",
      steps: [
        {
          title: "Un document prouvant l'existence de votre entreprise :",
          items: [
            "Un extrait K-bis de moins de 3 mois si l'entreprise est immatriculée au Registre du Commerce et des Sociétés (RCS)",
            "Un extrait D1 ou immatriculation au Répertoire des Métiers (si artisan)",
            "L'avis de situation INSEE (SIREN/SIRET)",
            "Une facture vierge de votre entreprise (souvent demandée pour vérifier les mentions légales obligatoires, dont le numéro d'assurance ou le statut)",
          ],
        },
        {
          title: "Justificatifs d'expérience professionnelle :",
          items: [
            "Certificats de travail dans le métier concerné (2 ans pour le second œuvre et 3 ans pour le gros œuvre)",
            "Bulletins de salaire sur plusieurs années",
            "Attestations d'emploi ou détails de missions antérieures",
            "Diplômes",
            "L'ancienne attestation d'assurance décennale (si déjà assuré)",
            "CV du gérant",
            "Pièce d'identité du gérant",
            "Certifications professionnelles",
          ],
        },
        { title: "Relevé de sinistralité et attestation précédente" },
        { title: "RIB et mandat de paiement" },
        { title: "Devis et pièces obligatoires signées" },
      ],
    },
  },
  {
    id: "new-company",
    question: "Suis-je couvert si je crée mon entreprise sans chantier réalisé ?",
    answer: {
      kind: "text",
      text: "Oui, car la responsabilité civile professionnelle vous couvre dès l'édition de votre attestation, même lors de vos échanges commerciaux et devis.",
    },
  },
  {
    id: "attestation",
    question: "En combien de temps reçoit-on son attestation ?",
    answer: {
      kind: "text",
      text: "Vous pouvez recevoir votre attestation sous 48 h, après la fourniture de toutes les pièces contractuelles (hors période d'échéances).",
    },
  },
];
