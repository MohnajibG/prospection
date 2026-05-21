# Sirene Prospection (React + TS)

Petit front pour récupérer les **nouveaux restaurants / traiteurs** via l'API SIRENE.

## Prérequis
- Node 18+ / pnpm ou npm
- Une clé INSEE pour l'API SIRENE (header `X-INSEE-Api-Key-Integration`)

## Installation
```bash
npm install
npm run dev
```

Ouvre http://localhost:5173

## Utilisation
1. Colle ta clé API INSEE
2. Choisis le préfixe de code postal (ex: 75, 69, 13...)
3. Choisis "créés il y a X jours"
4. Clique **Trouver**
5. Clique **Export CSV**

## Où modifier la requête ?
`src/api/sirene.ts` → `buildQuery()`.

Tu peux ajouter:
- plusieurs départements
- une ville précise
- un filtre d'enseignes, etc.

## Limites connues
- L'API SIRENE ne donne pas toujours téléphone/email/site.
  Il faut enrichir ensuite (Google Maps, Insta, etc.).
