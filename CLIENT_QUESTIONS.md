# Questions client

Questions issues de l'analyse du fichier `TARIFICATEUR ASSURBATISSEURS -FOURCHETTES-SITE INTERNET (1).xlsx`
(feuille unique « Tarificateur Global BTP »). Pour chaque point, le comportement actuellement implémenté
est indiqué entre parenthèses : il peut être ajusté sans toucher aux composants.

## Tarification

- [ ] **CA au-delà de la tranche.** Dans l'Excel, le chiffre d'affaires saisi (B7) n'est utilisé par aucune formule et chaque activité n'a qu'une seule tranche (0 à 250 000 €, ou 0 à 50 000 € pour « Électricien seul »). Quel tarif appliquer si le CA est supérieur ? Existe-t-il une grille pour les tranches suivantes ?
  _(Actuel : aucune estimation, le visiteur est invité à demander une étude personnalisée.)_
- [ ] **Électricien seul.** Sa tranche s'arrête à 50 000 € alors que toutes les autres vont jusqu'à 250 000 €. Est-ce volontaire ? Que proposer à un électricien entre 50 000 € et 250 000 € de CA ?
- [ ] **Bornes hautes.** Le sous-titre de l'Excel indique « Max 1 160 € pour le Point 1 / Max 2 154 € pour le Point 2 », mais la grille contient d'autres plafonds (800 €, 1 490 €, 4 249 €, 4 499 €). Peut-on confirmer que la grille (colonnes J/K) fait foi ?
- [ ] **Évolution de la borne haute.** Quand un minimum de prime change, la borne haute reste-t-elle fixe ou évolue-t-elle aussi (même écart, même pourcentage) ?
  _(Actuel : seul le montant modifié change ; un minimum supérieur à la borne haute est refusé à l'enregistrement.)_
- [ ] **TTC.** Les primes et la PJ sont indiquées TTC. Les frais de courtage (450 € / 250 €) sont-ils également des montants définitifs (TTC / non soumis à TVA) ?

## Minimums de prime

- [ ] Les minimums sont aujourd'hui définis **par activité** (une seule tranche chacune). Si des tranches de CA sont ajoutées, le minimum sera-t-il défini par activité **et** par tranche ?
  _(Actuel : le modèle gère déjà un minimum par activité et par tranche.)_
- [ ] Lorsqu'un minimum est modifié, s'applique-t-il **immédiatement** ou à partir d'une **date d'effet** (nouvelle version tarifaire datée) ?
  _(Actuel : application immédiate à l'enregistrement ; chaque version enregistrée est archivée dans `storage/history/`.)_

## Activités

- [ ] Toutes les activités sont libellées « seul ». Comment traiter une entreprise qui exerce **plusieurs activités** (ex. plomberie + électricité) : activité la plus chère, cumul, étude personnalisée ?
  _(Actuel : une seule activité sélectionnable ; un lien « étude personnalisée » est proposé si le métier n'est pas listé.)_
- [ ] « Architecte d'intérieur (sans structure, seul) » est classé « Conception seule / Aménagement » mais tarifé comme le gros œuvre (1 704 € à 2 154 €). Peut-on confirmer ?

## Calcul

- [ ] La **mensualité** est-elle purement indicative (total ÷ 12, comme dans l'Excel) ou correspond-elle à un vrai paiement fractionné (frais de fractionnement, frais de courtage payés en une fois la 1ère année…) ?
  _(Actuel : total annuel ÷ 12, arrondi au centime.)_
- [ ] Les **frais de courtage** et le **prix de la PJ** sont-ils identiques pour toutes les activités, et la PJ reste-t-elle toujours optionnelle ?
  _(Actuel : valeurs uniques, PJ optionnelle — désactivable globalement dans l'administration.)_

## Administration

- [ ] Qui modifiera la grille et faut-il des comptes nominatifs ?
  _(Actuel : protection par mot de passe unique via `ADMIN_PASSWORD`.)_
- [ ] Hébergement prévu pour le futur site : serveur Node classique ou plateforme serverless (Vercel…) ? Dans le second cas, il faudra stocker la grille dans une base de données plutôt que dans un fichier.

## Parcours & design

- [ ] Que faire des informations saisies (raison sociale, activité, CA) : envoi par e-mail, CRM, formulaire de rappel ? Faut-il collecter e-mail / téléphone ?
  _(Actuel : aucune donnée n'est transmise ; le bouton « Demander une étude personnalisée » ouvre un `mailto:` provisoire défini dans `config/calculator-config.ts`.)_
- [ ] Réponses de la FAQ à fournir : « Quels documents fournir pour obtenir un devis ? », « Suis-je couvert si je crée mon entreprise sans chantier réalisé ? », « En combien de temps reçoit-on son attestation ? ».
  _(Actuel : affichées « [À compléter : réponse] ». La réponse sur le coût est générée à partir de la grille.)_
- [ ] Adresse e-mail de contact à afficher dans le pied de page (« [À compléter : e-mail] » sur la maquette).
- [ ] Destinations des liens du menu et du pied de page (pages « Nos assurances », « Agents et courtiers », « À propos », mentions légales…) : pages du futur site ?
  _(Actuel : liens « # » centralisés dans `config/site-content.ts`. Le bouton « Demander mon étude décennale » ramène au simulateur.)_
- [ ] Ordre des étapes : la maquette commence par l'activité (« Étape 1 sur 4 »). La raison sociale est demandée en dernière étape, avant l'estimation : est-ce le bon choix, et faut-il aussi demander e-mail / téléphone à ce moment ?
