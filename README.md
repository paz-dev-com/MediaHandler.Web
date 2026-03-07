# MediaHandler Web

A personal media collection manager built with **Angular 21**. Browse, track, and organize films and TV shows stored on your NAS, with TMDB integration for metadata and a bilingual (English/French) interface.

## Overview

MediaHandler Web is the frontend for the MediaHandler platform. It consumes the **MediaHandler.API** (.NET backend) and provides:

- **Collection browser** — Responsive card grid of all your films and TV shows with poster images, search, filters (type, genre, watched status), and pagination.
- **Media detail view** — Full metadata (title, overview, genres, ratings, poster/backdrop), NAS file paths with one-click copy-to-clipboard, and watch status tracking.
- **TV show tracking** — Season/episode browsing with per-episode and bulk per-season watched toggles, plus progress indicators (e.g. "5/12 episodes watched").
- **TMDB search & import** — Search The Movie Database by title, preview results, and import media with full metadata into your collection.
- **Wishlist** — Save films and TV shows you want to acquire, add notes, and mark them as acquired.
- **User profile** — View account info and switch preferred language (UI + TMDB metadata language).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, signals, `OnPush` change detection) |
| UI Components | PrimeNG 21, PrimeFlex 4 |
| Authentication | Auth0 via `@auth0/auth0-angular` (OIDC + PKCE, refresh tokens, `localStorage` cache) |
| i18n | `@jsverse/transloco` (English + French, runtime switching) |
| HTTP | Angular `HttpClient` with functional interceptors (auth token injection, global error handling) |
| Testing | Vitest |
| Styling | SCSS |

## Project Structure

```
src/
├── environments/           # Auto-generated (gitignored) — see "Environment Setup"
├── app/
│   ├── app.config.ts       # Root providers (Auth0, PrimeNG, Transloco, HTTP)
│   ├── app.routes.ts       # Top-level routing with lazy-loaded feature modules
│   ├── core/
│   │   ├── api/            # ApiService (typed GET/POST/PUT/DELETE), error interceptor
│   │   ├── auth/           # AuthService (Auth0 wrapper), guard, interceptor, callback
│   │   ├── i18n/           # Transloco HTTP loader
│   │   ├── layout/         # Collapsible sidebar navigation
│   │   └── services/       # Clipboard service
│   ├── features/
│   │   ├── collection/     # Collection page, filters, stats, media cards, empty state
│   │   ├── media-detail/   # Detail page, season list, episode items, NAS files
│   │   ├── tmdb-search/    # TMDB search page and result cards
│   │   ├── wishlist/       # Wishlist management
│   │   └── profile/        # User profile and language preferences
│   └── shared/
│       ├── models/         # TypeScript interfaces (Media, TvSeason, TvEpisode, User, Wishlist…)
│       ├── components/     # Reusable UI components (loading skeleton, error message…)
│       └── pipes/          # Shared pipes
├── assets/i18n/            # en.json, fr.json translation files
└── styles.scss             # Global styles
```

## Prerequisites

- **Node.js** 20+
- **npm** 11+
- **MediaHandler.API** backend running (default: `https://localhost:7001`)
- **Auth0 tenant** configured with an SPA application and an API audience
- **.NET User Secrets** configured for the `MediaHandler.API` project (or a `.env` file — see below)

## Environment Setup

Environment files are **auto-generated** by `scripts/generate-env.mjs` and are gitignored. The script runs automatically before `npm start` and `npm run build` via `prestart`/`prebuild` hooks.

### Configuration Sources (in priority order)

1. **`.env` file** at the project root (overrides everything)
2. **.NET User Secrets** from the `MediaHandler.API` project (ID: `74395325-16b4-4b59-8a0c-78c9b9afddc1`)

### Required Secrets

| .NET User Secret Key | `.env` Key | Description |
|----------------------|------------|-------------|
| `Okta:Domain` | `AUTH0_DOMAIN` | Auth0 tenant domain (e.g. `your-tenant.auth0.com`) |
| `Okta:ClientId` | `AUTH0_CLIENT_ID` | Auth0 SPA application Client ID |

> **Note:** The .NET secret keys are named `Okta:*` for backward compatibility with the backend configuration. The frontend uses Auth0.

### Optional Overrides

| `.env` Key | Default | Description |
|------------|---------|-------------|
| `API_BASE_URL` | `https://localhost:7001/api/v1` | Backend API base URL |
| `AUTH0_REDIRECT_URI` | `http://localhost:4200/auth/callback` | OAuth callback URL |
| `AUTH0_AUDIENCE` | Same as `API_BASE_URL` | Auth0 API audience identifier |
| `PROD_API_BASE_URL` | Same as `API_BASE_URL` | Production API URL |
| `PROD_AUTH0_REDIRECT_URI` | Same as `AUTH0_REDIRECT_URI` | Production callback URL |
| `PROD_AUTH0_AUDIENCE` | Same as `AUTH0_AUDIENCE` | Production audience |

### Example `.env`

```env
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
API_BASE_URL=https://localhost:7001/api/v1
AUTH0_AUDIENCE=https://localhost:7001/api/v1
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (auto-generates environment files)
npm start
```

The app will be available at `http://localhost:4200`. It redirects to Auth0 login on first access.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Generate env files + start dev server (`ng serve`) |
| `npm run build` | Generate env files + production build |
| `npm test` | Run unit tests with Vitest |
| `npm run watch` | Build in watch mode (development) |

## Authentication Flow

1. Unauthenticated users are redirected to **Auth0** Universal Login via the `authGuard`.
2. After login, Auth0 redirects to `/auth/callback` where the `AuthCallbackComponent` completes the code exchange.
3. On success, the user is redirected to the collection page and their profile is synced via `POST /api/v1/auth/sync`.
4. The `authInterceptor` attaches a Bearer token to all API requests automatically.
5. Tokens are cached in `localStorage` with silent refresh via refresh tokens.

## Routing

| Path | Feature | Auth Required |
|------|---------|:------------:|
| `/` | Collection (default landing page) | Yes |
| `/media/:id` | Media detail | Yes |
| `/tmdb-search` | TMDB search & import | Yes |
| `/wishlist` | Wishlist management | Yes |
| `/profile` | User profile & preferences | Yes |
| `/auth/callback` | Auth0 OIDC callback | No |

## API Integration

All HTTP calls go through `ApiService`, which wraps `HttpClient` and targets `environment.apiBaseUrl`. Responses follow the `ApiResponse<T>` envelope:

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: { totalCount?: number };
  errors?: { message: string }[];
}
```

### Key Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/media` | List collection (paginated, filterable) |
| `GET` | `/media/:id` | Get media details |
| `GET` | `/media/stats` | Collection statistics |
| `PUT` | `/media/:id/watched` | Toggle film watched status |
| `GET` | `/media/:id/seasons` | List TV seasons & episodes |
| `PUT` | `/media/:id/seasons/:sid/episodes/:eid/watched` | Toggle episode watched |
| `GET` | `/tmdb/search` | Search TMDB |
| `POST` | `/tmdb/import/:tmdbId` | Import media from TMDB |
| `POST` | `/auth/sync` | Sync user profile after login |
| `GET` | `/auth/me` | Get current user profile |
| `PUT` | `/auth/preferences` | Update user preferences |

## Internationalization

The app supports **English** (default) and **French** via Transloco. Translation files are in `src/assets/i18n/`. Language can be switched at any time from the profile page — this updates both the UI and the language used for TMDB metadata fetching.

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The production build applies file replacement (`environment.ts` → `environment.prod.ts`), tree-shaking, and bundle size budgets (initial: 1.5 MB warning / 2 MB error).
