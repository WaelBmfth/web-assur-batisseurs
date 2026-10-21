import type { PricingConfig } from "@/types/pricing";

/**
 * Configuration tarifaire initiale, extraite du fichier Excel
 * « TARIFICATEUR ASSURBATISSEURS - FOURCHETTES - SITE INTERNET (1).xlsx »
 * (feuille « Tarificateur Global BTP »).
 *
 * Correspondance avec l'Excel :
 * - activités, tranches et fourchettes : plage H1:L27
 *   (H = activité, I = tranche de CA, J = prime min., K = prime max., L = catégorie) ;
 * - frais de courtage 1ère année : E6 ; 2ème année et suivantes : E7 ;
 * - Protection Juridique : E8 ;
 * - mensualité indicative : total annuel / 12 (C20:D21).
 *
 * Ces valeurs ne sont que le point de départ : la configuration en vigueur est
 * celle enregistrée depuis /admin (voir lib/pricing/repository.ts). Ne pas
 * modifier les tarifs ailleurs que dans ce fichier ou dans l'administration.
 */
export const defaultPricingConfig: PricingConfig = {
  version: 1,
  updatedAt: "2026-10-21T00:00:00.000Z",
  installmentsPerYear: 12,
  brokerageFees: {
    year1: 450,
    followingYears: 250,
  },
  legalProtection: {
    enabled: true,
    price: 296,
  },
  activities: [
  {
    id: "cuisines-seul",
    name: "Cuisines seul",
    category: "Second Œuvre / Agencement",
    active: true,
    sortOrder: 10,
    brackets: [
      { id: "cuisines-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "plomberie-seul",
    name: "Plomberie seul",
    category: "Second Œuvre / Technique",
    active: true,
    sortOrder: 20,
    brackets: [
      { id: "plomberie-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "installations-thermiques-seul",
    name: "Installations thermiques seul",
    category: "Second Œuvre / CVC",
    active: true,
    sortOrder: 30,
    brackets: [
      { id: "installations-thermiques-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "calorifugeage-seul",
    name: "Calorifugeage seul",
    category: "Second Œuvre / Isolation",
    active: true,
    sortOrder: 40,
    brackets: [
      { id: "calorifugeage-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "menuiserie-interieur-exterieur-seul",
    name: "Menuiserie intérieur / extérieur seul",
    category: "Second Œuvre / Fermetures",
    active: true,
    sortOrder: 50,
    brackets: [
      { id: "menuiserie-interieur-exterieur-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "platrerie-plaquiste-staff-stuc-seul",
    name: "Plâtrerie / plaquiste / staff / stuc seul",
    category: "Second Œuvre / Finitions",
    active: true,
    sortOrder: 60,
    brackets: [
      { id: "platrerie-plaquiste-staff-stuc-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "metallerie-seul",
    name: "Métallerie seul",
    category: "Second Œuvre / Structure légère",
    active: true,
    sortOrder: 70,
    brackets: [
      { id: "metallerie-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "revetement-dur-souple-seul",
    name: "Revêtement dur / souple seul",
    category: "Second Œuvre / Sols",
    active: true,
    sortOrder: 80,
    brackets: [
      { id: "revetement-dur-souple-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "serrurerie-seul",
    name: "Serrurerie seul",
    category: "Second Œuvre / Fermetures",
    active: true,
    sortOrder: 90,
    brackets: [
      { id: "serrurerie-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "vitrerie-miroiterie-seul",
    name: "Vitrerie - miroiterie seul",
    category: "Second Œuvre / Finitions",
    active: true,
    sortOrder: 100,
    brackets: [
      { id: "vitrerie-miroiterie-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "isolation-seul",
    name: "Isolation seul",
    category: "Second Œuvre / Finitions",
    active: true,
    sortOrder: 110,
    brackets: [
      { id: "isolation-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "revetement-de-facades-seul",
    name: "Revêtement de façades seul",
    category: "Second Œuvre / Façades",
    active: true,
    sortOrder: 120,
    brackets: [
      { id: "revetement-de-facades-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "amenagement-seul",
    name: "Aménagement seul",
    category: "Second Œuvre / Agencement",
    active: true,
    sortOrder: 130,
    brackets: [
      { id: "amenagement-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 444, premiumMax: 1160 },
    ],
  },
  {
    id: "macon-seul-maconnerie",
    name: "Maçon seul / Maçonnerie",
    category: "Gros Œuvre / Structure",
    active: true,
    sortOrder: 140,
    brackets: [
      { id: "macon-seul-maconnerie-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "couverture-seul",
    name: "Couverture seul",
    category: "Gros Œuvre / Structure",
    active: true,
    sortOrder: 150,
    brackets: [
      { id: "couverture-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "charpente-seul",
    name: "Charpente seul",
    category: "Gros Œuvre / Structure",
    active: true,
    sortOrder: 160,
    brackets: [
      { id: "charpente-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "etancheite-seul",
    name: "Étanchéité seul",
    category: "Gros Œuvre / Structure",
    active: true,
    sortOrder: 170,
    brackets: [
      { id: "etancheite-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "terrassement-vrd-seul",
    name: "Terrassement / VRD seul",
    category: "Gros Œuvre / VRD",
    active: true,
    sortOrder: 180,
    brackets: [
      { id: "terrassement-vrd-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "fumisterie-seul",
    name: "Fumisterie seul",
    category: "Technique / Fumisterie",
    active: true,
    sortOrder: 190,
    brackets: [
      { id: "fumisterie-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "photovoltaique-seul",
    name: "Photovoltaïque seul",
    category: "Énergie / Spécialité",
    active: true,
    sortOrder: 200,
    brackets: [
      { id: "photovoltaique-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "architecte-d-interieur-sans-structure-seul",
    name: "Architecte d'intérieur (sans structure, seul)",
    category: "Conception seule / Aménagement",
    active: true,
    sortOrder: 210,
    brackets: [
      { id: "architecte-d-interieur-sans-structure-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1704, premiumMax: 2154 },
    ],
  },
  {
    id: "maitre-d-oeuvre-seul",
    name: "Maître d'œuvre (seul)",
    category: "Conception / Coordination",
    active: true,
    sortOrder: 220,
    brackets: [
      { id: "maitre-d-oeuvre-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 3704, premiumMax: 4249 },
    ],
  },
  {
    id: "electricien-seul",
    name: "Électricien seul",
    category: "Second Œuvre / Technique",
    active: true,
    sortOrder: 230,
    brackets: [
      { id: "electricien-seul-1", revenueMin: 0, revenueMax: 50000, premiumMin: 739, premiumMax: 800 },
    ],
  },
  {
    id: "architecte-avec-suivi-de-travaux-seul",
    name: "Architecte avec suivi de travaux (seul)",
    category: "Conception & Suivi de chantier",
    active: true,
    sortOrder: 240,
    brackets: [
      { id: "architecte-avec-suivi-de-travaux-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 4000, premiumMax: 4499 },
    ],
  },
  {
    id: "paysagiste-seul",
    name: "Paysagiste seul",
    category: "Espaces Verts / Aménagement",
    active: true,
    sortOrder: 250,
    brackets: [
      { id: "paysagiste-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1190, premiumMax: 1490 },
    ],
  },
  {
    id: "peinture-seul",
    name: "Peinture seul",
    category: "Second Œuvre / Finitions",
    active: true,
    sortOrder: 260,
    brackets: [
      { id: "peinture-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1190, premiumMax: 1490 },
    ],
  },
  {
    id: "demolition-seul",
    name: "Démolition seul",
    category: "Gros Œuvre / Préparation",
    active: true,
    sortOrder: 270,
    brackets: [
      { id: "demolition-seul-1", revenueMin: 0, revenueMax: 250000, premiumMin: 1190, premiumMax: 1490 },
    ],
  },
  ],
};
