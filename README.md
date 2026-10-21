# Simulateur de devis — Assurance BTP & Conception

Application **Next.js standalone** permettant d'estimer un budget d'assurance BTP à partir de l'activité,
du chiffre d'affaires prévisionnel et de l'option Protection Juridique. Elle comprend :

- le **simulateur** (`/`) : 4 étapes (activité, chiffre d'affaires, Protection Juridique, raison sociale) puis l'estimation,
  avec fourchette basse / haute, total année 1, total années suivantes, mensualité indicative et détail du calcul ;
- une **administration** (`/admin`) pour gérer minimums de prime, activités, tranches de CA et frais,
  sans modifier le code.

Les tarifs et la logique de calcul reproduisent le fichier Excel (copie de référence dans `docs/`)
`TARIFICATEUR ASSURBATISSEURS -FOURCHETTES-SITE INTERNET (1).xlsx` (voir [Calcul](#calcul)).
Les points à faire valider sont listés dans [`CLIENT_QUESTIONS.md`](./CLIENT_QUESTIONS.md).

## Installation

Prérequis : Node.js 20.9+ (testé avec Node 22).

```bash
npm install
```

## Développement

```bash
npm run dev        # http://localhost:3000 et http://localhost:3000/admin
npm test           # tests du moteur de calcul et de la configuration (Vitest)
npm run lint       # ESLint
npm run typecheck  # TypeScript strict
```

## Build

```bash
npm run build
npm start
```

Variables d'environnement (facultatives) :

| Variable | Rôle |
| --- | --- |
| `ADMIN_PASSWORD` | Active l'authentification HTTP Basic sur `/admin` et sur l'écriture de l'API. **À définir avant toute mise en ligne.** |
| `ADMIN_USER` | Identifiant associé (`admin` par défaut). |
| `PRICING_CONFIG_PATH` | Fichier de stockage de la grille (`storage/pricing-config.json` par défaut). |

## Architecture

La séparation suit trois couches : **UI → logique métier → données tarifaires**.

```
app/
  page.tsx                    Page du simulateur : en-tête, simulateur, atouts, FAQ, pied de page
  admin/page.tsx              Page d'administration
  api/pricing-config/         GET (public) / PUT (admin) de la grille, POST reset/ (valeurs Excel)
components/
  simulator/                  QuoteSimulator + étapes, ProgressBar, PriceSummary, PriceBreakdown…
  site/                       Habillage du site (SiteHeader, SiteFooter, StrengthsSection, FaqSection, Logo)
  admin/                      MinimumPremiumManager, ActivityManager, BracketEditor, FeeSettings…
  ui/                         Composants génériques (Button, Icon, Card, FormField, ChoiceCard…)
lib/
  calculator/                 Moteur de calcul pur : calculateQuote + règles (pricingRules)
  pricing/                    Schéma Zod, opérations d'édition, stockage (repository.server.ts), client API
  simulator/                  Schéma du formulaire et définition des étapes
  format.ts                   Formats monétaires français (1 704,00 €)
data/pricing-data.ts          Grille initiale extraite de l'Excel
types/                        Types TypeScript (pricing.ts, simulator.ts)
config/calculator-config.ts   Paramètres non tarifaires (locale, textes, lien de contact, stockage)
config/site-content.ts        Contenus du site : navigation, coordonnées, atouts, FAQ, liens du pied de page
public/logo-assurbatisseurs.png  Logo
tests/                        Tests Vitest (moteur, parité Excel, admin, stockage, formulaire)
proxy.ts                      Protection de l'administration (Next.js 16 « proxy », ex-middleware)
```

Aucun tarif n'est écrit dans un composant React : les composants reçoivent la configuration
(`PricingConfig`) et délèguent tout calcul à `calculateQuote`.

## Calcul

`lib/calculator/calculateQuote.ts` est une **fonction pure** (aucune dépendance à React ou au DOM) :

```ts
calculateQuote(input: QuoteInput, pricingConfig: PricingConfig): QuoteResult
```

Étapes, identiques à l'Excel (feuille « Tarificateur Global BTP ») :

1. recherche de l'activité (doit exister et être active) ;
2. recherche de la tranche contenant le CA (bornes incluses) ;
3. fourchette de prime : **minimum de prime** (bas) et **borne haute** (haut ; égale au minimum si absente) ;
4. Protection Juridique : `prix` si choisie et proposée, sinon `0` — Excel `=IF(B8="Oui";E8;0)` ;
5. total **année 1** = prime + PJ + courtage 1ère année (450 €) — Excel `C18:C19` ;
6. total **années suivantes** = prime + PJ + courtage années suivantes (250 €) — Excel `D18:D19` ;
7. mensualité = total ÷ 12, arrondie au centime — Excel `C20:D21`.

Le résultat est une union discriminée : `{ ok: true, insurance, legalProtection, year1, followingYears, … }`
ou `{ ok: false, code, message }` (`ACTIVITY_NOT_FOUND`, `ACTIVITY_INACTIVE`, `INVALID_REVENUE`,
`REVENUE_ABOVE_RANGE`, `REVENUE_BELOW_RANGE`, `NO_MATCHING_BRACKET`). Lorsque le CA dépasse la tranche
couverte, aucune estimation n'est inventée : le visiteur est orienté vers une étude personnalisée.

Exemple (Plomberie, CA 150 000 €, PJ incluse) : prime 444 € à 1 160 € → année 1 **1 190,00 € à 1 906,00 €**
(99,17 € à 158,83 € / mois), années suivantes **990,00 € à 1 706,00 €** (82,50 € à 142,17 € / mois).
Le test `tests/calculator/excelParity.test.ts` vérifie les 27 activités et l'exemple enregistré dans l'Excel.

## Tarification

- **Valeurs initiales** : `data/pricing-data.ts` (27 activités, tranches, minimums, bornes hautes, courtage 450 € / 250 €,
  PJ 296 €), extraites de l'Excel.
- **Valeurs en vigueur** : `storage/pricing-config.json`, écrit par l'administration. Tant que ce fichier n'existe pas,
  les valeurs initiales s'appliquent. Chaque enregistrement incrémente `version` et archive une copie dans
  `storage/history/v{n}.json`.
- Le dossier `storage/` est ignoré par git : ce sont des données d'exécution, pas du code.

Modèle (`types/pricing.ts`) :

```ts
Activity      { id, name, category, active, sortOrder, brackets: PremiumBracket[] }
PremiumBracket{ id, revenueMin, revenueMax | null, premiumMin, premiumMax | null }
PricingConfig { version, updatedAt, installmentsPerYear, brokerageFees: { year1, followingYears },
                legalProtection: { enabled, price }, activities }
```

## Minimums de prime

Les minimums de prime sont la variable identifiée par la cliente comme évolutive ; ils ont donc leur propre
onglet, ouvert par défaut dans l'administration.

1. Ouvrir `/admin` → onglet **Minimums de prime** (une ligne par activité et par tranche de CA).
2. Modifier le montant directement dans le champ (la valeur précédente s'affiche ; le panneau « Tester la grille »
   montre l'effet immédiatement).
3. Cliquer **Enregistrer**. Le simulateur utilise la nouvelle valeur dès le chargement suivant de la page.

Sans interface, on peut aussi modifier `premiumMin` dans `data/pricing-data.ts` (valeurs par défaut) ou appeler
`updatePremiumMin(config, activityId, bracketId, montant)` (`lib/pricing/configOperations.ts`).

## Activités

Depuis `/admin` → **Activités & tranches** :

- **Ajouter** : saisir le nom et la catégorie (format « Famille / Sous-famille », la famille sert au regroupement
  dans le simulateur), puis compléter les tranches dans le panneau qui s'ouvre ;
- **Modifier** : nom, catégorie, tranches (CA min. / max., minimum de prime, borne haute ; champ vide = sans plafond) ;
- **Activer / désactiver** : une activité inactive disparaît du simulateur mais reste conservée ;
- **Ordonner** : flèches ▲ ▼ ;
- **Supprimer** : avec confirmation.

En code : ajouter un objet `Activity` dans `data/pricing-data.ts` (identifiant unique).

## Admin

- `/admin` charge la grille en vigueur côté serveur ; les modifications sont faites sur un brouillon local,
  validées (Zod : montants positifs, CA max. > CA min., borne haute ≥ minimum, identifiants uniques) puis
  envoyées à `PUT /api/pricing-config`. La barre « Modifications non enregistrées » permet d'enregistrer ou d'annuler.
- **Frais & options** : courtage 1ère année / années suivantes, prix et disponibilité de la PJ, nombre d'échéances.
- **Rétablir les valeurs Excel** : recrée une nouvelle version à partir de `data/pricing-data.ts`.
- **Sécurité** : prototype protégé par mot de passe unique (`ADMIN_PASSWORD`). Un bandeau signale l'absence de protection.
- **Stockage** : fichier JSON, adapté à un hébergement Node classique. Pour une plateforme serverless ou une base
  de données, fournir une autre implémentation de l'interface `PricingRepository`
  (`lib/pricing/repository.server.ts`) — le reste de l'application est inchangé.

## Intégration

Le simulateur ne dépend d'aucun contexte global : il reçoit la grille en propriété.

```tsx
// Dans une page (Server Component) du futur site Next.js
import { QuoteSimulator } from "@/components/simulator";
import { pricingRepository } from "@/lib/pricing/repository.server";

export default async function DevisPage() {
  const pricingConfig = await pricingRepository.load(); // ou fetch("/api/pricing-config")
  return (
    <QuoteSimulator
      pricingConfig={pricingConfig}
      contactHref="/contact"
      onQuote={({ values, quote }) => { /* ex. : envoi d'un lead */ }}
    />
  );
}
```

Props : `pricingConfig` (obligatoire), `contactHref`, `onQuote` (appelé à l'affichage de l'estimation),
`hideProgress` (masque la barre de progression pleine largeur).

L'habillage (`components/site/`, `config/site-content.ts`) est indépendant du simulateur : le futur site peut
garder le sien et n'importer que `<QuoteSimulator />`.

Le moteur s'importe indépendamment (API, back-office, tests) :

```ts
import { calculateQuote } from "@/lib/calculator";
const result = calculateQuote({ activityId: "plomberie-seul", revenue: 150_000, includeLegalProtection: true }, config);
```

Pour intégrer : copier `components/`, `lib/`, `types/`, `data/`, `config/` et les tokens `@theme` de
`app/globals.css` (Tailwind CSS v4), ajouter les dépendances `zod`, `react-hook-form`, `@hookform/resolvers`,
et les polices Archivo / Jost (`next/font/google`, voir `app/layout.tsx`).

## Design

L'interface reprend la maquette AssurBâtisseurs : en-tête noir avec logo doré, barre de progression avec pourcentage,
une question par étape (sur-titre « Étape n · … », titre bicolore, bouton doré « Suivant »), section « Nos atouts »,
FAQ en accordéon et pied de page noir. Couleurs relevées sur la maquette (or `#C8A54D`, titres `#866835`,
crème `#F6EFE4`), centralisées dans les tokens de `app/globals.css`. Typographies : Archivo (titres), Jost (texte).

Les contenus manquants dans la maquette (réponses de FAQ, e-mail) sont affichés « [À compléter : …] » comme dans
la maquette, et listés dans `CLIENT_QUESTIONS.md`. La réponse « Combien coûte… » est calculée à partir de la grille
en vigueur (minimum de prime le plus bas), jamais écrite en dur.

## Accessibilité

Labels associés à chaque champ (y compris la liste des activités), erreurs reliées par `aria-describedby` et annoncées (`role="alert"`),
groupes de choix en `fieldset`/`legend`, navigation clavier complète, focus visible, focus déplacé sur le titre
à chaque changement d'étape, barre de progression `role="progressbar"`, FAQ en `<details>` natifs, menu clavier (Échap pour fermer), contrastes conformes.
