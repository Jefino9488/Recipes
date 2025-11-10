# Recipe

Frontend client for the Recipe Platform — a focused single-page application built with Vite, React, and TypeScript to provide users with fast, accessible browsing and searching of culinary recipes. The frontend consumes a RESTful backend service that stores recipe data, provides paginated listing, and supports flexible search filters including numeric operators.

## Table of contents

- [Project overview](#project-overview)
- [Requirements](#requirements)
- [Install](#install)
- [Scripts](#scripts)
- [Development](#development)
- [Build & Preview](#build--preview)
- [Configuration & Backend integration](#configuration--backend-integration)
- [API contract](#api-contract)
- [Structure overview](#structure-overview)
- [Styling and UI](#styling-and-ui)
- [Linting](#linting)
- [Troubleshooting](#troubleshooting)
- [Extending / Notes for contributors](#extending--notes-for-contributors)

---

## Project overview

This repository contains a small single-page React application that:

- Lists recipes with paging
- Provides server-side search filters for title, cuisine, rating, total time, and calories
- Displays recipe detail in a right-side drawer with nutrition info
- Uses TypeScript and Vite for fast development and builds

The app expects the backend REST API to expose endpoints under `/api/recipes` (see API contract below). In development the Vite dev server proxies `/api` requests to `http://localhost:8081`.

---

## Requirements

- Node.js (recommended: 18+)
- npm or yarn
- (Optional) A running backend recipe server (default dev proxy → http://localhost:8081)

---

## Install

From the project root:

```bash
# using npm
npm install

# or using yarn
yarn
```

---

## Scripts

Available npm scripts (see `package.json`):

- `npm run dev` — start Vite dev server (HMR enabled)
- `npm run build` — TypeScript build (`tsc -b`) then Vite production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

---

## Development

Start the dev server:

```bash
npm run dev
```

By default, Vite will open on http://localhost:5173 (or another free port). The `vite.config.ts` file configures a proxy so that requests to `/api` are forwarded to `http://localhost:8081`:

```ts
// vite.config.ts (excerpt)
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8081",
      changeOrigin: true,
      secure: false,
    },
  },
},
```

Make sure your backend is running (or adjust the proxy target) to use the search/list functionality.

---

## Build & Preview

Create a production build:

```bash
npm run build
```

Preview the build locally:

```bash
npm run preview
# then open http://localhost:5173 (or printed preview URL)
```

Note: In production you must host the built static files and ensure the backend API is reachable by the browser at the same origin or via a configured base URL (see configuration below).

---

## Configuration & Backend integration

Development proxy (already set):
- Vite proxies `/api` → `http://localhost:8081`.

Production:
- The app's network code uses relative paths (e.g., `/api/recipes/search`) in `src/api.ts`. In production these relative paths require that the backend is reachable at the same origin or that you configure a reverse proxy (Nginx, Caddy, etc.) to forward `/api` to your backend service.
- If you need to point the frontend to a different backend origin at runtime, consider:
    - Building the app with a base URL replacement (e.g., define a global `VITE_API_BASE` and use `import.meta.env.VITE_API_BASE`), or
    - Making your deployment proxy handle `/api`.

Example change to use a Vite environment variable (optional):

```ts
// src/api.ts (example)
const API_BASE = import.meta.env.VITE_API_BASE ? import.meta.env.VITE_API_BASE : "";
const url = `${API_BASE}/api/recipes/search?${params.toString()}`;
```

Then set `VITE_API_BASE` at build time:
```bash
VITE_API_BASE="https://api.example.com" npm run build
```

---

## API contract (what frontend expects)

The frontend calls these endpoints:

- GET `/api/recipes?page=<n>&limit=<m>`
    - Returns paginated list of recipes (default sort: rating desc)

- GET `/api/recipes/search?title=&cuisine=&rating=&total_time=&calories=&page=&limit=`
    - Filters:
        - `title` — substring (case-insensitive)
        - `cuisine` — exact (case-insensitive)
        - `rating`, `total_time`, `calories` — numeric filters supporting operators like `>=`, `>`, `<`, `<=`, `=`. If no operator provided, equals assumed.
    - Example: `/api/recipes/search?rating=>=4&calories=<500&page=1&limit=15`

Response format expected by the frontend (TypeScript types in `src/api.ts`):

```ts
type Recipe = {
  id: number;
  cuisine?: string | null;
  title: string;
  rating?: number | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  description?: string | null;
  nutrients?: string | Nutrients | null;
  serves?: string | null;
  caloriesInt?: number | null;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages?: number;
  number?: number; // zero-based page number
}
```

If the backend returns a different shape, update `src/api.ts` and the UI accordingly.

---

## Structure overview

Key files/folders:

- index.html — app HTML entry
- package.json — scripts & deps
- vite.config.ts — Vite config + dev proxy
- src/
    - main.tsx — React entry
    - App.tsx — main app component (listing, filtering, drawer)
    - api.ts — network layer + TypeScript types
    - App.css / index.css — styles

---

## Styling and UI

- Visuals are defined in `src/App.css` (component styling) and `src/index.css` (global).
- The UI supports:
    - Page size selection (default options in App.tsx: `[15, 20, 25, 30, 40, 50]`)
    - Client-side controls that send filters to the backend (server-side filtering/paging)
    - A right-side drawer for recipe details

If you want to change page size defaults or the available choices, edit `PAGE_SIZES` in `src/App.tsx`.

---

## Linting

ESLint is configured in `eslint.config.js`. Run:

```bash
npm run lint
```

Consider enabling stricter type-checked ESLint rules as suggested in the repository README.

---

## Troubleshooting

- Empty list or fetch errors:
    - Ensure backend is running at the proxy target (`http://localhost:8081`) or adjust `vite.config.ts` proxy.
    - Check browser console & network tab to see full error response. The client will surface useful truncated error messages if the response is not JSON.

- CORS errors in dev:
    - Using the Vite dev proxy avoids CORS since requests are proxied from the dev server. If you bypass the proxy and call the backend directly from the browser, enable CORS on the backend or use a proper reverse proxy.

- Production API URL:
    - If your backend is hosted on a different origin for production, either serve the static files from the same origin as the backend or use a build-time environment variable (VITE_API_BASE) and update `src/api.ts` accordingly.
