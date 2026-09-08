# Cookin'

Real meals you actually make, turned into rank, rarity, and a collection worth showing off.

A gamified cooking app: stock a virtual pantry (barcode scan, photo, or manual add), find recipes filtered by what you actually own and want (macros, equipment), cook with clear step-by-step guidance, and confirm it with a live, camera-only photo. Every verified dish tracks how rare it actually is, what fraction of real users have ever made it, so rarity means something instead of being an arbitrary drop chance.

## Stack

- React 18 + React Router + Tailwind CSS
- Supabase (Postgres, Auth, Storage, Row-Level Security)
- Vite
- Framer Motion

## Getting started

Install dependencies:

```bash
npm install
```

Copy the environment example and fill in your own values:

```bash
cp .env.example .env
```

Start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Building for production

```bash
npm run build
npm run preview
```

## Environment variables

See `.env.example`. You'll need a Supabase project's URL and anon
public key (Project Settings -> API in the Supabase dashboard).

## Status

Identity and design tokens are locked (see `src/index.css`, `tailwind.config.js`, `src/components/FlameMark.jsx`). Core features (auth, pantry, recipes, verified cooking, ranks, social) are not built yet.
