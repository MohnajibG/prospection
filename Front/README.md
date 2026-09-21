# LeadRadar (React + TS)

Petit front pour récupérer les **nouveaux restaurants / traiteurs** via l'API SIRENE, puis les enrichir automatiquement (téléphone, site web) via Google Places.

## Prérequis
- Node 18+ / pnpm ou npm
- Une clé INSEE pour l'API SIRENE (header `X-INSEE-Api-Key-Integration`)

## Installation
```bash
npm install
npm run dev
```

Ouvre http://localhost:5173 (le backend choisit automatiquement le premier port libre à partir de 3001 — le front s'y connecte tout seul, voir `vite.config.ts`).

## Utilisation
1. Choisis le préfixe de code postal (ex: 75, 69, 13...)
2. Choisis "créés il y a X jours"
3. Clique **Trouver les nouveaux établissements** — la recherche SIRENE puis la vérification de présence web (Google Places) se font automatiquement, à la suite.
4. Clique **Export CSV** ou **Excel**

## Prospection (messages)
- ⚙️ en haut à droite : renseigne tes coordonnées (nom, site, Malt, téléphone) — utilisées pour signer les messages.
- Chaque recherche est automatiquement vérifiée (présence web) via Google Places — le bouton **Revérifier la présence web** ne sert qu'à relancer une vérification manuelle (ex. après avoir ajouté un SIRET précis, ou pour retenter les établissements passés en erreur).
- Sur chaque lead marqué **🎯 Pas de site**, clique l'icône ✉️ pour générer un message de prospection personnalisé (adapté au secteur : restaurant, traiteur, bar...), à éditer et copier avant envoi.
- **Exporter messages** télécharge un CSV (objet + message) pour tous les leads sans site affichés — utile pour un mailing groupé.

## Où modifier la requête ?
`src/api/sirene.ts` → `buildQuery()`.

Tu peux ajouter:
- plusieurs départements
- une ville précise
- un filtre d'enseignes, etc.

## Enrichissement (téléphone / site web)
Chaque établissement est cherché automatiquement via **Google Places** (nom + adresse) dès la fin de la recherche SIRENE ; ce qu'il ne trouve pas retombe sur OpenStreetMap (gratuit, mais souvent vide pour un commerce très récent).

Clé requise dans `Back/.env` :
```
GOOGLE_PLACES_API_KEY=ta_cle
```
1. Crée un projet sur [Google Cloud Console](https://console.cloud.google.com/), active la facturation (carte requise, mais 5 000 recherches/mois restent gratuites).
2. Active l'API **"Places API (New)"**.
3. Crée une clé API et colle-la dans `Back/.env`.

Sans clé, seul OSM est utilisé (comportement de secours).

## Limites connues
- L'API SIRENE ne donne pas toujours téléphone/email/site — d'où l'enrichissement ci-dessus.
