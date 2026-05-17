# Implementation Plan: Application Enhancements

**Branch**: `feature/006-app-enhancements` | **Date**: 2025-07-24 | **Spec**: `specs/006-app-enhancements/spec.md`
**Input**: Feature specification from `specs/006-app-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Multi-faceted enhancement to the MediaHandler.Web application covering 8 user stories across 3 priority tiers. Core changes: (1) fix icon visibility across all pages (P1 CSS/theming bug), (2) complete i18n coverage with locale-aware date formatting and language-aware TMDB scanning (P1), (3) admin library root folder selection via API-sourced dropdown (P2), (4) wishlist indicator on TMDB search results (P2), (5) TV show production status and missing season detection (P2), (6) profile picture upload with auth provider default fallback (P3), (7) user info display in navigation menu (P3), (8) frontend warning cleanup (P3). Requires backend API changes: extend `StartScanRequest`/`StartScanCommand` with `language`, extend `MediaDto` with `status`/`numberOfSeasons`, extend `User`/`UserDto` with `profilePicturePath`, add profile picture upload/delete endpoints.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21 (standalone, signals-first, OnPush)  
**Primary Dependencies**: PrimeNG 21.x (`@primeuix/themes/aura`), `@angular/cdk` 21.x, `@angular/animations`, Transloco 8.x (EN/FR), Auth0 Angular 2.x  
**Storage**: Backend API (MediaHandler.API, .NET 10, EF Core, SQLite/PostgreSQL); profile picture file storage server-side  
**Testing**: Vitest (unit + component tests)  
**Target Platform**: Web (modern browsers — Chrome 111+, Firefox 115+, Safari 16.4+, Edge 111+)  
**Project Type**: Web application (SPA) with companion backend API  
**Performance Goals**: 60fps animations, Lighthouse 90+ desktop, LCP < 2.5s, CLS < 0.1  
**Constraints**: Bundle budget 500kB warning / 1MB error (initial); 4kB/8kB component styles; no new third-party dependencies expected; profile picture uploads ≤ 2MB (JPEG, PNG, WebP)  
**Scale/Scope**: ~8 user stories, ~15 components modified/created, ~3 services modified, ~2 new pipes, API changes in 4 endpoints + 2 new endpoints

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status  | Notes                                                                                                                                                                             |
| ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Single Responsibility**    | ✅ PASS | Each modification targets a single concern. New `LocaleDatePipe`, `AdminFilesService`, profile upload methods are each single-purpose. No component expected to exceed 200 lines. |
| **I. Angular Signals-First**    | ✅ PASS | All new state (wishlist lookup set, profile picture URL, root folder locations, missing seasons) uses signals. Existing signal patterns preserved.                                |
| **I. Strict Typing**            | ✅ PASS | TypeScript strict mode remains enabled. New model fields (`status`, `numberOfSeasons`, `profilePicturePath`) have explicit types. No `any` usage.                                 |
| **I. Prettier Compliance**      | ✅ PASS | No config changes. All new code follows 100-char, single-quote format.                                                                                                            |
| **I. Standalone Components**    | ✅ PASS | All new/modified components remain standalone. No NgModules introduced.                                                                                                           |
| **I. Reactive Patterns**        | ✅ PASS | File upload uses Observable pattern with `HttpClient`. Wishlist cross-reference uses computed signals. No manual subscriptions without cleanup.                                   |
| **II. Unit Tests Required**     | ✅ PASS | New `LocaleDatePipe`, profile upload service methods, wishlist indicator logic, missing season computation all require unit tests. 80%+ coverage target.                          |
| **II. Component Tests**         | ✅ PASS | Profile picture upload interactions, library root dialog root selection, wishlist indicator rendering, TV show status badge display require component tests.                      |
| **III. Responsive Design**      | ✅ PASS | Profile picture upload, nav user info, library root dialog all follow mobile-first SCSS. Nav user info has compact mobile variant.                                                |
| **III. Loading States**         | ✅ PASS | Profile picture upload shows progress/spinner. Root folder dropdown shows loading state while fetching locations.                                                                 |
| **III. Error Feedback**         | ✅ PASS | Profile picture upload validates file type/size with clear error messages. No technical details exposed.                                                                          |
| **III. Accessibility Baseline** | ✅ PASS | Profile picture upload has `alt` attributes. Icon fixes improve accessibility. Keyboard navigation maintained.                                                                    |
| **III. Consistent Styling**     | ✅ PASS | All new UI elements use CSS custom properties and SCSS mixins from the design token system. No hard-coded values.                                                                 |
| **III. Animation Restraint**    | ✅ PASS | No new decorative animations added.                                                                                                                                               |
| **IV. Bundle Budget**           | ✅ PASS | No new dependencies. Changes are to existing components and services. Locale data for `fr` is minimal (~2KB gzipped).                                                             |
| **IV. Lazy Loading**            | ✅ PASS | Feature routes remain lazy-loaded. Profile picture upload is within the profile feature module.                                                                                   |
| **IV. OnPush Change Detection** | ✅ PASS | All new/modified components use `ChangeDetectionStrategy.OnPush`.                                                                                                                 |
| **IV. Image Optimization**      | ✅ PASS | Profile picture display uses `NgOptimizedImage` with proper dimensions. Existing `NgOptimizedImage` issues fixed as part of FR-018/FR-019.                                        |
| **IV. Memory Management**       | ✅ PASS | New subscriptions use `takeUntilDestroyed()` or `DestroyRef`. No leaked listeners.                                                                                                |
| **IV. Core Web Vitals**         | ✅ PASS | No changes that would degrade LCP, FID, or CLS. Profile picture lazy-loads.                                                                                                       |

**Gate Result**: ✅ PASS — No violations. No constitution amendments required.

**Post-Phase 1 Re-check**: ✅ PASS — Design decisions align with all constitution principles. No new dependencies introduced.

## Project Structure

### Documentation (this feature)

```text
specs/006-app-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity and model changes
├── quickstart.md        # Phase 1 output — setup and verification guide
├── contracts/
│   └── api-contracts.md # Phase 1 output — API endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── assets/
│   └── i18n/
│       ├── en.json                          # MODIFIED: New/missing translation keys
│       └── fr.json                          # MODIFIED: New/missing translation keys
├── app/
│   ├── app.config.ts                        # MODIFIED: Register FR locale data
│   ├── core/
│   │   ├── api/
│   │   │   └── api.service.ts               # UNCHANGED
│   │   ├── auth/
│   │   │   └── auth.service.ts              # UNCHANGED (reads auth0 picture from user$)
│   │   └── layout/
│   │       ├── sidebar.component.ts         # MODIFIED: Add user info (name + picture)
│   │       ├── sidebar.component.html       # MODIFIED: User info section near logout
│   │       └── sidebar.component.scss       # MODIFIED: User info styles, icon fixes
│   ├── shared/
│   │   ├── models/
│   │   │   ├── media.model.ts               # MODIFIED: Add status, numberOfSeasons
│   │   │   └── user.model.ts                # MODIFIED: Add profilePicturePath
│   │   ├── pipes/
│   │   │   └── locale-date.pipe.ts          # NEW: Locale-aware date formatting pipe
│   │   ├── services/
│   │   │   └── admin-files.service.ts       # NEW: GET /files/locations wrapper
│   │   └── styles/
│   │       └── _variables.scss              # MODIFIED: Fix icon color variables if needed
│   └── features/
│       ├── admin/
│       │   ├── library-roots/
│       │   │   ├── add-library-root-dialog.component.ts   # MODIFIED: Root folder dropdown
│       │   │   ├── add-library-root-dialog.component.html # MODIFIED: Dropdown + sub-path UI
│       │   │   └── admin-library-root.service.ts          # MODIFIED: Add getLocations()
│       │   └── scanner/
│       │       ├── admin-scan.service.ts     # MODIFIED: Add language param to startScan()
│       │       ├── scan-launcher.component.ts    # MODIFIED: Pass active language to scan
│       │       └── scan-launcher.component.html  # UNCHANGED (language sent implicitly)
│       ├── collection/
│       │   └── media-card.component.scss    # MODIFIED: Icon visibility fixes
│       ├── media-detail/
│       │   ├── media-detail-page.component.ts    # MODIFIED: Display production status
│       │   ├── media-detail-page.component.html  # MODIFIED: Status badge, missing seasons
│       │   ├── media-detail-page.component.scss  # MODIFIED: Status badge styles
│       │   ├── season-list.component.ts          # MODIFIED: Missing season detection
│       │   ├── season-list.component.html        # MODIFIED: Missing season indicators
│       │   └── season-list.component.scss        # MODIFIED: Missing season visual treatment
│       ├── profile/
│       │   ├── profile-page.component.ts    # MODIFIED: Picture upload/remove, auth0 picture
│       │   ├── profile-page.component.html  # MODIFIED: Picture display + upload UI
│       │   ├── profile-page.component.scss  # MODIFIED: Picture upload styles
│       │   └── profile.service.ts           # MODIFIED: Upload/remove profile picture methods
│       ├── tmdb-search/
│       │   ├── tmdb-search-page.component.ts    # MODIFIED: Wishlist cross-reference
│       │   ├── tmdb-result-card.component.ts    # MODIFIED: Wishlist indicator input
│       │   ├── tmdb-result-card.component.html  # MODIFIED: Wishlist badge rendering
│       │   └── tmdb-result-card.component.scss  # MODIFIED: Wishlist badge styles
│       └── wishlist/
│           └── wishlist.service.ts          # UNCHANGED (already provides items signal)
```

**Structure Decision**: Single-project Angular SPA. All source under `src/`. No new feature modules or structural refactoring. New shared utilities (`LocaleDatePipe`, `AdminFilesService`) go in existing `src/app/shared/` directories. API changes are in the companion `MediaHandler.API` solution (separate repository root).

## Complexity Tracking

> No constitution violations requiring justification.

| Action Item                                        | Scope                              | Priority                                    |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------- |
| Backend API changes (4 modified + 2 new endpoints) | MediaHandler.API solution          | P1 (prerequisite for FR-003, FR-011–FR-016) |
| i18n audit (full EN/FR coverage)                   | All components + translation files | P1                                          |
| Icon visibility debugging                          | Global SCSS + component styles     | P1                                          |
| `NgOptimizedImage` fixes (FR-018)                  | Multiple components                | P3 (part of warning cleanup)                |
