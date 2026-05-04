# Research: Administration Dashboard

**Feature**: 004-admin-dashboard  
**Date**: 2025-07-17  
**Updated**: 2025-07-18 (US7–US12 extension)

## 1. API Endpoint Availability

### Decision: Use existing backend API endpoints as-is, noting three gaps

### Rationale

After auditing the API project (`MediaHandler.API`), the following endpoints are confirmed **implemented and available**:

| Controller                    | Endpoint                                                               | Status         |
| ----------------------------- | ---------------------------------------------------------------------- | -------------- |
| `AdminController`             | `GET /api/v1/admin/users?page&pageSize&search`                         | ✅ Implemented |
| `AdminController`             | `PUT /api/v1/admin/users/{id}/role`                                    | ✅ Implemented |
| `AdminController`             | `PUT /api/v1/admin/users/{id}/active`                                  | ✅ Implemented |
| `AdminLibraryRootsController` | `GET /api/v1/admin/library-roots?page&pageSize&kind&enabledOnly`       | ✅ Implemented |
| `AdminLibraryRootsController` | `POST /api/v1/admin/library-roots`                                     | ✅ Implemented |
| `AdminLibraryRootsController` | `DELETE /api/v1/admin/library-roots/{id}`                              | ✅ Implemented |
| `AdminScanController`         | `POST /api/v1/admin/scan`                                              | ✅ Implemented |
| `AdminScanController`         | `GET /api/v1/admin/scan/{id}?includeReview`                            | ✅ Implemented |
| `AdminScanController`         | `GET /api/v1/admin/scan/active`                                        | ✅ Implemented |
| `AdminScanController`         | `POST /api/v1/admin/scan/{id}/cancel`                                  | ✅ Implemented |
| `AdminReviewController`       | `GET /api/v1/admin/review-items?status&reason&scanRunId&page&pageSize` | ✅ Implemented |
| `AdminReviewController`       | `POST /api/v1/admin/review-items/{id}/resolve`                         | ✅ Implemented |
| `HealthController`            | `GET /api/v1/health`                                                   | ✅ Implemented |

### API Gaps (backend needs additions for full spec coverage)

| Missing Endpoint                                           | Spec Requirement                          | Workaround for Frontend                                                                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PUT /api/v1/admin/library-roots/{id}/enabled`             | FR-009a — toggle enabled/disabled         | **Backend must implement.** Frontend will call this endpoint; blocked until available.                                                                  |
| `GET /api/v1/admin/scan?page&pageSize` (scan history list) | FR-012a — paginated scan history          | **Backend must implement.** Frontend will need a list endpoint returning recent runs.                                                                   |
| `POST /api/v1/admin/review-items/{id}/reopen`              | FR-016a — reopen resolved/dismissed items | **Backend must implement.** The existing resolve endpoint only supports Assign/Dismiss/Delete actions; a Reopen action or dedicated endpoint is needed. |

### Alternatives Considered

- **Client-side workaround for scan history**: Could re-use `GET /scan/{id}` with known IDs, but there's no way to discover IDs without a list endpoint. Rejected.
- **Reopen via resolve endpoint with a new action**: Could add a `Reopen` value to `ReviewResolutionAction` enum on backend. This is the preferred backend approach — simpler than a new endpoint.
- **Toggle enabled via DELETE+POST**: Could remove and re-add library roots. Rejected — changes the root's ID and creation date.

## 2. Frontend Component Architecture with PrimeNG

### Decision: Use PrimeNG components exclusively; no additional UI libraries

### Rationale

The project already uses PrimeNG v21, PrimeFlex v4, and the Aura theme. PrimeNG provides all required components:

| UI Need                               | PrimeNG Component                                           |
| ------------------------------------- | ----------------------------------------------------------- |
| Data tables with sort/filter/paginate | `p-table` (Table) with `pSortableColumn`, `pPaginator`      |
| Form inputs                           | `InputText`, `Select` (dropdown), `InputTextarea`           |
| Action buttons                        | `Button` with severity/icon/loading states                  |
| Confirmation dialogs                  | `ConfirmDialog` + `ConfirmationService`                     |
| Toast notifications                   | `Toast` + `MessageService` (already configured in app root) |
| Status indicators                     | `Tag` with severity (`success`, `danger`, `warn`, `info`)   |
| Progress indicators                   | `ProgressSpinner`, `ProgressBar`                            |
| Badges for counts                     | `Badge`                                                     |
| Toggle switches                       | `ToggleSwitch`                                              |
| Tabbed navigation                     | `TabMenu` or route-based tabs with `RouterLinkActive`       |
| Dialogs/modals                        | `Dialog`                                                    |
| Multi-select for roots                | `MultiSelect`                                               |
| Toolbar                               | `Toolbar`                                                   |

### Alternatives Considered

- **Angular Material**: Already have PrimeNG; adding a second component library violates the "minimize external libraries" constraint and would bloat the bundle.
- **Custom components**: Higher development cost without benefit; PrimeNG components are well-tested and accessible.

## 3. Admin Section Routing Strategy

### Decision: Nested child routes under `/admin` with lazy-loaded feature module

### Rationale

- Follows the existing pattern: each feature is a lazy-loaded route (see `collection.routes`, `nas-scanner.routes`).
- The admin section has 4 sub-sections (dashboard/health, users, library-roots, scanner/review) → use child routes under a parent layout component.
- The parent layout provides a `TabMenu` or sidebar sub-nav for admin sections.
- The parent route uses `canActivate: [authGuard, adminGuard]` — matches the existing `nas-scanner` pattern.

### Alternatives Considered

- **Flat routes** (`/admin-users`, `/admin-scanner`, etc.): Loses the shared admin layout and sub-navigation. Rejected.
- **Separate lazy-loaded routes per sub-section**: Would duplicate the admin guard configuration and prevent a shared admin shell. Rejected.

## 4. State Management Pattern

### Decision: Angular signals for component state; RxJS for HTTP streams only

### Rationale

- Constitution mandates: "New state management MUST use Angular signals. Observable-based state is permitted only for async streams (HTTP, WebSocket)."
- Each admin sub-section gets its own injectable service (e.g., `AdminUserService`, `AdminLibraryRootService`) using `signal()` for reactive state.
- HTTP calls use `Observable` from `ApiService`, piped through operators, then stored in signals via `subscribe()` or `toSignal()`.
- Polling for scan status uses `interval()` + `switchMap()` → piped to a signal.

### Alternatives Considered

- **NgRx or other state management library**: Overkill for CRUD admin screens. Violates "minimize external libraries" and "simplicity" principles.
- **Pure RxJS BehaviorSubjects**: Constitution says signals-first. Rejected.

## 5. Scan Status Polling Implementation

### Decision: `interval(4000)` + `switchMap` to poll `GET /admin/scan/active`, managed with `takeUntilDestroyed()`

### Rationale

- Spec says "HTTP GET every 3–5 seconds". 4 seconds is the midpoint.
- `switchMap` cancels the previous request if it hasn't completed — prevents request pile-up on slow connections.
- Polling starts when a scan is in a non-terminal state and stops automatically when the component is destroyed (`takeUntilDestroyed()`) or when the scan reaches a terminal state (`Completed`, `Failed`, `Cancelled`).
- Constitution says: "Memory Management: Subscriptions and event listeners MUST be cleaned up on component destroy."

### Alternatives Considered

- **SSE or WebSockets**: Spec explicitly says "polling — periodic HTTP requests every 3–5 seconds." Rejected.
- **3-second interval**: Works but more aggressive on the server. 4 seconds balances responsiveness with server load.

## 6. i18n Strategy for Admin Section

### Decision: Add `admin` namespace to existing `en.json` and `fr.json` translation files

### Rationale

- The project uses a single flat JSON file per language (`src/assets/i18n/en.json`, `src/assets/i18n/fr.json`).
- All existing features (collection, media, tmdb, nasScanner, etc.) are namespaced under top-level keys.
- The admin section will add an `admin` key with nested sub-keys: `admin.users`, `admin.libraryRoots`, `admin.scanner`, `admin.review`, `admin.health`.

### Alternatives Considered

- **Separate Transloco scope per admin sub-section**: Would require scope configuration and break from the project's single-file pattern. Rejected.

## 7. Component Sizing & Single Responsibility

### Decision: Split each admin sub-section into page component + child components, keeping each under 200 lines

### Rationale

- Constitution: "Components exceeding 200 lines MUST be refactored into smaller units."
- Each sub-section page (e.g., `admin-users-page`) orchestrates the view but delegates UI concerns:
  - `admin-users-page` → `user-table`, `user-role-dialog`
  - `admin-library-roots-page` → `library-root-table`, `add-library-root-dialog`
  - `admin-scanner-page` → `scan-launcher`, `scan-status`, `scan-history-table`
  - `admin-review-page` → `review-item-table`, `review-resolve-dialog`

## 8. Scan Results Browser — Data Loading Strategy (US7)

### Decision: Server-side filtering and pagination; default to most recent scan with all decision types

### Rationale

The `GET /api/v1/admin/scan/{scanId}/decisions` endpoint handles filtering by decision type, media type, and library root server-side. The frontend sends filter params as query parameters. This avoids loading potentially thousands of scan decisions into the browser for client-side filtering.

The page loads the scan history (already available via `GET /admin/scan`) to populate the scan run selector, then defaults to the most recent completed scan. The decision type filter defaults to "All" (no filter param sent).

Row expansion for candidate details uses inline data — `ScanItemDecision.candidates` is included in the response. No additional API call is needed when expanding a row.

### Alternatives Considered

- **Client-side filtering**: Loading all decisions for a scan and filtering in-memory. Rejected — a scan could produce thousands of decisions, exceeding reasonable browser memory for large libraries.
- **Separate endpoint per filter**: One endpoint for by-type, another for by-root. Rejected — a single endpoint with query params is simpler and matches the existing review-items pattern.

## 9. Reusable TMDB Search Panel Architecture (US8)

### Decision: Create a shared `TmdbSearchPanelComponent` under `admin/shared/` that wraps `TmdbSearchService`

### Rationale

Manual TMDB search is needed in three contexts: Review Queue (US4 scenarios 3–4), Scan Results Browser (US7 scenario 7), and TV Show Groups (US9 scenario 2). A reusable panel component:

- Accepts an optional `initialQuery` input (pre-filled from parsed title)
- Accepts an optional `mediaTypeFilter` input (to filter results to TV shows only for US9)
- Emits `(selected)` with the chosen `TmdbSearchResult`
- Uses the existing `TmdbSearchService.search()` method (calls `GET /api/v1/tmdb/search`)
- Displays results in a `DataView` with poster, title, year, overview, media type
- Is embedded inside a `p-dialog` in the parent component

The existing `TmdbSearchService` from `src/app/features/tmdb-search/` is reused directly — no need to duplicate or create a new service. The `TmdbSearchResult` interface is already exported.

### Alternatives Considered

- **Duplicate search logic in each consuming component**: Violates Single Responsibility and DRY. Rejected.
- **Move `TmdbSearchService` to shared**: The service is already `providedIn: 'root'`, so it's available everywhere. Moving the file would be a refactor with no functional benefit. Use as-is.
- **Use the existing `tmdb-result-card` component**: It has import/wishlist buttons specific to the TMDB Search page. The admin panel needs an "Assign" action instead. Creating a simpler panel component avoids contaminating the existing component with admin-specific logic.

## 10. TV Show Grouping Strategy (US9)

### Decision: API-driven grouping via `GET /api/v1/admin/scan-decisions/tv-groups?scanId`; frontend renders groups as accordion panels

### Rationale

Per spec clarification (2026-05-03), `TvShowGroup` is transient/computed — the backend groups `ScanItemDecision` rows by `parsedShowName + scanId` and returns group summaries with a derived hash key (`groupId`). The frontend:

1. Calls the tv-groups endpoint to get group summaries (show name, episode count, TMDB assignment status)
2. Renders each group as an `Accordion` panel with show name header + episode count chip
3. On expand, shows the episode files within the group (already included or fetched lazily)
4. Show-level TMDB assignment uses `PUT /api/v1/admin/tv-groups/{groupId}/assign`

The separate TV show view is integrated as a toggle/tab within the Scan Results page — when viewing TV content, the admin switches between "flat list" and "grouped by show" views.

### Alternatives Considered

- **Client-side grouping**: Fetch all decisions and group in the browser. Rejected — the backend computes the hash-based group identity, and client-side grouping would need to replicate this logic exactly.
- **Dedicated TV Shows page**: A separate route for TV show management. Rejected — the spec describes TV grouping as a view within Scan Results, not a standalone section.

## 11. Enrichment Service Pattern (US10)

### Decision: `AdminEnrichmentService` mirrors `AdminScanService` — signal state, polling, terminal state detection

### Rationale

The enrichment workflow has the same lifecycle as scanning:

- Start action (`POST /admin/enrichment/start`) → returns initial status
- Poll for progress (`GET /admin/enrichment/status`) every 4 seconds
- Stop on terminal state (Completed, Failed)
- Display summary on completion (enriched count, failed count, errors)

The service exposes:

- `enrichmentStatus: signal<EnrichmentRun | null>` — current/last enrichment state
- `loading: signal<boolean>` — for the start action
- `startEnrichment(): void` — triggers the backend process + starts polling
- `getStatus(): void` — fetches current status (used on page load)

The pre-enrichment summary (new vs. changed vs. skipped counts) comes from the enrichment status endpoint itself (returns counts even before starting).

### Alternatives Considered

- **SSE for enrichment progress**: Spec says polling. Rejected.
- **Unified service with scan service**: Scanning and enrichment have different endpoints and semantics. Rejected — separate service follows Single Responsibility.

## 12. File Rename Approach (US11)

### Decision: Preview-then-confirm two-step flow using `POST /admin/files/{id}/rename?preview=true` then `POST /admin/files/{id}/rename`

### Rationale

The rename dialog:

1. Opens with file ID → calls the rename endpoint with `?preview=true` to get proposed new name
2. Displays current name + proposed new name side-by-side
3. On confirm → calls the same endpoint without `?preview=true` to execute the rename
4. On success → refreshes the parent list (scan results or review queue)

For batch TV show renames (US9/US11 overlap), the flow uses `POST /admin/tv-groups/{groupId}/rename` which renames all episodes under the group. The preview shows all proposed renames as a scrollable list.

The `RenameDialogComponent` accepts inputs:

- `mode: 'single' | 'batch'`
- `fileId?: string` (for single mode)
- `groupId?: string` (for batch mode)

### Alternatives Considered

- **Client-side name construction**: Build the new filename in the frontend from TMDB metadata + naming conventions. Rejected — the backend owns the naming logic and must validate against filesystem constraints (path length, illegal characters, collisions).
- **Inline rename without dialog**: Less safe — user needs to see preview before committing to filesystem changes. Rejected.

## 13. NAS Scanner Deprecation Strategy (US12)

### Decision: Route redirect + file deletion + sidebar cleanup + translation key cleanup

### Rationale

The legacy `/nas-scanner` route in `app.routes.ts` is replaced with:

```typescript
{ path: 'nas-scanner', redirectTo: '/admin/scanner', pathMatch: 'full' }
```

Cleanup checklist:

1. Delete `src/app/features/nas-scanner/` directory (5 files)
2. Remove `nasScannerRoutes` import/lazy-load from `app.routes.ts`
3. Remove `{ labelKey: 'nav.nasScanner', ... }` from sidebar
4. Remove `nasScanner.*` keys from `en.json` and `fr.json`
5. Remove any test files referencing nas-scanner components

The redirect uses `redirectTo` with an absolute path, which Angular handles natively — no custom redirect logic needed.

### Alternatives Considered

- **Keep the route with a deprecation notice**: Users could still accidentally use the old page. Rejected — clean removal is safer.
- **Redirect via a guard**: Unnecessary complexity when Angular's built-in `redirectTo` handles this case.
