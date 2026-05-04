# Implementation Plan: Administration Dashboard (US7–US12 Extension)

**Branch**: `develop` | **Date**: 2025-07-18 | **Spec**: `specs/004-admin-dashboard/spec.md`
**Input**: Feature specification from `specs/004-admin-dashboard/spec.md`

**Note**: US1–US6 are fully implemented. This plan covers new stories US7–US12 only. The original plan artifacts for US1–US6 remain valid and are preserved in the existing research.md, data-model.md, contracts/api-endpoints.md, and quickstart.md files.

## Summary

Extend the Administration Dashboard with six new user stories: Scan Results Browser (US7), Manual TMDB Search & Assignment (US8), TV Show Parent-Level TMDB Assignment (US9), Batch TMDB Enrichment Scan (US10), Automatic File Renaming (US11), and Legacy NAS Scanner Deprecation (US12). The implementation adds new Angular standalone components, services, and routes under the existing `src/app/features/admin/` structure using the same signals-first, OnPush, PrimeNG patterns established in US1–US6. Seven new backend API endpoints are consumed (documented in spec assumptions); the existing `tmdb/search` endpoint is reused for manual TMDB search. The legacy `/nas-scanner` feature is removed and redirected.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21.2  
**Primary Dependencies**: PrimeNG 21.1, PrimeFlex 4, @jsverse/transloco 8, RxJS 7  
**Storage**: Backend API (no direct frontend storage)  
**Testing**: Vitest 4 with jsdom  
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Edge, Safari latest 2 versions)  
**Project Type**: Single-page web application (Angular)  
**Performance Goals**: LCP < 2.5s, FID < 100ms, CLS < 0.1 on 4G; initial bundle < 500kB warning / 1MB error  
**Constraints**: Components ≤ 200 lines, OnPush change detection, standalone components only, signals-first state, no new external libraries  
**Scale/Scope**: Admin-only section, ~10 new components, 3 new services, 7 new API endpoints consumed

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                | Status  | Notes                                                                          |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| I. Code Quality — Single Responsibility  | ✅ PASS | All new components stay under 200 lines via page + child decomposition         |
| I. Code Quality — Signals-First          | ✅ PASS | New services use `signal()` for state; RxJS only for HTTP/polling streams      |
| I. Code Quality — Strict Typing          | ✅ PASS | All new interfaces have explicit types; no `any`                               |
| I. Code Quality — Standalone Components  | ✅ PASS | All new components are standalone; no NgModules                                |
| I. Code Quality — Reactive Patterns      | ✅ PASS | HTTP streams use RxJS operators; polling uses `interval` + `switchMap`         |
| II. Testing — Unit Tests Required        | ✅ PASS | Every new service gets `.spec.ts`; complex components get DOM tests            |
| III. UX — Loading States                 | ✅ PASS | All async operations display loading indicators                                |
| III. UX — Error Feedback                 | ✅ PASS | Error interceptor handles API errors; rename/enrichment show specific messages |
| III. UX — Responsive Design              | ✅ PASS | PrimeFlex grid ensures responsive layouts                                      |
| IV. Performance — Lazy Loading           | ✅ PASS | New routes lazy-loaded under existing `/admin` parent                          |
| IV. Performance — OnPush                 | ✅ PASS | All new components use `ChangeDetectionStrategy.OnPush`                        |
| IV. Performance — Memory Management      | ✅ PASS | `takeUntilDestroyed()` for polling subscriptions                               |
| IV. Performance — Bundle Budget          | ✅ PASS | No new dependencies; reuse existing PrimeNG/Transloco                          |
| Technical Decision — No New Dependencies | ✅ PASS | Reuse existing TMDB search service; no new packages                            |

**Gate Result**: ✅ ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-admin-dashboard/
├── plan.md              # This file (updated for US7–US12)
├── research.md          # Updated with US7–US12 research
├── data-model.md        # Updated with new interfaces
├── quickstart.md        # Updated with new file structure
├── contracts/
│   └── api-endpoints.md # Updated with new endpoints
└── tasks.md             # Existing US1–US6 tasks (US7–US12 tasks via /speckit.tasks)
```

### Source Code (repository root)

```text
src/app/features/admin/
├── admin.routes.ts                          # MODIFY: add scan-results, enrichment routes + scan-results/:scanId
├── admin-layout.component.ts                # MODIFY: add Scan Results + Enrichment tabs
├── admin-layout.component.html
├── admin-layout.component.scss
├── dashboard/                               # EXISTING (US5) — no changes
├── users/                                   # EXISTING (US1) — no changes
├── library-roots/                           # EXISTING (US2) — no changes
├── scanner/                                 # EXISTING (US3) — no changes
├── review/                                  # EXISTING (US4) — MODIFY: integrate tmdb-search-panel
│   ├── admin-review-page.component.*        # MODIFY: add "Search TMDB" button trigger
│   └── review-resolve-dialog.component.*    # MODIFY: integrate TmdbSearchPanelComponent
├── scan-results/                            # NEW (US7, US9)
│   ├── admin-scan-results-page.component.ts/html/scss  # Page orchestrator
│   ├── scan-decision-table.component.ts/html/scss      # Paginated filterable p-table
│   ├── scan-decision-detail.component.ts/html/scss     # Expanded row: candidates, reassign
│   ├── tv-show-group-list.component.ts/html/scss       # TV show grouping view (US9)
│   ├── admin-scan-decision.service.ts       # API calls for decisions + tv-groups
│   └── admin-scan-decision.service.spec.ts
├── enrichment/                              # NEW (US10)
│   ├── admin-enrichment-page.component.ts/html/scss   # Enrichment panel
│   ├── admin-enrichment.service.ts          # API calls + polling
│   └── admin-enrichment.service.spec.ts
└── shared/                                  # NEW — shared admin components
    ├── tmdb-search-panel.component.ts/html/scss     # Reusable TMDB search (US8)
    └── rename-dialog.component.ts/html/scss         # File rename dialog (US11)

src/app/shared/models/
├── enums.ts                    # MODIFY: add ScanDecisionType, EnrichmentStatus
├── scan-decision.model.ts      # NEW: ScanItemDecision, TvShowGroup interfaces
├── enrichment.model.ts         # NEW: EnrichmentRun, EnrichmentSummary interfaces
└── rename.model.ts             # NEW: RenamePreview, RenameResult interfaces

src/assets/i18n/
├── en.json                     # MODIFY: add admin.scanResults, admin.enrichment, admin.rename, admin.tmdbSearch keys
└── fr.json                     # MODIFY: add French translations

src/app/features/nas-scanner/   # DELETE (US12) — all files removed
src/app/app.routes.ts           # MODIFY: replace nas-scanner route with redirect
src/app/core/layout/sidebar.component.ts  # MODIFY: remove NAS Scanner nav item
```

**Structure Decision**: Extend the existing `src/app/features/admin/` flat feature structure. New sub-sections (`scan-results/`, `enrichment/`) follow the same pattern as existing (`scanner/`, `review/`). Shared admin components (`tmdb-search-panel`, `rename-dialog`) go under `admin/shared/` to keep them co-located with the admin feature while available to multiple admin sub-sections.

## Complexity Tracking

No constitution violations. No complexity justification needed.

## Architecture Decisions (US7–US12)

### AD-1: Reusable TMDB Search Panel (US8)

The `TmdbSearchPanelComponent` is a standalone component under `admin/shared/` that wraps the existing `TmdbSearchService` (`tmdb/search` endpoint). It emits a `selected` event with the chosen `TmdbSearchResult`. Both the Review Queue (US4) and Scan Results Browser (US7) embed this panel via `<app-tmdb-search-panel (selected)="onAssign($event)">`. This avoids duplicating TMDB search logic.

### AD-2: TV Show Grouping is API-Driven (US9)

The `GET /api/v1/admin/scan-decisions/tv-groups?scanId` endpoint returns pre-computed groups. The frontend does NOT compute groups client-side. This ensures consistent grouping logic and avoids transferring all decisions to the client for grouping.

### AD-3: Enrichment Polling Reuses Scan Polling Pattern (US10)

`AdminEnrichmentService` uses the same `interval(4000) + switchMap + takeUntilDestroyed` pattern as `AdminScanService`. Polling starts on enrichment launch and stops on terminal state.

### AD-4: Rename Dialog is Context-Agnostic (US11)

The `RenameDialogComponent` accepts a file ID and displays a preview (from `POST /api/v1/admin/files/{id}/rename?preview=true`). It works for single files (from scan results or review queue) and batch TV show renames (from `POST /api/v1/admin/tv-groups/{groupId}/rename`). The dialog handles both modes via an input discriminator.

### AD-5: NAS Scanner Removal is Route-Level (US12)

The `/nas-scanner` route is replaced with a `redirectTo: '/admin/scanner'` entry in `app.routes.ts`. The `src/app/features/nas-scanner/` directory and all its files are deleted. The sidebar nav item is removed. Translation keys under `nasScanner.*` are removed from both language files.

## PrimeNG Component Map (New for US7–US12)

| Component         | Import                    | Usage                                                                           |
| ----------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `Table`           | `primeng/table`           | Scan decision table, TV show group list                                         |
| `Button`          | `primeng/button`          | Reassign, Search TMDB, Rename, Start Enrichment                                 |
| `Dialog`          | `primeng/dialog`          | TMDB search panel dialog, rename preview dialog                                 |
| `Select`          | `primeng/select`          | Decision type filter, scan run selector, media type filter, library root filter |
| `InputText`       | `primeng/inputtext`       | TMDB search query input                                                         |
| `ProgressBar`     | `primeng/progressbar`     | Enrichment progress                                                             |
| `ProgressSpinner` | `primeng/progressspinner` | Loading states                                                                  |
| `Tag`             | `primeng/tag`             | Decision type badges, enrichment status                                         |
| `ConfirmDialog`   | `primeng/confirmdialog`   | Rename confirmation, enrichment start confirmation                              |
| `Image`           | `primeng/image`           | TMDB poster thumbnails in search results                                        |
| `Message`         | `primeng/message`         | Empty states, warnings (media type mismatch)                                    |
| `Accordion`       | `primeng/accordion`       | TV show group expand/collapse with episodes                                     |
| `DataView`        | `primeng/dataview`        | TMDB search results display                                                     |
| `Chip`            | `primeng/chip`            | Episode count badges on TV show groups                                          |
| `Toolbar`         | `primeng/toolbar`         | Page action bars for scan results, enrichment                                   |
