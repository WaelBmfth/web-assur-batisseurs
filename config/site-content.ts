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

/**
 * FAQ. `answer: null` = réponse à fournir par la cliente (affichée comme « À compléter »).
 * La réponse sur le coût est construite à partir de la grille tarifaire (voir FaqSection).
 */
export const faq: { id: string; question: string; answer: string | null }[] = [
  {
    id: "obligation",
    question: "L'assurance décennale est-elle obligatoire pour mon activité ?",
    answer:
      "Oui, pour tout professionnel qui participe à la construction d'un ouvrage : artisans, entreprises du bâtiment, maîtres d'œuvre ou bureaux d'études. Elle doit être souscrite avant l'ouverture du chantier.",
  },
  { id: "cost", question: "Combien coûte une assurance décennale pour un artisan du BTP ?", answer: null },
  { id: "documents", question: "Quels documents fournir pour obtenir un devis ?", answer: null },
  { id: "new-company", question: "Suis-je couvert si je crée mon entreprise sans chantier réalisé ?", answer: null },
  { id: "attestation", question: "En combien de temps reçoit-on son attestation ?", answer: null },
];
