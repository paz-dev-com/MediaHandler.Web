# Implementation Plan: Media Collection Manager

**Branch**: `001-media-collection-manager` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-media-collection-manager/spec.md`

## Summary

Build the Angular 21 web interface for managing a NAS-stored media collection. The application provides authenticated users with a card-grid collection browser (films & TV shows), media detail views with NAS file path copying, per-film and per-episode watch tracking, TMDB search/import, a personal wishlist, and bilingual UI (English/French). It consumes the existing MediaHandler.API (ASP.NET Core) backend via REST endpoints with Okta JWT authentication.

## Technical Context

**Language/Version**: TypeScript 5.9 / Angular 21.1  
**Primary Dependencies**: PrimeNG 21.x (UI components), PrimeFlex 4.x (responsive CSS utilities), `@okta/okta-auth-js` (authentication), `@jsverse/transloco` (i18n)  
**Storage**: N/A (frontend only — backend uses SQL Server)  
**Testing**: Vitest 4.0.8 with jsdom, Angular TestBed  
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Edge, Safari latest 2 versions), desktop and tablet viewports (360px–2560px)  
**Project Type**: web-application (SPA)  
**Performance Goals**: LCP < 2.5s, FID < 100ms, CLS < 0.1; initial page load < 2s on standard connection (SC-007)  
**Constraints**: Initial bundle < 500kB warning / 1MB error (constitution); lazy-loaded feature routes; OnPush change detection; standalone components only  
**Scale/Scope**: Single user to small group; ~5 feature areas; backend handles 100 req/min rate limit

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Research Check

| Principle                         | Status | Notes                                                                                                         |
| --------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability | PASS   | Standalone components, signals-first, strict TS, OnPush — all planned                                         |
| II. Testing Standards             | PASS   | Vitest already configured; unit tests planned for all services/components                                     |
| III. User Experience Consistency  | PASS   | PrimeNG/PrimeFlex for consistent responsive UI; loading states, error feedback, empty states specified        |
| IV. Performance Requirements      | PASS   | Lazy-loaded routes, tree-shakeable PrimeNG, signals state, OnPush detection, bundle budgets from angular.json |
| Technical Decision Framework      | PASS   | All dependency choices documented in research.md with bundle impact and alternatives                          |

### Post-Design Check

| Principle                         | Status | Notes                                                                                                                                                          |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability | PASS   | Each component < 200 lines; one service per domain; no `any` types; standalone only                                                                            |
| II. Testing Standards             | PASS   | Services, guards, interceptors, and interactive components all testable in isolation                                                                           |
| III. User Experience Consistency  | PASS   | Card grid with loading skeletons, empty state onboarding, error toasts, clipboard feedback, keyboard-navigable sidebar                                         |
| IV. Performance Requirements      | PASS   | 5 lazy-loaded feature chunks; PrimeNG tree-shaken; translation files lazy-loaded; only shell+auth in initial bundle                                            |
| Technical Decision Framework      | PASS   | 3 new dependencies justified (PrimeNG: UI components; okta-auth-js: mandatory auth; transloco: runtime i18n). PrimeFlex is CSS-only. All within bundle budget. |

**Gate result**: PASS — no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-media-collection-manager/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity models
├── quickstart.md        # Phase 1 output — setup & run guide
├── contracts/           # Phase 1 output — API integration contracts
│   └── api-contract.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main.ts
├── index.html
├── styles.scss                          # Global styles, PrimeNG theme import, PrimeFlex import
├── assets/
│   └── i18n/
│       ├── en.json                      # English translations
│       └── fr.json                      # French translations
├── environments/
│   ├── environment.ts                   # Dev config (API URL, Okta client ID)
│   └── environment.prod.ts             # Prod config
├── app/
│   ├── app.ts                           # Root component (shell: sidebar + router-outlet)
│   ├── app.html                         # Root template
│   ├── app.scss                         # Root styles
│   ├── app.config.ts                    # Providers: router, http, primeng, transloco, auth
│   ├── app.routes.ts                    # Top-level routes with lazy loading
│   ├── core/
│   │   ├── auth/
│   │   │   ├── auth.service.ts          # OktaAuth wrapper: login, logout, token, user signal
│   │   │   ├── auth.guard.ts            # Functional route guard
│   │   │   ├── auth.interceptor.ts      # Functional HTTP interceptor (Bearer token)
│   │   │   └── auth-callback.component.ts  # Okta OIDC redirect handler
│   │   ├── api/
│   │   │   ├── api.service.ts           # Base HTTP service (base URL, typed requests)
│   │   │   ├── api-response.model.ts    # ApiResponse<T>, PaginationMeta types
│   │   │   └── error.interceptor.ts     # Global HTTP error handler → toast
│   │   ├── i18n/
│   │   │   └── transloco-loader.ts      # Transloco HTTP loader for JSON files
│   │   ├── layout/
│   │   │   ├── sidebar.component.ts     # Navigation sidebar (collapsible)
│   │   │   ├── sidebar.component.html
│   │   │   └── sidebar.component.scss
│   │   └── services/
│   │       └── clipboard.service.ts     # Clipboard API wrapper
│   ├── features/
│   │   ├── collection/
│   │   │   ├── collection.routes.ts     # Child routes for collection
│   │   │   ├── collection-page.component.ts      # Card grid + filters + stats
│   │   │   ├── collection-page.component.html
│   │   │   ├── collection-page.component.scss
│   │   │   ├── media-card.component.ts            # Single media card (poster, title, type, watched badge)
│   │   │   ├── media-card.component.html
│   │   │   ├── media-card.component.scss
│   │   │   ├── collection-filters.component.ts    # Search, type, genre, watched filters
│   │   │   ├── collection-stats.component.ts      # Stats summary bar
│   │   │   ├── empty-collection.component.ts      # Onboarding prompt for empty state
│   │   │   └── collection.service.ts              # Collection state (media list, filters, pagination, stats)
│   │   ├── media-detail/
│   │   │   ├── media-detail.routes.ts
│   │   │   ├── media-detail-page.component.ts     # Full media detail view
│   │   │   ├── media-detail-page.component.html
│   │   │   ├── media-detail-page.component.scss
│   │   │   ├── media-files.component.ts           # NAS files list with copy path buttons
│   │   │   ├── season-list.component.ts           # Season accordion with episode list
│   │   │   ├── episode-item.component.ts          # Single episode with watch toggle
│   │   │   └── media-detail.service.ts            # Media detail + seasons state
│   │   ├── tmdb-search/
│   │   │   ├── tmdb-search.routes.ts
│   │   │   ├── tmdb-search-page.component.ts      # TMDB search + results grid
│   │   │   ├── tmdb-search-page.component.html
│   │   │   ├── tmdb-search-page.component.scss
│   │   │   ├── tmdb-result-card.component.ts      # Single TMDB result (import / add to wishlist)
│   │   │   └── tmdb-search.service.ts             # TMDB search state
│   │   ├── wishlist/
│   │   │   ├── wishlist.routes.ts
│   │   │   ├── wishlist-page.component.ts         # Wishlist grid with acquired/remove actions
│   │   │   ├── wishlist-page.component.html
│   │   │   ├── wishlist-page.component.scss
│   │   │   ├── wishlist-card.component.ts         # Single wishlist item card
│   │   │   └── wishlist.service.ts                # Wishlist state
│   │   └── profile/
│   │       ├── profile.routes.ts
│   │       ├── profile-page.component.ts          # User profile + language selector
│   │       ├── profile-page.component.html
│   │       ├── profile-page.component.scss
│   │       └── profile.service.ts                 # User profile state
│   └── shared/
│       ├── models/
│       │   ├── media.model.ts             # Media, MediaFile, MediaGenre interfaces
│       │   ├── tv.model.ts                # TvSeason, TvEpisode interfaces
│       │   ├── user.model.ts              # User, UserMedia, UserEpisode interfaces
│       │   ├── wishlist.model.ts          # WishlistItem interface
│       │   └── enums.ts                   # MediaType, UserRole enums
│       ├── components/
│       │   ├── loading-skeleton.component.ts  # Reusable loading placeholder
│       │   └── error-message.component.ts     # Reusable error display
│       └── pipes/
│           ├── file-size.pipe.ts          # Format bytes to human-readable size
│           └── tmdb-image.pipe.ts         # Construct full TMDB image URL from path
```

**Structure Decision**: Single-project Angular SPA. All feature areas are lazy-loaded modules under `src/app/features/`. Core infrastructure (auth, API, i18n, layout) lives in `src/app/core/`. Shared models, components, and pipes in `src/app/shared/`. This flat, straightforward structure matches the constitution's simplicity principle and avoids premature abstraction.

## Complexity Tracking

No constitution violations detected — this section is intentionally empty.
