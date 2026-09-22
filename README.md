# LeadRadar

Outil de prospection locale : trouve des entreprises sans site web, génère un message de prospection adapté à leur secteur, et suit la relance jusqu'à la conversion.

Deux sources de leads :
- **Nouvelles créations (SIRENE)** — entreprises tout juste immatriculées, via l'API INSEE Sirene.
- **Par secteur (Google Maps)** — toutes les entreprises existantes d'une ville + d'un secteur d'activité, via Google Places.

Dans les deux cas, la présence web (site + téléphone) est vérifiée automatiquement (Google Places, avec repli sur OpenStreetMap).

## Fonctionnalités

- Recherche SIRENE par département/NAF/date de création, ou recherche libre par secteur + ville sur Google Maps
- 19 secteurs NAF prêts à l'emploi (restauration, artisans du bâtiment, coiffure/beauté, activités à réservation en ligne...), chacun avec un message de prospection adapté
- Détection automatique "a un site" / "pas de site" / "non vérifié"
- Génération de message de prospection personnalisé (objet + corps, éditable, envoi via Gmail en un clic)
- **Pipeline de suivi** : contacté → relance due (J+4) → répondu / gagné / perdu
- **Dashboard** : funnel de conversion, relances dues, gagnés récents — indépendant de la recherche en cours
- Filtres : département, présence web, statut du pipeline, masquer les établissements sans téléphone ni email connu
- Export CSV / Excel / messages de prospection groupés (.txt)
- Recherche ponctuelle par SIRET

## Architecture

```
Back/   API Express (TypeScript) — appelle INSEE Sirene et Google Places, ne expose jamais les clés au navigateur
Front/  App React + Vite (TypeScript) — découvre automatiquement le port du backend au démarrage
```

Le pipeline de suivi, les emails de contact et les préférences sont stockés dans le `localStorage` du navigateur (pas de base de données côté serveur).

## Prérequis

- Node.js 18+
- Une clé API [INSEE Sirene](https://www.sirene.fr/) (header `X-INSEE-Api-Key-Integration`)
- Une clé [Google Places API (New)](https://developers.google.com/maps/documentation/places/web-service/overview) — optionnelle mais recommandée : sans elle, seul OpenStreetMap est utilisé pour vérifier la présence web (résultats plus rares), et le mode "Par secteur (Maps)" est indisponible

## Installation

```bash
cd Back && npm install
cd ../Front && yarn install
```

Configure les clés dans `Back/.env` (voir `Back/.env.example`) :

```
INSEE_API_KEY=ta_cle_insee
GOOGLE_PLACES_API_KEY=ta_cle_google_places
```

## Lancer l'app

```bash
# Terminal 1
cd Back && npm run dev

# Terminal 2
cd Front && yarn dev
```

Ouvre l'URL affichée par Vite (http://localhost:5173 par défaut). Le backend choisit automatiquement le premier port libre à partir de 3001 ; le front le retrouve tout seul au chargement (voir `Front/src/lib/backendDiscovery.ts`).

## Limites connues

- L'API INSEE Sirene est limitée à 30 requêtes/minute — une recherche sur plusieurs NAF/départements à la fois peut prendre du temps si la limite est atteinte (le backend retente automatiquement).
- Google Places est un service payant (quota gratuit mensuel) ; sans clé, la vérification de présence web retombe sur OpenStreetMap, souvent incomplet pour les commerces récents.
- Aucune donnée n'est partagée entre navigateurs/appareils : le suivi (pipeline) vit dans le `localStorage` de chaque navigateur.
