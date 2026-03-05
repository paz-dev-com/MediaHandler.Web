# Tasks: Media Collection Manager

**Input**: Design documents from `/specs/001-media-collection-manager/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-contract.md, quickstart.md

**Tests**: Not included — no explicit test request in the feature specification. Add test tasks separately if TDD is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths and cross-references to design documents in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Install dependencies and create baseline configuration files

- [ ] T001 Install all project dependencies: `primeng`, `@primeuix/themes`, `primeflex`, `@okta/okta-auth-js`, `@jsverse/transloco` — ref: [quickstart.md § Install Dependencies](quickstart.md), [research.md § 1–3](research.md)
- [ ] T002 [P] Create environment files `src/environments/environment.ts` and `src/environments/environment.prod.ts` with API base URL and Okta configuration — ref: [quickstart.md § Environment Configuration](quickstart.md)
- [ ] T003 [P] Configure global styles in `src/styles.scss`: import PrimeNG theme preset (Aura via `@primeuix/themes`), import PrimeFlex CSS utilities — ref: [research.md § 1 (PrimeNG + PrimeFlex)](research.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented — shared models, authentication, API layer, i18n, layout shell, and reusable utilities

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Shared Models

- [ ] T004 [P] Create shared enums (`MediaType`, `UserRole`) in `src/app/shared/models/enums.ts` — ref: [data-model.md § Enums](data-model.md)
- [ ] T005 [P] Create API response envelope types (`ApiResponse<T>`, `PaginationMeta`, `CollectionStats`, `ApiError`) in `src/app/core/api/api-response.model.ts` — ref: [data-model.md § API Response Envelope](data-model.md), [contracts/api-contract.md § Error Response Format](contracts/api-contract.md)
- [ ] T006 [P] Create Media model interfaces (`Media`, `MediaGenre`, `MediaFile`) in `src/app/shared/models/media.model.ts` — ref: [data-model.md § Media, MediaGenre, MediaFile](data-model.md)
- [ ] T007 [P] Create TV model interfaces (`TvSeason`, `TvEpisode`) in `src/app/shared/models/tv.model.ts` — ref: [data-model.md § TvSeason, TvEpisode](data-model.md)
- [ ] T008 [P] Create User model interfaces (`User`, `UserMedia`, `UserEpisode`) in `src/app/shared/models/user.model.ts` — ref: [data-model.md § User, UserMedia, UserEpisode](data-model.md)
- [ ] T009 [P] Create WishlistItem interface in `src/app/shared/models/wishlist.model.ts` — ref: [data-model.md § WishlistItem](data-model.md)

### Core API & Auth Infrastructure

- [ ] T010 Create base API service (`apiBaseUrl` from environment, typed GET/POST/PUT/DELETE helpers) in `src/app/core/api/api.service.ts` — ref: [research.md § 4 (HTTP Client)](research.md), [contracts/api-contract.md header (base URL /api/v1/)](contracts/api-contract.md)
- [ ] T011 [P] Create AuthService wrapping `OktaAuth` instance (login, logout, token management, `isAuthenticated` signal, `user` signal, profile sync via POST /auth/sync) in `src/app/core/auth/auth.service.ts` — ref: [research.md § 2 (Okta)](research.md), [contracts/api-contract.md § POST /auth/sync, GET /auth/me](contracts/api-contract.md)
- [ ] T012 [P] Create functional `authGuard` for route protection in `src/app/core/auth/auth.guard.ts` — redirects unauthenticated users to Okta login — ref: [research.md § 2](research.md), [spec.md FR-018](spec.md)
- [ ] T013 [P] Create functional `authInterceptor` for Bearer token injection in `src/app/core/auth/auth.interceptor.ts` — ref: [research.md § 2](research.md), [contracts/api-contract.md header (JWT Bearer auth)](contracts/api-contract.md)
- [ ] T014 [P] Create auth callback component (Okta OIDC redirect handler) in `src/app/core/auth/auth-callback.component.ts` — ref: [research.md § 2 (callback route)](research.md)
- [ ] T015 [P] Create error interceptor (global HTTP error handler → PrimeNG Toast) in `src/app/core/api/error.interceptor.ts` — handles 400/401/403/404/409/429/500 status codes — ref: [contracts/api-contract.md § Error Response Format, HTTP status codes](contracts/api-contract.md), [spec.md FR-021](spec.md)

### Internationalization

- [ ] T016 [P] Create Transloco HTTP loader for lazy-loaded JSON translation files in `src/app/core/i18n/transloco-loader.ts` — ref: [research.md § 3 (Transloco)](research.md)
- [ ] T017 [P] Create English translation file `src/assets/i18n/en.json` with keys for: sidebar navigation labels, common UI (loading, error, empty state, buttons), filter labels, page titles — ref: [research.md § 3](research.md), [spec.md FR-020](spec.md)
- [ ] T018 [P] Create French translation file `src/assets/i18n/fr.json` with same keys as en.json — ref: [research.md § 3](research.md), [spec.md FR-020](spec.md)

### App Configuration

- [ ] T019 Configure `src/app/app.config.ts` with all root providers: `provideRouter`, `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch())`, `providePrimeNG({ theme: { preset: Aura } })`, `provideTransloco(...)` — ref: [research.md § 1–4](research.md), [quickstart.md § Key Configuration Files](quickstart.md)

### Layout Shell

- [ ] T020 Create sidebar navigation component (collapsible vertical sidebar with icons and labels for: Collection, TMDB Search, Wishlist, Profile) in `src/app/core/layout/sidebar.component.ts` + `.html` + `.scss` — ref: [spec.md FR-023](spec.md), [plan.md § Project Structure (core/layout/)](plan.md)
- [ ] T021 Configure root component shell (`src/app/app.ts` + `src/app/app.html` + `src/app/app.scss`) with sidebar + `<router-outlet>` layout — ref: [plan.md § Project Structure](plan.md)
- [ ] T022 Configure top-level routes with lazy loading and `authGuard` in `src/app/app.routes.ts`: `/` → collection, `/media/:id` → detail, `/tmdb-search` → search, `/wishlist` → wishlist, `/profile` → profile, `/auth/callback` → callback (eager) — ref: [research.md § 6 (Routing & Lazy Loading)](research.md), [plan.md § Project Structure](plan.md)

### Shared Utilities

- [ ] T023 [P] Create clipboard service (`navigator.clipboard.writeText()` wrapper with success/failure feedback) in `src/app/core/services/clipboard.service.ts` — ref: [research.md § 7 (Clipboard API)](research.md)
- [ ] T024 [P] Create loading skeleton component (reusable card/list placeholder animation) in `src/app/shared/components/loading-skeleton.component.ts` — ref: [spec.md edge cases (loading state)](spec.md)
- [ ] T025 [P] Create error message component (reusable error display with retry action) in `src/app/shared/components/error-message.component.ts` — ref: [spec.md FR-021](spec.md)
- [ ] T026 [P] Create TMDB image pipe (constructs full URL from TMDB path + size: `https://image.tmdb.org/t/p/{size}{path}`) in `src/app/shared/pipes/tmdb-image.pipe.ts` — ref: [contracts/api-contract.md § TMDB Image URLs](contracts/api-contract.md)
- [ ] T027 [P] Create file size pipe (formats bytes to human-readable size) in `src/app/shared/pipes/file-size.pipe.ts` — ref: [data-model.md § MediaFile.fileSizeBytes](data-model.md)

**Checkpoint**: Foundation ready — all shared models, auth, API layer, i18n, layout shell, and utilities in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse Media Collection (Priority: P1) 🎯 MVP

**Goal**: Authenticated users see a responsive card grid of all their media with poster images, titles, type badges, and watched indicators. They can search by title, filter by type/genre/watched status, paginate results, and view collection statistics.

**Independent Test**: Log in → collection page loads → card grid displays media → search/filter/paginate all work → stats bar shows counts. Verifiable using [spec.md § User Story 1 acceptance scenarios 1–7](spec.md).

### Implementation

- [ ] T028 [P] [US1] Create collection service (media list signal, filter signals, pagination signal, stats signal; API calls: `GET /media` with query params, `GET /media/stats`) in `src/app/features/collection/collection.service.ts` — ref: [contracts/api-contract.md § GET /media, GET /media/stats](contracts/api-contract.md), [research.md § 5 (State Management)](research.md), [data-model.md § Media, CollectionStats](data-model.md)
- [ ] T029 [P] [US1] Create media card component (poster via `tmdbImage` pipe, title, type badge, watched indicator from `userMedia.isWatched`) in `src/app/features/collection/media-card.component.ts` + `.html` + `.scss` — ref: [spec.md US1 scenario 1, FR-001](spec.md), [data-model.md § Media, UserMedia](data-model.md)
- [ ] T030 [P] [US1] Create collection filters component (search text input, type dropdown: Film/TvShow, genre dropdown, watched/unwatched toggle) in `src/app/features/collection/collection-filters.component.ts` — ref: [spec.md US1 scenarios 2–5, FR-002](spec.md), [contracts/api-contract.md § GET /media query parameters](contracts/api-contract.md)
- [ ] T031 [P] [US1] Create collection stats component (total media, films, TV shows, watched, unwatched counts) in `src/app/features/collection/collection-stats.component.ts` — ref: [spec.md US1 scenario 7, FR-003](spec.md), [data-model.md § CollectionStats](data-model.md)
- [ ] T032 [P] [US1] Create empty collection onboarding component (friendly message + CTA to navigate to TMDB search) in `src/app/features/collection/empty-collection.component.ts` — ref: [spec.md FR-024, edge cases (empty collection)](spec.md)
- [ ] T033 [US1] Create collection page component (assembles card grid with PrimeNG DataView or responsive grid, integrates filters, stats bar, pagination with PrimeNG Paginator, and empty state) in `src/app/features/collection/collection-page.component.ts` + `.html` + `.scss` — ref: [spec.md US1 all scenarios](spec.md), [plan.md § Project Structure (features/collection/)](plan.md), [research.md § 1 (PrimeNG DataView)](research.md)
- [ ] T034 [US1] Create collection feature routes in `src/app/features/collection/collection.routes.ts` — ref: [research.md § 6](research.md)

**Checkpoint**: User Story 1 complete — users can browse, search, filter, and paginate their full media collection. This is the **MVP milestone**.

---

## Phase 4: User Story 2 — View Media Details & NAS File Access (Priority: P1)

**Goal**: Users click a media card to see full metadata (title, overview, release date, runtime, genres, rating, poster, backdrop), browse NAS file paths with copy-to-clipboard, and view TV show seasons/episodes.

**Independent Test**: Click any media card → detail page loads with full metadata → NAS files listed → copy a path → for TV shows: seasons and episodes display. Verifiable using [spec.md § User Story 2 acceptance scenarios 1–4](spec.md).

### Implementation

- [ ] T035 [P] [US2] Create media detail service (media detail signal, seasons signal; API calls: `GET /media/{id}`, `GET /media/{mediaId}/seasons`) in `src/app/features/media-detail/media-detail.service.ts` — ref: [contracts/api-contract.md § GET /media/{id}, GET /media/{mediaId}/seasons](contracts/api-contract.md), [data-model.md § Media, TvSeason](data-model.md)
- [ ] T036 [P] [US2] Create media files component (list of NAS files with path, size via `fileSize` pipe, format; copy-path button using `ClipboardService` with PrimeNG Toast feedback) in `src/app/features/media-detail/media-files.component.ts` — ref: [spec.md US2 scenarios 2–3, FR-005, FR-006](spec.md), [data-model.md § MediaFile](data-model.md), [research.md § 7 (Clipboard)](research.md)
- [ ] T037 [P] [US2] Create episode item component (episode number, name, air date, runtime; read-only watched indicator from `userEpisode.isWatched`) in `src/app/features/media-detail/episode-item.component.ts` — ref: [spec.md US2 scenario 4](spec.md), [data-model.md § TvEpisode, UserEpisode](data-model.md)
- [ ] T038 [US2] Create season list component (PrimeNG Accordion of seasons, each expanding to episode list via `episode-item`; displays season name, air date, episode count) in `src/app/features/media-detail/season-list.component.ts` — ref: [spec.md US2 scenario 4, FR-008](spec.md), [data-model.md § TvSeason](data-model.md)
- [ ] T039 [US2] Create media detail page component (full layout: poster/backdrop header, metadata sidebar, genres, rating, overview, media-files section, season-list section for TV shows) in `src/app/features/media-detail/media-detail-page.component.ts` + `.html` + `.scss` — ref: [spec.md US2 scenario 1, FR-004](spec.md), [data-model.md § Media](data-model.md), [plan.md § Project Structure (features/media-detail/)](plan.md)
- [ ] T040 [US2] Create media detail feature routes (`/media/:id`) in `src/app/features/media-detail/media-detail.routes.ts` — ref: [research.md § 6](research.md)

**Checkpoint**: User Stories 1 and 2 complete — users can browse their collection and drill into any media for full details and NAS file access.

---

## Phase 5: User Story 6 — User Profile & Language (Priority: P1)

**Goal**: Authenticated users can view their profile (display name, email, role) and switch the application language between English and French at runtime.

**Independent Test**: Navigate to profile → see user info → change language → UI switches immediately → preference persists via API. Verifiable using [spec.md § User Story 6 acceptance scenarios 3–4](spec.md).

### Implementation

- [ ] T041 [P] [US6] Create profile service (user profile signal, language update; API calls: `GET /auth/me`, `PUT /auth/preferences`) in `src/app/features/profile/profile.service.ts` — ref: [contracts/api-contract.md § GET /auth/me, PUT /auth/preferences](contracts/api-contract.md), [data-model.md § User](data-model.md)
- [ ] T042 [US6] Create profile page component (display name, email, role display; PrimeNG Dropdown language selector triggering `TranslocoService.setActiveLang()` + API preference update) in `src/app/features/profile/profile-page.component.ts` + `.html` + `.scss` — ref: [spec.md US6 scenarios 3–4, FR-019, FR-020](spec.md), [research.md § 3 (Transloco runtime switching)](research.md)
- [ ] T043 [US6] Create profile feature routes in `src/app/features/profile/profile.routes.ts` — ref: [research.md § 6](research.md)

**Checkpoint**: All P1 user stories complete — users can browse collection, view details, access NAS files, and manage their profile/language.

---

## Phase 6: User Story 3 — Track Watch Status (Priority: P2)

**Goal**: Users can toggle watched/unwatched on films (from collection list or detail page), toggle individual episode watch status, mark entire seasons as watched/unwatched in one action, and see per-season watch progress.

**Independent Test**: Toggle a film watched from collection → badge updates → toggle from detail page → same result → mark episodes watched → season progress updates → batch-toggle a season → all episodes update. Verifiable using [spec.md § User Story 3 acceptance scenarios 1–7](spec.md).

### Implementation

- [ ] T044 [US3] Add film watched toggle button to media card component (click handler calls `PUT /media/{id}/watched` via collection service, optimistic UI update of watched badge) in `src/app/features/collection/media-card.component.ts` — ref: [spec.md US3 scenario 1, FR-007](spec.md), [contracts/api-contract.md § PUT /media/{id}/watched](contracts/api-contract.md), [data-model.md § UserMedia state transition](data-model.md)
- [ ] T045 [US3] Add watched toggle button to media detail page (mark as watched/unwatched with date display, calls `PUT /media/{id}/watched` via media detail service) in `src/app/features/media-detail/media-detail-page.component.ts` — ref: [spec.md US3 scenarios 2–3, FR-007](spec.md), [contracts/api-contract.md § PUT /media/{id}/watched](contracts/api-contract.md)
- [ ] T046 [US3] Add episode watch toggle to episode item component (checkbox/toggle calling `PUT .../episodes/{episodeId}/watched` via media detail service) in `src/app/features/media-detail/episode-item.component.ts` — ref: [spec.md US3 scenario 4, FR-010](spec.md), [contracts/api-contract.md § PUT /media/{mediaId}/seasons/{seasonId}/episodes/{episodeId}/watched](contracts/api-contract.md)
- [ ] T047 [US3] Add season batch toggle to season list component header ("Mark season as watched/unwatched" button; iterates all episodes in the season calling the per-episode endpoint via `forkJoin`, updates `watchedCount` on completion) in `src/app/features/media-detail/season-list.component.ts` — ref: [spec.md US3 scenarios 6–7, FR-011](spec.md), [contracts/api-contract.md § PUT .../episodes/{episodeId}/watched](contracts/api-contract.md) (no batch endpoint — iterate per episode)
- [ ] T048 [US3] Add season watch progress display ("X/Y episodes watched" text + visual progress indicator; highlight fully-completed seasons) to season list component in `src/app/features/media-detail/season-list.component.ts` — ref: [spec.md US3 scenarios 4–5, FR-009](spec.md), [data-model.md § TvSeason.watchedCount, TvSeason.episodeCount](data-model.md)

**Checkpoint**: Watch tracking fully functional — films togglable from list and detail, episodes togglable individually, seasons batch-togglable, progress visible per season.

---

## Phase 7: User Story 4 — Search & Add Media from TMDB (Priority: P2)

**Goal**: Users search TMDB by title, see results with posters and metadata, and import media into their collection with deduplication handling.

**Independent Test**: Navigate to TMDB search → enter query → results display → click Import → media appears in collection (or duplicate notification). Verifiable using [spec.md § User Story 4 acceptance scenarios 1–4](spec.md).

### Implementation

- [ ] T049 [P] [US4] Create TMDB search service (search query signal, results signal, loading signal; API calls: `GET /tmdb/search?query=...&language=...`, `POST /tmdb/import/{tmdbId}?mediaType=...`) in `src/app/features/tmdb-search/tmdb-search.service.ts` — ref: [contracts/api-contract.md § TMDB Endpoints](contracts/api-contract.md), [data-model.md § TmdbSearchResult (see api-contract.md)](data-model.md), [research.md § 5](research.md)
- [ ] T050 [P] [US4] Create TMDB result card component (poster via `tmdbImage` pipe, title, release date, overview, `mediaType` badge, "Import" button) in `src/app/features/tmdb-search/tmdb-result-card.component.ts` + `.html` + `.scss` — ref: [spec.md US4 scenario 1](spec.md), [contracts/api-contract.md § TmdbSearchResult](contracts/api-contract.md)
- [ ] T051 [US4] Create TMDB search page component (search input with debounce, results grid of `tmdb-result-card` components, import handler with deduplication feedback via PrimeNG Toast, loading/empty states) in `src/app/features/tmdb-search/tmdb-search-page.component.ts` + `.html` + `.scss` — ref: [spec.md US4 all scenarios, FR-012, FR-013](spec.md), [contracts/api-contract.md § GET /tmdb/search, POST /tmdb/import](contracts/api-contract.md)
- [ ] T052 [US4] Create TMDB search feature routes in `src/app/features/tmdb-search/tmdb-search.routes.ts` — ref: [research.md § 6](research.md)

**Checkpoint**: TMDB search and import functional — users can find media on TMDB and add it to their collection.

---

## Phase 8: User Story 5 — Manage Wishlist (Priority: P3)

**Goal**: Users add TMDB search results to a personal wishlist, view it with pagination, mark items as acquired, and remove items.

**Independent Test**: From TMDB search → add to wishlist → navigate to wishlist → item appears → mark acquired → badge updates → remove item → gone. Verifiable using [spec.md § User Story 5 acceptance scenarios 1–5](spec.md).

### Implementation

- [ ] T053 [P] [US5] Create wishlist service (wishlist items signal, pagination signal; API calls: `GET /wishlist`, `POST /wishlist`, `PUT /wishlist/{id}/acquired`, `DELETE /wishlist/{id}`) in `src/app/features/wishlist/wishlist.service.ts` — ref: [contracts/api-contract.md § Wishlist Endpoints](contracts/api-contract.md), [data-model.md § WishlistItem](data-model.md), [research.md § 5](research.md)
- [ ] T054 [P] [US5] Create wishlist card component (poster via `tmdbImage` pipe, title, release date, notes, acquired badge with date, "Mark acquired" and "Remove" action buttons) in `src/app/features/wishlist/wishlist-card.component.ts` + `.html` + `.scss` — ref: [spec.md US5 scenarios 2–3](spec.md), [data-model.md § WishlistItem, state transitions](data-model.md)
- [ ] T055 [US5] Add "Add to wishlist" button to TMDB result card component (calls `POST /wishlist` via wishlist service, deduplication feedback for existing items) in `src/app/features/tmdb-search/tmdb-result-card.component.ts` — ref: [spec.md US5 scenario 1, scenario 4, FR-014](spec.md), [contracts/api-contract.md § POST /wishlist (409 on duplicate)](contracts/api-contract.md)
- [ ] T056 [US5] Create wishlist page component (paginated grid of `wishlist-card` components using PrimeNG Paginator, empty state message, acquired/remove action handlers) in `src/app/features/wishlist/wishlist-page.component.ts` + `.html` + `.scss` — ref: [spec.md US5 all scenarios, FR-015, FR-016](spec.md), [contracts/api-contract.md § GET /wishlist](contracts/api-contract.md)
- [ ] T057 [US5] Create wishlist feature routes in `src/app/features/wishlist/wishlist.routes.ts` — ref: [research.md § 6](research.md)

**Checkpoint**: All user stories complete — full feature set delivered.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validation, completeness, and quality checks that affect multiple user stories

- [ ] T058 [P] Finalize and complete all translation keys in `src/assets/i18n/en.json` and `src/assets/i18n/fr.json` — ensure every user-facing string across all features has both EN and FR translations — ref: [spec.md FR-020](spec.md)
- [ ] T059 [P] Verify responsive layout across breakpoints (360px–2560px) on collection grid, detail page, search results, wishlist, sidebar collapse — ref: [spec.md FR-022](spec.md), [plan.md § Technical Context (target viewport range)](plan.md)
- [ ] T060 [P] Verify bundle budget compliance: initial bundle < 500kB warning / < 1MB error — ref: [plan.md § Technical Context (Constraints)](plan.md)
- [ ] T061 [P] Perform accessibility review: keyboard navigation on sidebar and card grid, focus management on route changes, ARIA labels on interactive elements (toggles, copy buttons, filters)
- [ ] T062 Run [quickstart.md](quickstart.md) validation end-to-end: fresh `npm install` → `npm start` → `npm test` → verify all instructions are still accurate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — can start immediately after
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1
- **US6 (Phase 5)**: Depends on Phase 2 — can run in parallel with US1 and US2
- **US3 (Phase 6)**: Depends on Phase 2 + US1 (media-card.component) + US2 (episode-item, season-list components) — must wait for both P1 stories
- **US4 (Phase 7)**: Depends on Phase 2 — can run in parallel with US1/US2/US6
- **US5 (Phase 8)**: Depends on Phase 2 + US4 (tmdb-result-card to add wishlist button) — must wait for US4
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational) ──[BLOCKS ALL]──┐
       ├── US1 (Phase 3: Collection)  ────────┤
       ├── US2 (Phase 4: Detail)      ────────┼──→ US3 (Phase 6: Watch Tracking)
       ├── US6 (Phase 5: Profile)             │
       └── US4 (Phase 7: TMDB Search) ───────┘──→ US5 (Phase 8: Wishlist)
                                                         │
                                              Phase 9 (Polish) ←── all stories
```

### Within Each User Story

1. Service (state + API calls) before components
2. Child/leaf components before parent/page components
3. Page component before routes
4. All [P]-marked tasks within a phase can run in parallel

---

## Parallel Opportunities

### Phase 2: Foundational

```
Parallel batch 1 — all models (T004–T009): no dependencies between them
Parallel batch 2 — core services (T010–T015) + i18n (T016–T018) + shared utilities (T023–T027): all independent
Sequential: T019 (app config — depends on auth + i18n + API service)
Sequential: T020 → T021 → T022 (layout shell, then root component, then routes)
```

### Phase 3: US1

```
Parallel: T028 (service), T029 (media-card), T030 (filters), T031 (stats), T032 (empty state)
Sequential: T033 (collection page — composes all child components)
Sequential: T034 (routes)
```

### Phase 4: US2

```
Parallel: T035 (service), T036 (media-files), T037 (episode-item)
Sequential: T038 (season-list — uses episode-item)
Sequential: T039 (detail page — composes all child components)
Sequential: T040 (routes)
```

### Phases 3 + 4 + 5 can run in parallel

US1, US2, and US6 have no cross-dependencies — they can be implemented simultaneously.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 — Browse Collection
4. **STOP and VALIDATE**: Log in, verify card grid loads, search/filter/paginate work, stats display
5. Deploy/demo if ready — users can already browse their full collection

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. **Add US1 (Collection)** → Test independently → Deploy/Demo (**MVP!**)
3. **Add US2 (Detail + NAS)** → Test independently → Deploy/Demo
4. **Add US6 (Profile)** → Test independently → Deploy/Demo (all P1s done)
5. **Add US3 (Watch Tracking)** → Test independently → Deploy/Demo
6. **Add US4 (TMDB Search)** → Test independently → Deploy/Demo
7. **Add US5 (Wishlist)** → Test independently → Deploy/Demo (all stories done)
8. Polish → Final validation

### Parallel Strategy (2 developers)

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: US1 → US3 (US3 enhances US1 components)
   - **Developer B**: US2 → US6 → US4 → US5
3. Polish phase together

---

## FR Traceability

| FR | Task(s) | User Story |
|----|---------|------------|
| FR-001 Paginated card grid | T029, T033 | US1 |
| FR-002 Filtering | T030, T028 | US1 |
| FR-003 Collection stats | T031, T028 | US1 |
| FR-004 Media detail view | T039 | US2 |
| FR-005 NAS file paths | T036 | US2 |
| FR-006 Copy NAS path | T036, T023 | US2 |
| FR-007 Toggle film watched | T044, T045 | US3 |
| FR-008 Seasons/episodes display | T038, T037 | US2 |
| FR-009 Season progress | T048 | US3 |
| FR-010 Toggle episode watched | T046 | US3 |
| FR-011 Season batch toggle | T047 | US3 |
| FR-012 TMDB search | T051, T049 | US4 |
| FR-013 TMDB import | T051, T049 | US4 |
| FR-014 Add to wishlist | T055 | US5 |
| FR-015 Wishlist display | T056, T053 | US5 |
| FR-016 Wishlist acquired/remove | T056, T054 | US5 |
| FR-017 Okta auth + sync | T011, T014 | Foundational |
| FR-018 Redirect unauthenticated | T012 | Foundational |
| FR-019 Language preference | T042 | US6 |
| FR-020 Bilingual EN/FR | T016–T018, T042, T058 | Foundational + US6 + Polish |
| FR-021 Error handling | T015, T025 | Foundational |
| FR-022 Responsive design | T059 | Polish |
| FR-023 Sidebar navigation | T020 | Foundational |
| FR-024 Empty state onboarding | T032 | US1 |

---

## Notes

- [P] tasks = different files, no shared dependencies — safe to implement simultaneously
- [Story] label maps each task to a specific user story for traceability
- Each user story is independently completable and testable at its checkpoint
- Cross-references link to the specific section of each design document where the implementer can find detailed specifications
- Season batch toggle (T047) has no dedicated batch API endpoint — implementation must iterate per-episode using `forkJoin` on the single-episode endpoint
- Translation files (T017, T018) start with structural keys in Phase 2; final completeness pass in Phase 9 (T058) after all UI is built
- Commit after each task or logical group; stop at any checkpoint to validate independently
