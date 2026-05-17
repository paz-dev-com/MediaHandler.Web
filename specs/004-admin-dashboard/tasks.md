# Tasks: Administration Dashboard

**Input**: Design documents from `/specs/004-admin-dashboard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-endpoints.md ✅, quickstart.md ✅

**Tests**: Unit tests are included — the spec (plan.md Constitution Check, §II) requires `.spec.ts` for every service and complex components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Angular project**: `src/app/` at repository root
- Feature files: `src/app/features/admin/`
- Shared models: `src/app/shared/models/`
- Translations: `src/assets/i18n/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the admin feature directory structure, shared models, enums, routing, and sidebar integration

- [x] T001 Add admin enums (`LibraryRootKind`, `ScanMode`, `ScanStatus`, `ReviewStatus`, `ReviewReason`, `ReviewResolutionAction`) to `src/app/shared/models/enums.ts`
- [x] T002 [P] Create `LibraryRoot` interface in `src/app/shared/models/library-root.model.ts`
- [x] T003 [P] Create `ScanCounts`, `ScanRunSummary`, and `ScanRunDetail` interfaces in `src/app/shared/models/admin-scan.model.ts`
- [x] T004 [P] Create `TmdbCandidate` and `ReviewItem` interfaces in `src/app/shared/models/review.model.ts`
- [x] T005 [P] Create `HealthStatus` interface in `src/app/shared/models/health.model.ts`
- [x] T006 Create admin child routes in `src/app/features/admin/admin.routes.ts` with lazy-loaded child components for dashboard, users, library-roots, scanner, and review
- [x] T007 Add `/admin` route with `authGuard` + `adminGuard` and `loadChildren` to `src/app/app.routes.ts` (insert before the wildcard `**` route)
- [x] T008 Add "Administration" nav item (`{ labelKey: 'nav.admin', icon: 'pi pi-cog', route: '/admin' }`) to the admin section of `src/app/core/layout/sidebar.component.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Admin layout shell with TabMenu sub-navigation — all user story pages render inside this layout

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create `AdminLayoutComponent` with PrimeNG `TabMenu` sub-navigation (Dashboard, Users, Library Roots, Scanner, Review tabs linked to child routes) and `<router-outlet>` in `src/app/features/admin/admin-layout.component.ts`, `src/app/features/admin/admin-layout.component.html`, and `src/app/features/admin/admin-layout.component.scss`

**Checkpoint**: Admin layout shell renders at `/admin` with working tab navigation between empty child routes

---

## Phase 3: User Story 1 — User Management (Priority: P1) 🎯 MVP

**Goal**: Admins can view, search, paginate all users and change roles / toggle active status

**Independent Test**: Navigate to `/admin/users`, see paginated user table, search for a user, change their role via dropdown, toggle active status — each action shows a success toast

### Tests for User Story 1

- [x] T010 [P] [US1] Create unit tests for `AdminUserService` in `src/app/features/admin/users/admin-user.service.spec.ts` — test `getUsers()`, `setRole()`, `setActive()` HTTP calls and signal state updates

### Implementation for User Story 1

- [x] T011 [US1] Implement `AdminUserService` with signals (`users`, `loading`, `meta`) and methods `getUsers(page, pageSize, search)`, `setRole(userId, role)`, `setActive(userId, isActive)` in `src/app/features/admin/users/admin-user.service.ts`
- [x] T012 [US1] Create `AdminUsersPageComponent` with PrimeNG `Table` (server-side pagination via `onLazyLoad`), `InputText` search, `Select` for role change, `ToggleSwitch`/`Button` for active toggle, and `Tag` for status display in `src/app/features/admin/users/admin-users-page.component.ts`, `src/app/features/admin/users/admin-users-page.component.html`, and `src/app/features/admin/users/admin-users-page.component.scss`

**Checkpoint**: User Story 1 fully functional — admin can list, search, paginate users, change roles, and toggle active status

---

## Phase 4: User Story 2 — Library Root Management (Priority: P1)

**Goal**: Admins can view, filter, add, remove, and enable/disable NAS library roots

**Independent Test**: Navigate to `/admin/library-roots`, see paginated root list, filter by kind/enabled, add a new root via dialog, toggle enabled switch, remove a root with confirmation

### Tests for User Story 2

- [x] T013 [P] [US2] Create unit tests for `AdminLibraryRootService` in `src/app/features/admin/library-roots/admin-library-root.service.spec.ts` — test `getRoots()`, `addRoot()`, `removeRoot()`, `setEnabled()` HTTP calls and signal state updates

### Implementation for User Story 2

- [x] T014 [US2] Implement `AdminLibraryRootService` with signals (`roots`, `loading`, `meta`) and methods `getRoots(page, pageSize, kind?, enabledOnly?)`, `addRoot(path, kind, label?)`, `removeRoot(id)`, `setEnabled(id, isEnabled)` in `src/app/features/admin/library-roots/admin-library-root.service.ts`
- [x] T015 [P] [US2] Create `AddLibraryRootDialogComponent` with PrimeNG `Dialog`, `InputText` for path, `Select` for kind, `InputText` for optional label, and submit/cancel buttons in `src/app/features/admin/library-roots/add-library-root-dialog.component.ts`
- [x] T016 [US2] Create `AdminLibraryRootsPageComponent` with PrimeNG `Table` (pagination, `Select` filter for kind, `Select` filter for enabled status), `ToggleSwitch` for enable/disable, remove button with `ConfirmDialog`, and "Add Library Root" button opening the dialog in `src/app/features/admin/library-roots/admin-library-roots-page.component.ts`, `src/app/features/admin/library-roots/admin-library-roots-page.component.html`, and `src/app/features/admin/library-roots/admin-library-roots-page.component.scss`

**Checkpoint**: User Story 2 fully functional — admin can manage library roots with all CRUD + enable/disable operations

---

## Phase 5: User Story 3 — Scanner Operations & Monitoring (Priority: P2)

**Goal**: Admins can start/cancel scans, monitor live status via polling, and browse paginated scan history

**Independent Test**: Navigate to `/admin/scanner`, start a Full scan on all enabled roots, observe live status polling, cancel the scan, then view the scan in the history table. Verify disabled library roots do NOT appear in the root selector.

### Tests for User Story 3

- [x] T017 [P] [US3] Create unit tests for `AdminScanService` in `src/app/features/admin/scanner/admin-scan.service.spec.ts` — test `startScan()`, `getActiveScan()`, `cancelScan()`, `getScanHistory()`, `getScanDetail()` HTTP calls, polling lifecycle (start/stop on terminal state), and signal state

### Implementation for User Story 3

- [x] T018 [US3] Implement `AdminScanService` with signals (`activeScan`, `scanHistory`, `historyMeta`, `loading`) and methods `startScan(libraryRootIds, mode)`, `getActiveScan()`, `cancelScan(id)`, `getScanHistory(page, pageSize)`, `getScanDetail(id, includeReview)`, plus `interval(4000)` + `switchMap` polling with `takeUntilDestroyed()` in `src/app/features/admin/scanner/admin-scan.service.ts`
- [x] T019 [P] [US3] Create `ScanLauncherComponent` with PrimeNG `MultiSelect` for enabled library root selection (populated from `AdminLibraryRootService.getRoots` with `enabledOnly=true`), `Select` for scan mode (Full/Incremental), and "Start Scan" `Button` with loading state in `src/app/features/admin/scanner/scan-launcher.component.ts`
- [x] T020 [P] [US3] Create `ScanStatusComponent` with PrimeNG `Tag` for scan status badge, `ProgressSpinner` for running state, scan counts display, and "Cancel Scan" `Button` in `src/app/features/admin/scanner/scan-status.component.ts`
- [x] T021 [P] [US3] Create `ScanHistoryTableComponent` with PrimeNG `Table` (server-side pagination, 20 rows per page) displaying scan mode, status `Tag`, start/finish timestamps, and summary counts per row in `src/app/features/admin/scanner/scan-history-table.component.ts`
- [x] T022 [P] [US3] Create `AdminScannerPageComponent` orchestrating `ScanLauncherComponent`, `ScanStatusComponent`, and `ScanHistoryTableComponent` — show launcher when no scan is active, show status when scan is running, always show history table below in `src/app/features/admin/scanner/admin-scanner-page.component.ts`, `src/app/features/admin/scanner/admin-scanner-page.component.html`, and `src/app/features/admin/scanner/admin-scanner-page.component.scss`

**Checkpoint**: User Story 3 fully functional — admin can start, monitor, cancel scans and browse history

---

## Phase 6: User Story 4 — Review Queue Management (Priority: P2)

**Goal**: Admins can view, filter, and resolve review items (assign TMDB candidate, dismiss, delete, reopen)

**Independent Test**: Navigate to `/admin/review`, see paginated open review items, filter by status/reason/scanRunId, select an item, assign a TMDB candidate via the resolve dialog, then dismiss and reopen another item

### Tests for User Story 4

- [x] T023 [P] [US4] Create unit tests for `AdminReviewService` in `src/app/features/admin/review/admin-review.service.spec.ts` — test `getItems()`, `resolveItem()` with all action types (Assign, Dismiss, Delete, Reopen) HTTP calls and signal state

### Implementation for User Story 4

- [x] T024 [US4] Implement `AdminReviewService` with signals (`items`, `loading`, `meta`) and methods `getItems(status?, reason?, scanRunId?, page?, pageSize?)`, `resolveItem(id, action, tmdbId?, kind?)` in `src/app/features/admin/review/admin-review.service.ts`
- [x] T025 [P] [US4] Create `ReviewResolveDialogComponent` with PrimeNG `Dialog` displaying the selected review item's file path, parsed metadata, TMDB candidate list with poster previews, and action buttons (Assign selected candidate, Dismiss, Delete, Reopen) in `src/app/features/admin/review/review-resolve-dialog.component.ts`
- [x] T026 [US4] Create `AdminReviewPageComponent` with PrimeNG `Table` (server-side pagination), `Select` filters for status, reason, and scan run, `Tag` for status/reason columns, and row click opening `ReviewResolveDialogComponent` in `src/app/features/admin/review/admin-review-page.component.ts`, `src/app/features/admin/review/admin-review-page.component.html`, and `src/app/features/admin/review/admin-review-page.component.scss`

**Checkpoint**: User Story 4 fully functional — admin can manage the full review item lifecycle

---

## Phase 7: User Story 5 — System Health Overview (Priority: P3)

**Goal**: Admin landing page displays API health status, server timestamp, and application version

**Independent Test**: Navigate to `/admin/dashboard`, verify health panel shows "Healthy"/"Unhealthy" status with appropriate color badge, server timestamp, and version string

### Implementation for User Story 5

- [x] T027 [US5] Implement `AdminHealthService` with signal (`health`) and method `getHealth()` calling `GET health` in `src/app/features/admin/dashboard/admin-health.service.ts`
- [x] T028 [P] [US5] Create `HealthPanelComponent` with PrimeNG `Tag` (severity: `success` for Healthy, `danger` for Unhealthy), `ProgressSpinner` while loading, timestamp display, and version display in `src/app/features/admin/dashboard/health-panel.component.ts`
- [x] T029 [US5] Create `AdminDashboardPageComponent` embedding `HealthPanelComponent` and displaying quick-stats summary on the admin landing page in `src/app/features/admin/dashboard/admin-dashboard-page.component.ts`, `src/app/features/admin/dashboard/admin-dashboard-page.component.html`, and `src/app/features/admin/dashboard/admin-dashboard-page.component.scss`

**Checkpoint**: User Story 5 fully functional — admin sees health status on dashboard landing

---

## Phase 8: User Story 6 — Bilingual Support (Priority: P3)

**Goal**: All admin section labels, buttons, messages, table headers, and status indicators are translated in English and French

**Independent Test**: Switch language to French, navigate to each admin sub-section (Dashboard, Users, Library Roots, Scanner, Review), verify all visible text appears in French with no untranslated `admin.*` keys

### Implementation for User Story 6

- [x] T030 [P] [US6] Add English translation keys (`admin.dashboard.*`, `admin.users.*`, `admin.libraryRoots.*`, `admin.scanner.*`, `admin.review.*`, `admin.health.*`, `nav.admin`) to `src/assets/i18n/en.json`
- [x] T031 [P] [US6] Add French translation keys (matching `admin.*` structure) to `src/assets/i18n/fr.json`
- [x] T032 [US6] Wire up `transloco` pipes in all admin component templates — replace all hardcoded strings with `{{ t('admin.*') }}` translation keys in every `.component.html` file under `src/app/features/admin/`

**Checkpoint**: All admin UI fully bilingual — no untranslated keys in either language

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility checks, and cleanup across all admin sub-sections

- [x] T033 [P] Add loading states (`ProgressSpinner` or button `loading` property) to all async operations across admin components
- [x] T034 [P] Add empty state messages for empty tables/lists (no users found, no library roots, no scan history, no review items) across admin components
- [x] T035 Verify error handling — ensure backend `409`, `404`, `400`, `422` errors display meaningful toast messages via existing error interceptor across all admin services
- [x] T036 Run `quickstart.md` validation — start app, navigate to `/admin`, exercise each sub-section per the quickstart steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs routes and models) — BLOCKS all user stories
- **User Stories (Phases 3–8)**: All depend on Phase 2 completion
  - US1 (Users) and US2 (Library Roots) can proceed in parallel
  - US3 (Scanner) depends on US2's `AdminLibraryRootService` for the scan root selector
  - US4 (Review) is independent of other stories
  - US5 (Health/Dashboard) is independent of other stories
  - US6 (i18n) should be done last — after all component templates exist
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — start after Phase 2
- **US2 (P1)**: Independent — start after Phase 2 (can parallel with US1)
- **US3 (P2)**: Soft dependency on US2 (`AdminLibraryRootService` needed for scan launcher root selector)
- **US4 (P2)**: Independent — start after Phase 2 (can parallel with US1/US2)
- **US5 (P3)**: Independent — start after Phase 2
- **US6 (P3)**: Depends on all component templates being created (US1–US5)

### Within Each User Story

- Tests written FIRST; should FAIL before implementation
- Service before page component
- Child/dialog components can be parallel [P] with service
- Page component wires everything together last

### Parallel Opportunities

- T002, T003, T004, T005 (model files) — all parallel
- T010, T013, T017, T023 (service tests) — all parallel once Phase 2 is done
- T015, T019, T020, T021, T025, T028 (child components) — parallel within their story
- T030, T031 (translation files) — parallel
- US1 and US2 entire phases — parallel
- US4 and US5 entire phases — parallel

---

## Parallel Example: User Story 2

```bash
# After T014 (service), launch child component and page in parallel:
Task T015: "Create AddLibraryRootDialogComponent in src/app/features/admin/library-roots/add-library-root-dialog.component.ts"

# Then sequentially:
Task T016: "Create AdminLibraryRootsPageComponent (orchestrates table + dialog)"
```

## Parallel Example: User Story 3

```bash
# After T018 (service), launch all child components in parallel:
Task T019: "Create ScanLauncherComponent"
Task T020: "Create ScanStatusComponent"
Task T021: "Create ScanHistoryTableComponent"

# Then sequentially:
Task T022: "Create AdminScannerPageComponent (orchestrates all children)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001–T008)
2. Complete Phase 2: Foundational (T009)
3. Complete Phase 3: User Story 1 — User Management (T010–T012)
4. Complete Phase 4: User Story 2 — Library Root Management (T013–T016)
5. **STOP and VALIDATE**: Both P1 stories independently testable
6. Add minimal i18n keys for US1/US2 if needed for demo

### Incremental Delivery

1. Setup + Foundational → Admin shell renders with tab navigation
2. Add US1 (Users) → Test user management independently → Demo
3. Add US2 (Library Roots) → Test root management independently → Demo
4. Add US3 (Scanner) → Test scan operations independently → Demo
5. Add US4 (Review) → Test review queue independently → Demo
6. Add US5 (Health) → Test dashboard health panel → Demo
7. Add US6 (i18n) → Verify all text bilingual → Demo
8. Polish → Final validation

### Parallel Team Strategy

With multiple developers after Phase 2 is complete:

- **Developer A**: US1 (Users) → then US3 (Scanner)
- **Developer B**: US2 (Library Roots) → then US4 (Review)
- **Developer C**: US5 (Health/Dashboard) → then US6 (i18n) → then Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- ⚠️ Three backend endpoints are PENDING (see plan.md §Backend API Gaps): `PUT library-roots/{id}/enabled`, `GET scan?page&pageSize`, `Reopen` action — frontend is coded against expected contracts

---

## Phase 10: Setup for US7–US12 (Shared Infrastructure Extension)

**Purpose**: Add new enums, model interfaces, and shared model files needed by user stories 7–12

- [x] T037 Add `ScanDecisionType` and `EnrichmentStatus` enums to `src/app/shared/models/enums.ts`
- [x] T038 [P] Create `ScanItemDecision` and `TvShowGroup` interfaces in `src/app/shared/models/scan-decision.model.ts`
- [x] T039 [P] Create `EnrichmentRun`, `EnrichmentSummary`, and `EnrichmentError` interfaces in `src/app/shared/models/enrichment.model.ts`
- [x] T040 [P] Create `RenamePreview`, `RenameResult`, `BatchRenamePreview`, and `BatchRenameResult` interfaces in `src/app/shared/models/rename.model.ts`

---

## Phase 11: User Story 12 — Legacy NAS Scanner Deprecation (Priority: P1)

**Goal**: Remove the legacy `/nas-scanner` page and redirect to the admin Scanner section

**Independent Test**: Navigate to `/nas-scanner` — verify redirect to `/admin/scanner`. Verify no "NAS Scanner" link in the sidebar. Verify `src/app/features/nas-scanner/` directory no longer exists.

### Implementation for User Story 12

- [x] T041 [US12] Delete the entire `src/app/features/nas-scanner/` directory (all components, routes, service files)
- [x] T042 [US12] Replace the `nas-scanner` lazy-loaded route with `{ path: 'nas-scanner', redirectTo: '/admin/scanner' }` in `src/app/app.routes.ts`
- [x] T043 [US12] Remove the "NAS Scanner" navigation item from `src/app/core/layout/sidebar.component.ts`
- [x] T044 [US12] Remove `nasScanner.*` translation keys from `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`

**Checkpoint**: User Story 12 complete — legacy NAS Scanner page fully removed, URL redirects to admin scanner

---

## Phase 12: User Story 8 — Manual TMDB Search & Assignment (Priority: P2)

**Goal**: Provide a reusable TMDB search panel component that can be embedded in the Review Queue (US4) and Scan Results Browser (US7)

**Independent Test**: Open a review item with no TMDB candidates (NoTmdbResult), click "Search TMDB", enter a title, see TMDB results with poster/year/overview, select a result and click "Assign" — verify the item is resolved and linked

### Implementation for User Story 8

- [x] T045 [US8] Create `TmdbSearchPanelComponent` (standalone, reusable) with PrimeNG `InputText` for query, `Button` for search, `DataView` for results display (title, year, poster via `Image`, overview, media type `Tag`), and `selected` output event emitting `TmdbSearchResult` — accepts `initialQuery` and `mediaTypeFilter` inputs — in `src/app/features/admin/shared/tmdb-search-panel.component.ts`, `src/app/features/admin/shared/tmdb-search-panel.component.html`, and `src/app/features/admin/shared/tmdb-search-panel.component.scss`
- [x] T046 [US8] Integrate `TmdbSearchPanelComponent` into `ReviewResolveDialogComponent` — add "Search TMDB" button that shows the panel in a `Dialog`, wire `(selected)` event to call `AdminReviewService.resolveItem()` with `Assign` action in `src/app/features/admin/review/review-resolve-dialog.component.ts` and `src/app/features/admin/review/review-resolve-dialog.component.html`

**Checkpoint**: User Story 8 complete — manual TMDB search works from the Review Queue; panel is reusable for US7

---

## Phase 13: User Story 7 — Scan Results Browser (Priority: P2)

**Goal**: Admins can browse ALL files from a scan (successful and problematic), filter by decision type/media type/library root/scan run, view TMDB candidates, and reassign TMDB entries

**Independent Test**: Run a scan, navigate to `/admin/scan-results`, verify latest scan is pre-selected with "All" decision type filter, expand a matched file to see candidates, reassign to a different candidate, use "Search TMDB" to manually assign — verify reassignment success toast

### Tests for User Story 7

- [x] T047 [P] [US7] Create unit tests for `AdminScanDecisionService` in `src/app/features/admin/scan-results/admin-scan-decision.service.spec.ts` — test `getDecisions()`, `reassign()`, `getTvGroups()`, `assignTvGroup()`, `renameFile()`, `renameTvGroup()` HTTP calls and signal state updates

### Implementation for User Story 7

- [x] T048 [US7] Implement `AdminScanDecisionService` with signals (`decisions`, `tvGroups`, `loading`, `meta`) and methods `getDecisions(scanId, decisionType?, mediaType?, libraryRootId?, page?, pageSize?)`, `reassign(decisionId, tmdbId, kind)`, `getTvGroups(scanId)`, `assignTvGroup(groupId, tmdbId)`, `renameFile(fileId, preview?)`, `renameTvGroup(groupId, preview?)` in `src/app/features/admin/scan-results/admin-scan-decision.service.ts`
- [x] T049 [P] Create `ScanDecisionDetailComponent` (expanded row) showing TMDB candidates list with poster/title/year/score, "Reassign" button per candidate, and "Search TMDB" button opening `TmdbSearchPanelComponent` in a `Dialog` — in `src/app/features/admin/scan-results/scan-decision-detail.component.ts`, `src/app/features/admin/scan-results/scan-decision-detail.component.html`, and `src/app/features/admin/scan-results/scan-decision-detail.component.scss`
- [x] T050 [P] Create `ScanDecisionTableComponent` with PrimeNG `Table` (server-side pagination, row expansion), columns for file path, decision type `Tag`, assigned TMDB entry (title/year/poster), and timestamp — `Select` filters for decision type, media type, and library root — in `src/app/features/admin/scan-results/scan-decision-table.component.ts`, `src/app/features/admin/scan-results/scan-decision-table.component.html`, and `src/app/features/admin/scan-results/scan-decision-table.component.scss`
- [x] T051 [P] Create `AdminScanResultsPageComponent` orchestrating scan run `Select` (populated from `AdminScanService.getScanHistory()`, defaulting to most recent scan), filter controls, and `ScanDecisionTableComponent` — in `src/app/features/admin/scan-results/admin-scan-results-page.component.ts`, `src/app/features/admin/scan-results/admin-scan-results-page.component.html`, and `src/app/features/admin/scan-results/admin-scan-results-page.component.scss`
- [x] T052 [P] Add `scan-results` and `scan-results/:scanId` child routes to `src/app/features/admin/admin.routes.ts` lazy-loading `AdminScanResultsPageComponent`
- [x] T053 [P] Add "Scan Results" tab to the `tabs` array in `src/app/features/admin/admin-layout.component.ts`

**Checkpoint**: User Story 7 complete — admin can browse all scan decisions, filter, and reassign TMDB entries

---

## Phase 14: User Story 9 — TV Show Parent-Level TMDB Assignment (Priority: P2)

**Goal**: TV show episode files are grouped by parent show in the Scan Results Browser; admin assigns TMDB at show level and it propagates to all episodes

**Independent Test**: Navigate to `/admin/scan-results`, switch to TV show group view, see episodes grouped by show name with episode count, click "Assign TMDB" on a group header, search and select a TV show, confirm — verify all episodes inherit the assignment

**Depends on**: US7 (Scan Results Browser), US8 (TMDB Search Panel)

### Implementation for User Story 9

- [x] T054 [US9] Create `TvShowGroupListComponent` with PrimeNG `Accordion` for show groups (header: show name, episode count `Chip`, TMDB assignment status `Tag`), expanded panel listing episodes, "Assign TMDB" / "Change TMDB" `Button` on group header opening `TmdbSearchPanelComponent` with `initialQuery` pre-filled and `mediaTypeFilter` set to TvShow — in `src/app/features/admin/scan-results/tv-show-group-list.component.ts`, `src/app/features/admin/scan-results/tv-show-group-list.component.html`, and `src/app/features/admin/scan-results/tv-show-group-list.component.scss`
- [x] T055 [US9] Integrate `TvShowGroupListComponent` into `AdminScanResultsPageComponent` — add toggle between flat table view and TV show group view, load groups via `AdminScanDecisionService.getTvGroups()` when group view is selected — modify `src/app/features/admin/scan-results/admin-scan-results-page.component.ts` and `src/app/features/admin/scan-results/admin-scan-results-page.component.html`

**Checkpoint**: User Story 9 complete — TV show episodes grouped by parent show with show-level TMDB assignment

---

## Phase 15: User Story 10 — Batch TMDB Enrichment Scan (Priority: P2)

**Goal**: Admins can launch a batch TMDB enrichment scan, monitor progress via polling, and view results summary

**Independent Test**: Navigate to `/admin/enrichment`, see summary of entries ready for enrichment (new + changed counts, skipped count), click "Start TMDB Enrichment", confirm in dialog, observe progress bar updating via polling, view completion summary with enriched/failed counts

### Tests for User Story 10

- [x] T056 [P] [US10] Create unit tests for `AdminEnrichmentService` in `src/app/features/admin/enrichment/admin-enrichment.service.spec.ts` — test `startEnrichment()`, `getStatus()`, polling lifecycle (start on launch, stop on terminal), signal state, discriminated response handling

### Implementation for User Story 10

- [x] T057 [US10] Implement `AdminEnrichmentService` with signals (`enrichmentStatus`, `summary`, `loading`) and methods `startEnrichment()`, `getStatus()`, plus `interval(4000)` + `switchMap` polling with `takeUntilDestroyed()` and `stopPolling$` subject — in `src/app/features/admin/enrichment/admin-enrichment.service.ts`
- [x] T058 [US10] Create `AdminEnrichmentPageComponent` with enrichment summary panel (new/changed entries count, skipped count from `EnrichmentSummary`), "Start TMDB Enrichment" `Button` with `ConfirmDialog`, PrimeNG `ProgressBar` for running state, results summary panel (enriched/failed/error details), empty state `Message` when nothing to enrich, and prevention of duplicate runs — in `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`, `src/app/features/admin/enrichment/admin-enrichment-page.component.html`, and `src/app/features/admin/enrichment/admin-enrichment-page.component.scss`
- [x] T059 [US10] Add `enrichment` child route to `src/app/features/admin/admin.routes.ts` lazy-loading `AdminEnrichmentPageComponent`
- [x] T060 [US10] Add "Enrichment" tab to the `tabs` array in `src/app/features/admin/admin-layout.component.ts`

**Checkpoint**: User Story 10 complete — admin can launch, monitor, and review batch TMDB enrichment

---

## Phase 16: User Story 11 — Automatic File Renaming (Priority: P3)

**Goal**: Admins can opt-in rename media files on the NAS to match TMDB naming conventions, with preview before confirmation, for both single files and batch TV show renames

**Independent Test**: From Scan Results, expand a matched file, click "Rename File", see preview (current name → proposed name), confirm — verify success toast. From TV show group view, click "Rename All" on a group, see batch preview of all episodes, confirm — verify all renamed.

**Depends on**: US7 (Scan Results — single file rename), US9 (TV Show Groups — batch rename)

### Implementation for User Story 11

- [x] T061 [US11] Create `RenameDialogComponent` (standalone, reusable) with PrimeNG `Dialog` supporting two modes — single file (shows current/proposed name from `RenamePreview`) and batch TV show (shows all proposed renames from `BatchRenamePreview`) — `ConfirmDialog` for final confirmation, error `Message` display, accepts `fileId` or `groupId` + `mode` input — in `src/app/features/admin/shared/rename-dialog.component.ts`, `src/app/features/admin/shared/rename-dialog.component.html`, and `src/app/features/admin/shared/rename-dialog.component.scss`
- [x] T062 [US11] Integrate "Rename File" button into `ScanDecisionDetailComponent` — opens `RenameDialogComponent` in single-file mode after TMDB assignment, calls `AdminScanDecisionService.renameFile()` — modify `src/app/features/admin/scan-results/scan-decision-detail.component.ts` and `src/app/features/admin/scan-results/scan-decision-detail.component.html`
- [x] T063 [US11] Integrate "Rename All Episodes" button into `TvShowGroupListComponent` — opens `RenameDialogComponent` in batch mode, calls `AdminScanDecisionService.renameTvGroup()` — modify `src/app/features/admin/scan-results/tv-show-group-list.component.ts` and `src/app/features/admin/scan-results/tv-show-group-list.component.html`

**Checkpoint**: User Story 11 complete — single file and batch TV show renaming with preview and confirmation

---

## Phase 17: Bilingual Support for US7–US12 (Priority: P3)

**Goal**: All new admin section labels, buttons, messages, table headers, and status indicators for US7–US12 are translated in English and French

**Independent Test**: Switch language to French, navigate to Scan Results, Enrichment, trigger rename dialog and TMDB search panel — verify all visible text appears in French with no untranslated keys

### Implementation for Bilingual Support

- [x] T064 [P] [US6] Add English translation keys (`admin.scanResults.*`, `admin.tmdbSearch.*`, `admin.enrichment.*`, `admin.rename.*`) to `src/assets/i18n/en.json`
- [x] T065 [P] [US6] Add French translation keys (matching `admin.scanResults.*`, `admin.tmdbSearch.*`, `admin.enrichment.*`, `admin.rename.*` structure) to `src/assets/i18n/fr.json`
- [x] T066 [US6] Wire up `transloco` pipes in all new component templates — replace hardcoded strings with `{{ t('admin.*') }}` translation keys in all `.component.html` files under `src/app/features/admin/scan-results/`, `src/app/features/admin/enrichment/`, and `src/app/features/admin/shared/`

**Checkpoint**: All new admin UI (US7–US12) fully bilingual — no untranslated keys in either language

---

## Phase 18: Polish & Cross-Cutting Concerns (US7–US12)

**Purpose**: Final validation, loading states, empty states, error handling, and cleanup for all new admin sub-sections

- [x] T067 [P] Add loading states (`ProgressSpinner` or button `loading` property) to all async operations in scan-results, enrichment, and shared components
- [x] T068 [P] Add empty state `Message` components for empty scan decisions list, no TV show groups, no enrichment entries, and no TMDB search results across new components
- [x] T069 Verify error handling — ensure backend `404`, `409`, `422`, `500` errors from new endpoints (scan-decisions, reassign, tv-groups, enrichment, rename) display meaningful toast messages via existing error interceptor
- [x] T070 Add "View Scan Results" navigation link from `ScanHistoryTableComponent` (completed scan row click) and `ScanStatusComponent` (completed state) to `/admin/scan-results/:scanId` — modify `src/app/features/admin/scanner/scan-history-table.component.ts` and `src/app/features/admin/scanner/scan-status.component.ts`
- [x] T071 Run `quickstart.md` validation for US7–US12 — Build verified ✓, manual browser validation pending. `ng build --configuration development` passes clean with zero errors.

---

## Dependencies & Execution Order (US7–US12)

### Phase Dependencies

- **Setup Extension (Phase 10)**: No dependencies on new phases — can start immediately after existing T036
- **US12 (Phase 11)**: Depends on Phase 10 — independent of other new stories
- **US8 (Phase 12)**: Depends on Phase 10 — independent of other new stories; creates the shared `TmdbSearchPanelComponent` reused by US7 and US9
- **US7 (Phase 13)**: Depends on US8 (needs `TmdbSearchPanelComponent` for reassignment dialog)
- **US9 (Phase 14)**: Depends on US7 (extends the Scan Results page with TV show group view)
- **US10 (Phase 15)**: Depends on Phase 10 — independent of US7/US8/US9/US11
- **US11 (Phase 16)**: Depends on US7 and US9 (rename buttons are integrated into scan-decision-detail and tv-show-group-list)
- **i18n (Phase 17)**: Depends on all new component templates being created (US7–US12)
- **Polish (Phase 18)**: Depends on all new user stories and i18n being complete

### User Story Dependencies (US7–US12)

- **US12 (P1)**: Independent — start after Phase 10 (can parallel with US8, US10)
- **US8 (P2)**: Independent — start after Phase 10 (can parallel with US12, US10)
- **US7 (P2)**: Depends on US8 (`TmdbSearchPanelComponent` must exist)
- **US9 (P2)**: Depends on US7 (extends scan results page)
- **US10 (P2)**: Independent — start after Phase 10 (can parallel with US12, US8, US7)
- **US11 (P3)**: Depends on US7 + US9 (rename buttons integrate into their components)

### Within Each New User Story

- Tests written FIRST (where included); should FAIL before implementation
- Service before page component
- Child/dialog components can be parallel [P] with service
- Page component wires everything together last

### Parallel Opportunities (US7–US12)

- T038, T039, T040 (new model files) — all parallel
- US12 (Phase 11) and US8 (Phase 12) and US10 (Phase 15) — all can run in parallel
- T049, T050 (scan-decision child components) — parallel after T048 (service)
- T064, T065 (translation files) — parallel
- T067, T068 (polish loading/empty states) — parallel

---

## Parallel Example: US7 (Scan Results Browser)

```bash
# After T048 (service), launch child components in parallel:
Task T049: "Create ScanDecisionDetailComponent (expanded row with candidates + reassign)"
Task T050: "Create ScanDecisionTableComponent (paginated table with filters)"

# Then sequentially:
Task T051: "Create AdminScanResultsPageComponent (orchestrates selector + filters + table)"
Task T052: "Add scan-results route to admin.routes.ts"
Task T053: "Add Scan Results tab to admin-layout"
```

## Parallel Example: US10/US12/US8

```bash
# After Phase 10 (setup), these three stories can run fully in parallel:
# Developer A: US12 (T041-T044) — NAS Scanner removal
# Developer B: US8 (T045-T046) — TMDB Search Panel
# Developer C: US10 (T056-T060) — Enrichment

# After US8 completes, US7 can begin (T047-T053)
# After US7 completes, US9 can begin (T054-T055)
# After US9 completes, US11 can begin (T061-T063)
```

---

## Implementation Strategy (US7–US12)

### Priority Order

1. Complete Phase 10: Setup Extension (T037–T040)
2. Complete Phase 11: US12 — NAS Scanner Deprecation (T041–T044) — P1
3. Complete Phase 12: US8 — TMDB Search Panel (T045–T046) — P2, prerequisite for US7
4. Complete Phase 13: US7 — Scan Results Browser (T047–T053) — P2
5. Complete Phase 14: US9 — TV Show Groups (T054–T055) — P2
6. Complete Phase 15: US10 — Enrichment (T056–T060) — P2 (can parallel with US8/US7)
7. Complete Phase 16: US11 — File Renaming (T061–T063) — P3
8. Complete Phase 17: i18n for US7–US12 (T064–T066)
9. Complete Phase 18: Polish (T067–T071)

### Suggested MVP Scope (US7–US12 Extension)

- **MVP**: US12 (remove legacy page) + US8 (TMDB search panel) + US7 (scan results browser)
- **STOP and VALIDATE**: Admin can browse all scan files and reassign TMDB entries
- Then incrementally add US9 → US10 → US11 → i18n → Polish

### Parallel Team Strategy (US7–US12)

With multiple developers after Phase 10 is complete:

- **Developer A**: US12 (NAS Scanner removal) → then US7 (Scan Results)
- **Developer B**: US8 (TMDB Search Panel) → then US9 (TV Show Groups) → then US11 (Renaming)
- **Developer C**: US10 (Enrichment) → then i18n (Phase 17) → then Polish (Phase 18)

---

## Phase 19: User Story 13 — Bulk Review Item Resolution by Shared Parent Folder (Priority: P1)

**Goal**: When resolving a review item, the admin can optionally apply the same TMDB assignment to all other open review items sharing the same parent folder path in a single bulk operation

**Independent Test**: Open a review item resolve dialog for a TV show episode, select a TMDB entry — verify a checkbox appears showing the count of sibling items in the same folder. Check the checkbox and confirm — verify a single `POST /api/v1/admin/review-items/bulk-resolve` call is made and a success toast shows "X review items resolved". Uncheck the checkbox and confirm — verify only the single-item resolve endpoint is called (existing behaviour unchanged).

**Depends on**: Phase 6 (US4 — Review Queue, `AdminReviewService`, `ReviewResolveDialogComponent`) must be complete

### Tests for User Story 13

- [x] T072 [P] [US13] Add unit tests for `bulkResolveByFolder()` to `src/app/features/admin/review/admin-review.service.spec.ts` — test HTTP `POST /api/v1/admin/review-items/bulk-resolve` call with `{ parentFolderPath, action, tmdbId, kind }` payload, verify signal state update and returned resolved count

### Implementation for User Story 13

- [x] T073 [P] [US13] Add `BulkResolveRequest` interface (`parentFolderPath: string; action: string; tmdbId?: number; kind?: string`) and `BulkResolveResult` interface (`resolvedCount: number`) to `src/app/shared/models/review.model.ts`
- [x] T074 [P] [US13] Add `bulkResolveByFolder(parentFolderPath: string, action: string, tmdbId?: number, kind?: string): Observable<BulkResolveResult>` method to `AdminReviewService` calling `POST /api/v1/admin/review-items/bulk-resolve` — in `src/app/features/admin/review/admin-review.service.ts`
- [x] T075 [P] Update `ReviewResolveDialogComponent` to: (1) derive `parentFolderPath` from the review item's `filePath` using client-side path parsing, (2) query the count of open sibling items sharing that parent folder from `AdminReviewService.getItems()` filtered by `parentFolderPath`, (3) show a PrimeNG `Checkbox` labelled "Apply to all X episodes in the same folder" (with sibling count) when siblings exist, (4) on confirm, call `AdminReviewService.bulkResolveByFolder()` when checkbox is checked or `AdminReviewService.resolveItem()` when unchecked, (5) show a success toast "X review items resolved" after bulk resolve, (6) emit a refresh event so `AdminReviewPageComponent` reloads the queue — modify `src/app/features/admin/review/review-resolve-dialog.component.ts` and `src/app/features/admin/review/review-resolve-dialog.component.html`
- [x] T076 [P] Add English translation keys (`admin.review.bulkResolve.checkboxLabel`, `admin.review.bulkResolve.successToast`, `admin.review.bulkResolve.confirmHeader`, `admin.review.bulkResolve.confirmMessage`) to `src/assets/i18n/en.json`
- [x] T077 [P] Add French translation keys (matching `admin.review.bulkResolve.*` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: User Story 13 fully functional — admin can bulk-resolve all sibling review items in one folder/confirm step; single-item resolve path is unchanged when checkbox is unchecked

---

## Phase 20: User Story 14 — Parent Folder TMDB Validation Page (Priority: P2)

**Goal**: Admins can browse all unique TV show parent folders discovered during scans, assign them to TMDB TV show entries, and track their collection import status from a dedicated `/admin/parent-folders` page

**Independent Test**: Navigate to `/admin/parent-folders`, verify paginated table with columns: folder path, episode count, detected show name, and TMDB assignment status `Tag` (Not Assigned / Assigned / In Collection). Filter by status "Not Assigned" — verify only unassigned folders appear. Click "Assign TMDB" on a row — verify `TmdbSearchPanelComponent` opens pre-filled with the parsed show name filtered to TV show results. Select a result and confirm — verify status updates to "Assigned" and a success toast appears. Verify folders already in the media collection show "In Collection" with no assign button.

**Depends on**: Phase 12 (US8 — `TmdbSearchPanelComponent`) must be complete

### Tests for User Story 14

- [x] T078 [P] [US14] Create unit tests for `AdminParentFolderService` in `src/app/features/admin/parent-folders/admin-parent-folder.service.spec.ts` — test `getFolders(page, pageSize, status?)` HTTP `GET /api/v1/admin/parent-folders` call with query params, `assignFolder(folderId, tmdbId, kind)` HTTP `PUT /api/v1/admin/parent-folders/{folderId}/assign` call, signal state updates (`folders`, `loading`, `meta`)

### Implementation for User Story 14

- [x] T079 [P] [US14] Create `ParentFolderGroup` interface (`id: string; folderPath: string; detectedShowName: string; episodeCount: number; status: 'NotAssigned' | 'Assigned' | 'InCollection'; tmdbId?: number; tmdbTitle?: string`) in `src/app/shared/models/parent-folder.model.ts`
- [x] T080 [P] Implement `AdminParentFolderService` with signals (`folders`, `loading`, `meta`) and methods `getFolders(page: number, pageSize: number, status?: string): Observable<PagedResult<ParentFolderGroup>>` calling `GET /api/v1/admin/parent-folders`, and `assignFolder(folderId: string, tmdbId: number, kind: string): Observable<ParentFolderGroup>` calling `PUT /api/v1/admin/parent-folders/{folderId}/assign` — in `src/app/features/admin/parent-folders/admin-parent-folder.service.ts`
- [x] T081 [US14] Create `AdminParentFoldersPageComponent` with PrimeNG `Table` (server-side pagination via `onLazyLoad`, 20 rows per page), columns for folder path, detected show name, episode count, and status `Tag` (severity: `warn` for NotAssigned, `success` for Assigned, `info` for InCollection), `Select` filter for status (All / Not Assigned / Assigned / In Collection), "Assign TMDB" `Button` per row (hidden for InCollection rows) opening `TmdbSearchPanelComponent` in a PrimeNG `Dialog` pre-filled with `detectedShowName` and `mediaTypeFilter` set to TvShow, wiring `(selected)` event to call `AdminParentFolderService.assignFolder()` and refreshing the table — in `src/app/features/admin/parent-folders/admin-parent-folders-page.component.ts`, `src/app/features/admin/parent-folders/admin-parent-folders-page.component.html`, and `src/app/features/admin/parent-folders/admin-parent-folders-page.component.scss`
- [x] T082 [US14] Add `parent-folders` child route to `src/app/features/admin/admin.routes.ts` lazy-loading `AdminParentFoldersPageComponent`
- [x] T083 [US14] Add "Parent Folders" tab (`{ labelKey: 'admin.parentFolders.tab', icon: 'pi pi-folder', route: '/admin/parent-folders' }`) to the `tabs` array in `src/app/features/admin/admin-layout.component.ts`
- [x] T084 [P] Add English translation keys (`admin.parentFolders.tab`, `admin.parentFolders.title`, `admin.parentFolders.columns.*`, `admin.parentFolders.status.*`, `admin.parentFolders.assignButton`, `admin.parentFolders.assignDialog.*`, `admin.parentFolders.assignSuccess`, `admin.parentFolders.filterStatus.*`, `admin.parentFolders.empty`) to `src/assets/i18n/en.json`
- [x] T085 [P] Add French translation keys (matching `admin.parentFolders.*` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: User Story 14 fully functional — admin can view all discovered TV show parent folders, filter by assignment status, assign TMDB entries, and see collection import status

---

## Dependencies & Execution Order (US13–US14)

### Phase Dependencies

- **Phase 19 (US13 — Bulk Review)**: Depends on Phase 6 (US4 — Review Queue must exist; `AdminReviewService` and `ReviewResolveDialogComponent` must be complete). Can start as soon as Phase 6 is done. Independent of Phases 10–18.
- **Phase 20 (US14 — Parent Folders)**: Depends on Phase 12 (US8 — `TmdbSearchPanelComponent` must exist for TMDB assignment dialog). Can start after Phase 12 is done. Independent of Phase 19 (US13).

### User Story Dependencies (US13–US14)

- **US13 (P1)**: Soft dependency on US4 — `AdminReviewService` and `ReviewResolveDialogComponent` must exist. Independent of US14.
- **US14 (P2)**: Soft dependency on US8 — `TmdbSearchPanelComponent` must exist for the assign TMDB dialog. Independent of US13.

### Within Each New User Story

- Tests written FIRST; should FAIL before implementation
- Model interface ([P] with service) before service
- Service before page component / dialog integration
- Translation tasks ([P]) can be written in parallel with any implementation task

### Parallel Opportunities (US13–US14)

- T072 (US13 service test) and T073 (US13 model) — parallel
- T076, T077 (US13 translation files) — parallel with each other and with T075 (dialog update)
- T078 (US14 service test) and T079 (US14 model) — parallel
- T084, T085 (US14 translation files) — parallel with each other and with T081 (page component)
- Phase 19 (US13) and Phase 20 (US14) — the two phases can run fully in parallel once their respective prerequisites (US4 and US8) are met

---

## Phase 21: Adjustment — Scan Results TV Show Episode Deduplication & Grouping (Priority: P2)

**Goal**: In the scan results, TV show episodes from the same show (even across languages or with duplicate file paths) are deduplicated and visually grouped/collapsed by show, so the admin can quickly scan unique shows rather than wading through hundreds of duplicate episode rows

**Independent Test**: Navigate to `/admin/scan-results`, verify the default view uses server-side grouped data from `GET /api/v1/admin/scan/{scanId}/decisions/grouped`. Verify episodes from the same TV show are grouped under a collapsible show header showing: normalized show name, episode count, TMDB assignment status `Tag`, and poster. Verify no duplicate file paths appear within a group. Verify expand/collapse works for each group. Verify movie decisions appear as single-item groups. Verify filters (decisionType, mediaType, libraryRootId) are passed through to the grouped endpoint.

**Depends on**: Phase 13 (US7 — Scan Results Browser) must be complete

**✅ Backend Ready**: `GET /api/v1/admin/scan/{scanId}/decisions/grouped` endpoint exists in `AdminScanController`. Returns `List<ScanDecisionShowGroupDto>` — server-side deduplication by file path (keeps latest `decidedAt`), grouping by normalized `parsedTitle` for TV shows (strips language suffixes like VF/VOSTFR/Multi), movies remain as single-item groups. Supports `decisionType`, `mediaType`, `libraryRootId` query params.

**Response shape** (`ScanDecisionShowGroupDto`):

```
{ showName, episodeCount, assignedTmdbId?, assignedKind?, assignedTitle?, assignedYear?, assignedPosterPath?, episodes: ScanItemDecisionDto[] }
```

### Implementation for TV Show Deduplication

- [x] T086 [P] Add `ScanDecisionShowGroup` interface to `src/app/shared/models/scan-decision.model.ts` matching the backend `ScanDecisionShowGroupDto` shape: `showName: string; episodeCount: number; assignedTmdbId?: number; assignedKind?: string; assignedTitle?: string; assignedYear?: number; assignedPosterPath?: string; episodes: ScanItemDecision[]`
- [x] T087 [P] Add `getGroupedDecisions(scanId: string, decisionType?: string, mediaType?: string, libraryRootId?: string): void` method and `groupedDecisions` signal (`ScanDecisionShowGroup[]`) to `AdminScanDecisionService` — calls `GET /api/v1/admin/scan/{scanId}/decisions/grouped` with optional query params — modify `src/app/features/admin/scan-results/admin-scan-decision.service.ts`
- [x] T088 Update `ScanDecisionTableComponent` to use server-side grouped data: (1) call `AdminScanDecisionService.getGroupedDecisions()` instead of `getDecisions()` as the default view, (2) render groups using collapsible show-level headers showing `showName`, `episodeCount` `Chip`, TMDB assignment status `Tag` + poster thumbnail, (3) expanded episodes listed as sub-rows within each group, (4) single-item groups (movies) rendered as regular rows without collapsible header, (5) pass `decisionType`, `mediaType`, `libraryRootId` filter values through to `getGroupedDecisions()` — modify `src/app/features/admin/scan-results/scan-decision-table.component.ts`, `src/app/features/admin/scan-results/scan-decision-table.component.html`, and `src/app/features/admin/scan-results/scan-decision-table.component.scss`
- [x] T089 [P] Add English translation keys (`admin.scanResults.groupHeader`, `admin.scanResults.showName`, `admin.scanResults.groupedView`, `admin.scanResults.flatView`) to `src/assets/i18n/en.json`
- [x] T090 [P] Add French translation keys (matching `admin.scanResults.groupHeader`, `admin.scanResults.showName`, `admin.scanResults.groupedView`, `admin.scanResults.flatView` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: Scan results use server-side grouped endpoint — TV show episodes are deduplicated and collapsed under show headers; movies appear as regular rows

---

## Phase 22: Adjustment — Review Queue Batch Assign Siblings by Root Parent Folder (Priority: P1)

**Goal**: When the admin assigns a TV show TMDB entry to a review item, they can optionally apply the same assignment to ALL other open review items sharing the same **root parent folder** (not just the immediate parent), enabling bulk resolution of entire TV show folder trees in one action

**Independent Test**: Open a review item resolve dialog for a TV show episode nested in a deep folder (e.g., `/nas/tv/ShowName/Season 1/episode.mkv`). Select a TMDB TV show and click Assign — verify a checkbox appears showing the count of sibling items under the same root parent folder (e.g., `/nas/tv/ShowName`). Check the checkbox and confirm — verify `bulkResolveByFolder()` is called with the root parent folder path and all sibling items are resolved. Test with items in different subfolders (Season 1, Season 2) under the same root parent — verify they are all included.

**Depends on**: Phase 19 (US13 — Bulk Review by folder) must be complete

**✅ Backend Ready**: `POST /api/v1/admin/review-items/bulk-resolve` already uses **prefix match** (`FilePath.StartsWith(folder + "/")`) — passing a root parent folder path like `/nas/tv/ShowName` will match all items under all subfolders (Season 1, Season 2, etc.). No backend changes needed.

**Request body** (`BulkResolveReviewRequest`):

```
{ parentFolderPath: string, action: ReviewResolutionAction, tmdbId?: number, kind?: MediaType }
```

**Response** (`BulkResolveResult`): `{ resolvedCount: number }`

### Implementation for Batch Assign Siblings

- [x] T091 [P] Add `deriveRootParentFolder(filePath: string, items: ReviewItem[]): string` function to derive the deepest common ancestor folder path among all open review items — add to `src/app/features/admin/review/review-path.util.ts` as a new utility file. The function should: (1) extract the parent folder from the given filePath, (2) walk up the path segments, (3) find the shortest prefix that still contains at least one other open sibling item, (4) return that root parent folder path. The backend already does prefix matching (`startsWith`) so this path will match all nested subfolders.
- [x] T092 [P] Create unit tests for `deriveRootParentFolder()` in `src/app/features/admin/review/review-path.util.spec.ts` — test with deep nested paths (e.g., `/nas/tv/ShowName/Season 1/ep.mkv` and `/nas/tv/ShowName/Season 2/ep.mkv` → root parent `/nas/tv/ShowName`), test with items only in same immediate folder, test with no siblings
- [x] T093 Update `ReviewResolveDialogComponent` to use root parent folder for sibling detection: (1) replace `parentFolderPath` computed with `rootParentFolderPath` using `deriveRootParentFolder()`, (2) update `siblingCount` computed to count ALL open items whose filePath starts with the root parent folder path (prefix match instead of exact parent match), (3) update the bulk resolve checkbox label to show the root parent folder path for clarity, (4) pass the root parent folder path to `bulkResolveByFolder()` when checkbox is checked — modify `src/app/features/admin/review/review-resolve-dialog.component.ts` and `src/app/features/admin/review/review-resolve-dialog.component.html`
- [x] T094 [P] Add English translation keys (`admin.review.bulkResolve.rootFolderLabel`, `admin.review.bulkResolve.rootFolderHint`) to `src/assets/i18n/en.json`
- [x] T095 [P] Add French translation keys (matching `admin.review.bulkResolve.rootFolderLabel`, `admin.review.bulkResolve.rootFolderHint` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: Review resolve dialog detects sibling review items across the entire TV show folder tree (all seasons/subfolders) and bulk-assigns them all in one operation

---

## Phase 23: Adjustment — Enrichment Page Clarification & Useful Information (Priority: P2)

**Goal**: The enrichment page clearly explains what enrichment does, shows a pre-flight summary of pending work, displays a paginated history of past enrichment runs with status/details, and shows error details for failed enrichments with proper empty states

**Independent Test**: Navigate to `/admin/enrichment`. Verify a description section explains that enrichment fetches detailed TMDB metadata (cast, crew, genres, ratings) for already-matched media entries. Verify a summary card shows counts: "New" (never enriched), "Changed" (updated since last run), "Skipped" (already up-to-date), and "Total Eligible". Verify past enrichment runs are displayed in a paginated history table with status `Tag`, started/finished timestamps, enrichedCount/failedCount/skippedCount columns. Verify expanding a failed run shows per-entry error details (mediaId, title, error message). Verify empty states show explanatory text when no runs exist or nothing needs enrichment.

**Depends on**: Phase 15 (US10 — Enrichment) must be complete

**✅ Backend Ready**: Three endpoints are available:

- `GET /api/v1/admin/enrichment/summary` → `EnrichmentSummaryDto { newCount, changedCount, skippedCount, totalEligible }`
- `GET /api/v1/admin/enrichment/history?page&pageSize` → paginated `List<EnrichmentRunDto>` with `ApiResponseMeta`
- `GET /api/v1/admin/enrichment/status` → latest `EnrichmentRunDto` or `null`

**`EnrichmentRunDto` shape**:

```
{ enrichmentRunId, status (EnrichmentStatus), startedAt, finishedAt?, totalItems, enrichedCount, failedCount, skippedCount, currentItem?, errorDetails: EnrichmentErrorDetailDto[] }
```

### Implementation for Enrichment Page Improvements

- [x] T096 [P] Update `EnrichmentRun` interface in `src/app/shared/models/enrichment.model.ts` to match exact backend `EnrichmentRunDto` shape: add `enrichmentRunId: string; totalItems: number; enrichedCount: number; failedCount: number; skippedCount: number; currentItem: string | null; errorDetails: EnrichmentErrorDetail[]`. Add `EnrichmentErrorDetail` interface: `{ mediaId: string; tmdbId: number | null; title: string | null; error: string }`. Add `EnrichmentSummaryDetail` interface: `{ newCount: number; changedCount: number; skippedCount: number; totalEligible: number }` (if not already matching `EnrichmentSummary`).
- [x] T097 [P] Add `getHistory(page: number, pageSize: number): void` method with `enrichmentHistory` signal (`EnrichmentRun[]`) and `historyMeta` signal, and `getSummary(): void` method with `enrichmentSummary` signal (`EnrichmentSummaryDetail | null`) to `AdminEnrichmentService` — `getHistory()` calls `GET /api/v1/admin/enrichment/history`, `getSummary()` calls `GET /api/v1/admin/enrichment/summary` — modify `src/app/features/admin/enrichment/admin-enrichment.service.ts`
- [x] T098 [P] Add unit tests for `getHistory()` and `getSummary()` to `src/app/features/admin/enrichment/admin-enrichment.service.spec.ts` — test HTTP `GET /api/v1/admin/enrichment/history?page=1&pageSize=20` call with pagination params and signal updates, test HTTP `GET /api/v1/admin/enrichment/summary` call and signal update
- [x] T099 Update `AdminEnrichmentPageComponent` to add: (1) a description section at the top explaining enrichment purpose (fetches detailed TMDB metadata — cast, crew, genres, ratings, images — for media entries that have been matched to TMDB during scanning), (2) enhanced summary card using `getSummary()` showing "New" count (`newCount`), "Changed" count (`changedCount`), "Already up-to-date" count (`skippedCount`), and "Total eligible" count (`totalEligible`), (3) enrichment history table using PrimeNG `Table` with server-side pagination via `getHistory()` showing past runs (status `Tag` with severity mapping: `success` for Completed, `danger` for Failed, `warn` for Running, `info` for Queued; started/finished timestamps; enrichedCount/failedCount/skippedCount columns; row expansion for error details), (4) expanded error details panel showing `EnrichmentErrorDetail[]` per run with `p-message` severity="error" listing mediaId, title, and error message, (5) proper empty states with `p-message` severity="info" for: no enrichment history ("No enrichment runs have been recorded yet"), nothing to enrich ("All matched media entries are already enriched and up-to-date") — modify `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`, `src/app/features/admin/enrichment/admin-enrichment-page.component.html`, and `src/app/features/admin/enrichment/admin-enrichment-page.component.scss`
- [x] T100 [P] Add English translation keys (`admin.enrichment.description`, `admin.enrichment.descriptionDetail`, `admin.enrichment.summary.newCount`, `admin.enrichment.summary.changedCount`, `admin.enrichment.summary.skippedCount`, `admin.enrichment.summary.totalEligible`, `admin.enrichment.historyTitle`, `admin.enrichment.historyColumns.status`, `admin.enrichment.historyColumns.startedAt`, `admin.enrichment.historyColumns.finishedAt`, `admin.enrichment.historyColumns.enriched`, `admin.enrichment.historyColumns.failed`, `admin.enrichment.historyColumns.skipped`, `admin.enrichment.historyEmpty`, `admin.enrichment.errorDetails`, `admin.enrichment.errorMediaId`, `admin.enrichment.errorTitle`, `admin.enrichment.errorMessage`, `admin.enrichment.nothingToEnrich`) to `src/assets/i18n/en.json`
- [x] T101 [P] Add French translation keys (matching all `admin.enrichment.*` keys from T100) to `src/assets/i18n/fr.json`

**Checkpoint**: Enrichment page clearly explains its purpose, shows pre-flight summary from `/summary` endpoint, displays paginated history from `/history` endpoint with expandable error details per run, and provides descriptive empty states

---

## Phase 24: Polish & Cross-Cutting Concerns (Adjustments)

**Purpose**: Final validation, loading states, error handling for all three adjustments

- [x] T102 [P] Verify loading states for new async operations: `TvShowDeduplicationUtil` processing indicator, enrichment history table loading, root parent folder sibling count loading
- [x] T103 [P] Verify error handling for enrichment history endpoint failures and bulk resolve with root parent folder path — ensure meaningful toast messages via existing error interceptor
- [x] T104 Run manual validation of all three adjustments: (1) scan results deduplication with a multi-language TV show library, (2) review queue bulk assign with nested Season folders, (3) enrichment page description + history + empty states

**Checkpoint**: All adjustments validated end-to-end

---

## Dependencies & Execution Order (Adjustments — Phases 21–24)

### Phase Dependencies

- **Phase 21 (Scan Results Deduplication)**: Depends on Phase 13 (US7 — Scan Results Browser must be complete). Independent of Phases 22 and 23.
- **Phase 22 (Review Batch Assign Siblings)**: Depends on Phase 19 (US13 — Bulk Review must be complete). Independent of Phases 21 and 23.
- **Phase 23 (Enrichment Page Improvements)**: Depends on Phase 15 (US10 — Enrichment must be complete). Independent of Phases 21 and 22.
- **Phase 24 (Polish)**: Depends on Phases 21, 22, and 23 being complete.

### Parallel Opportunities (Adjustments)

- **Phases 21, 22, and 23 can all run fully in parallel** — they touch different subsystems (scan-results, review, enrichment)
- T086, T087 (model + service method) — parallel
- T089, T090 (Phase 21 translations) — parallel with each other and with T088
- T091, T092 (Phase 22 translations) — parallel with each other and with T093
- T096, T097, T098 (enrichment model + service + tests) — parallel (backend endpoints ready)
- T100, T101 (Phase 23 translations) — parallel with each other and with T099
- T102, T103 (Phase 24 polish) — parallel

### Within Each Adjustment Phase

- Utility/model tasks can run in parallel with test tasks
- Service changes before component changes
- Translation tasks [P] can run parallel with any implementation task
- Component updates are sequential after service/utility dependencies

### Parallel Example: All Three Adjustments

```bash
# All three phases can start simultaneously:
# Developer A: Phase 21 — Scan Results Deduplication (T086-T090)
# Developer B: Phase 22 — Review Batch Assign Siblings (T091-T095)
# Developer C: Phase 23 — Enrichment Page Improvements (T096-T101)

# After all three complete:
# Any developer: Phase 24 — Polish & Validation (T102-T104)
```

### Parallel Example: Phase 21 (Deduplication)

```bash
# Parallel: model and service method simultaneously
Task T086: "Add ScanDecisionShowGroup interface to scan-decision.model.ts"
Task T087: "Add getGroupedDecisions() to AdminScanDecisionService"

# Then sequentially (T087 must be complete):
Task T088: "Update ScanDecisionTableComponent to use grouped endpoint"

# Parallel with T088 (different files):
Task T089: "Add grouping i18n keys to en.json"
Task T090: "Add grouping i18n keys to fr.json"
```

### Parallel Example: Phase 22 (Batch Assign Siblings)

```bash
# Parallel: utility and tests simultaneously
Task T091: "Create deriveRootParentFolder() in review-path.util.ts"
Task T092: "Create unit tests in review-path.util.spec.ts"

# Then sequentially (T091 must be complete):
Task T093: "Update ReviewResolveDialogComponent with root parent folder logic"

# Parallel with T093 (different files):
Task T094: "Add root folder i18n keys to en.json"
Task T095: "Add root folder i18n keys to fr.json"
```

---

## Phase 25: Issue Fix — Scan Results Show-Level Navigation & Reassign Bug (Priority: P1)

**Goal**: Make the TV show group view the default/primary view on scan results, display TMDB candidates at the show level (not per-file), and fix the reassign bug for already-enriched media entries

**Independent Test**: Navigate to `/admin/scan-results`, verify the grouped view is the only default view (no separate "TV Show Groups" toggle at page level). Verify each show group header displays TMDB candidates (poster, title, year, score) from the grouped episodes. Verify selecting a candidate assigns it to ALL files in the group. Verify reassigning an already-enriched media entry to a different TMDB show/movie works without errors.

**Depends on**: Phase 21 (Scan Results Deduplication), Phase 14 (US9 — TV Show Groups)

### Implementation for Scan Results Show-Level Navigation

- [x] T105 [P] Investigate and document reassign bug for already-enriched media — test `PUT /api/v1/admin/scan-decisions/{id}/reassign` with a decision whose linked `MediaFile` already has an enriched `Media` entry. Check if the issue is (a) frontend not sending correct payload, (b) backend `ReassignTmdbCommandHandler` not handling existing Media links, or (c) UI disabling the reassign button incorrectly. Document findings in a code comment in `src/app/features/admin/scan-results/scan-decision-detail.component.ts`
- [x] T106 Update `AdminScanResultsPageComponent` to remove the page-level `viewMode` toggle between "table" and "groups" — the grouped view (`ScanDecisionTableComponent` with `useGroupedView=true`) is now the only default view. Remove `TvShowGroupListComponent` import and its template usage from the page since the grouped table already handles show grouping. Keep the flat table toggle button inside `ScanDecisionTableComponent` for users who need it — modify `src/app/features/admin/scan-results/admin-scan-results-page.component.ts` and `src/app/features/admin/scan-results/admin-scan-results-page.component.html`
- [x] T107 [P] Update `ScanDecisionShowGroup` interface in `src/app/shared/models/scan-decision.model.ts` to add `candidates: TmdbCandidate[]` field aggregated from group episodes (backend should provide this; if not, frontend aggregates from `episodes[0].candidates`)
- [x] T108 Update `ScanDecisionTableComponent` group header to display show-level TMDB candidates — when a group is expanded, show a candidates section with poster thumbnails, title, year, score, and "Assign to All" button per candidate. When "Assign to All" is clicked, call `AdminScanDecisionService.assignTvGroup()` to assign the selected TMDB entry to all episodes in the group. Add a "Search TMDB" button that opens `TmdbSearchPanelComponent` in a dialog for manual assignment at show level — modify `src/app/features/admin/scan-results/scan-decision-table.component.ts`, `src/app/features/admin/scan-results/scan-decision-table.component.html`, and `src/app/features/admin/scan-results/scan-decision-table.component.scss`
- [x] T109 [P] Fix reassign for already-enriched media — based on T105 findings, update `ScanDecisionDetailComponent` to ensure the reassign button is always enabled regardless of enrichment status, and ensure the `reassign()` API call sends the correct payload. If the issue is backend, add a task to the API tasks.md — modify `src/app/features/admin/scan-results/scan-decision-detail.component.ts` and `src/app/features/admin/scan-results/scan-decision-detail.component.html`
- [x] T110 [P] Add English translation keys (`admin.scanResults.assignToAll`, `admin.scanResults.showCandidates`, `admin.scanResults.reassignEnriched`) to `src/assets/i18n/en.json`
- [x] T111 [P] Add French translation keys (matching `admin.scanResults.assignToAll`, `admin.scanResults.showCandidates`, `admin.scanResults.reassignEnriched` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: Scan results page defaults to show-level grouped view with TMDB candidates displayed per show group; reassign works for both new and already-enriched media entries

---

## Phase 26: Issue Fix — Enrichment Page Per-Media Details (Priority: P2)

**Goal**: Each enrichment run in the history table shows detailed per-media results: which TV show/movie was added/enriched, how many files were affected, and their file names

**Independent Test**: Navigate to `/admin/enrichment`, run an enrichment, wait for completion. Expand the completed run in the history table — verify a detailed breakdown showing each media entry (title, TMDB ID, type) with a list of affected file names and a count. Verify both successful and failed entries are shown with appropriate severity indicators.

**Depends on**: Phase 23 (Enrichment Page Improvements), Backend Phase 16 (new endpoint for per-media details)

### Implementation for Enrichment Per-Media Details

- [x] T112 [P] Create `EnrichmentMediaDetail` interface in `src/app/shared/models/enrichment.model.ts` — fields: `mediaId: string; tmdbId: number; title: string; type: string; status: 'Enriched' | 'Failed' | 'Skipped'; fileCount: number; fileNames: string[]; error: string | null`
- [x] T113 [P] Add `getRunDetails(runId: string): void` method with `runDetails` signal (`EnrichmentMediaDetail[]`) and `runDetailsLoading` signal to `AdminEnrichmentService` — calls `GET /api/v1/admin/enrichment/{runId}/details` — modify `src/app/features/admin/enrichment/admin-enrichment.service.ts`
- [x] T114 Update `AdminEnrichmentPageComponent` enrichment history table row expansion to show per-media details: (1) on row expand, call `AdminEnrichmentService.getRunDetails(runId)` to fetch detailed breakdown, (2) display a sub-table with columns: media title, TMDB ID, type `Tag`, status `Tag` (success for Enriched, danger for Failed, secondary for Skipped), file count, (3) add a nested expansion for each media row showing the list of affected file names, (4) keep existing error details display as a fallback when per-media details are not available — modify `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`, `src/app/features/admin/enrichment/admin-enrichment-page.component.html`, and `src/app/features/admin/enrichment/admin-enrichment-page.component.scss`
- [x] T115 [P] Add English translation keys (`admin.enrichment.mediaDetails`, `admin.enrichment.mediaDetails.title`, `admin.enrichment.mediaDetails.tmdbId`, `admin.enrichment.mediaDetails.type`, `admin.enrichment.mediaDetails.status`, `admin.enrichment.mediaDetails.fileCount`, `admin.enrichment.mediaDetails.files`, `admin.enrichment.mediaDetails.statusEnriched`, `admin.enrichment.mediaDetails.statusFailed`, `admin.enrichment.mediaDetails.statusSkipped`) to `src/assets/i18n/en.json`
- [x] T116 [P] Add French translation keys (matching `admin.enrichment.mediaDetails.*` structure) to `src/assets/i18n/fr.json`

**Checkpoint**: Enrichment run history shows detailed per-media breakdown with affected file names for each enrichment run

---

## Phase 27: Issue Fix — Media Details Page Files & Seasons Loading Errors (Priority: P1)

**Goal**: Fix loading errors on the media details page for files and seasons data, add proper error handling and graceful degradation

**Independent Test**: Navigate to a TV show media detail page — verify seasons load without errors and episode list renders correctly. Navigate to a movie media detail page — verify media files list loads without errors. Verify that when the API returns unexpected data shapes (null arrays, missing fields), the page gracefully degrades with empty state messages instead of throwing errors.

**Depends on**: No admin dashboard dependencies — this is in the media-detail feature

### Implementation for Media Details Error Fixes

- [x] T117 [P] Add null-safety guards to `MediaDetailService.loadMedia()` — ensure `response.data.mediaFiles` defaults to `[]` if null/undefined, ensure `response.data.genres` defaults to `[]` if null/undefined, ensure `response.data.tvSeasons` defaults to `[]` if null/undefined. Add error handler to `loadSeasons()` subscriber that sets a `seasonsError` signal instead of silently failing — modify `src/app/features/media-detail/media-detail.service.ts`
- [x] T118 [P] Add `seasonsError` and `filesError` signals to `MediaDetailService` — `seasonsError` is set when `GET media/{id}/seasons` fails, `filesError` is set when media files data is malformed — modify `src/app/features/media-detail/media-detail.service.ts`
- [x] T119 Update `MediaDetailPageComponent` template to add error states for files and seasons sections — show `app-error-message` with retry button when `service.seasonsError()` is set, show empty state message when `media.mediaFiles` is empty instead of potentially erroring on null access. Add `seasonsLoading` indicator using `ProgressSpinner` while seasons are loading — modify `src/app/features/media-detail/media-detail-page.component.html`
- [x] T120 [P] Add null-safety to `MediaFilesComponent` — ensure `files()` input handles null/undefined gracefully by defaulting to empty array, add optional chaining for `file.format` and `file.resolution` access — modify `src/app/features/media-detail/media-files.component.ts`
- [x] T121 [P] Add null-safety to `SeasonListComponent` — ensure `seasons()` input handles null/undefined gracefully, add defensive checks for `season.tvEpisodes` being null/undefined (default to `[]`), add optional chaining for `season.episodeCount` and `season.watchedCount` — modify `src/app/features/media-detail/season-list.component.ts`
- [x] T122 [P] Add null-safety to `EpisodeItemComponent` — ensure `episode().userEpisode` optional chaining is used consistently for all property accesses, handle case where `episode()` input could have null fields — modify `src/app/features/media-detail/episode-item.component.ts`
- [x] T123 Verify `Media` interface in `src/app/shared/models/media.model.ts` matches the actual API response — check if `mediaFiles`, `genres`, and `tvSeasons` should be optional (`?`) or nullable (`| null`) to match the backend DTO. Update interface if needed to prevent type errors at runtime — modify `src/app/shared/models/media.model.ts`
- [x] T124 [P] Add English translation keys (`media.seasonsError`, `media.filesError`, `media.seasonsLoading`) to `src/assets/i18n/en.json`
- [x] T125 [P] Add French translation keys (matching `media.seasonsError`, `media.filesError`, `media.seasonsLoading`) to `src/assets/i18n/fr.json`

**Checkpoint**: Media details page loads files and seasons without errors; graceful degradation when data is missing or malformed

---

## Phase 28: Polish & Validation (Issue Fixes)

**Purpose**: Final validation of all three issue fixes

- [x] T126 [P] Verify loading states for new async operations: show-level candidate assignment loading, enrichment per-media details loading, seasons loading spinner
- [x] T127 [P] Verify error handling for reassign on enriched media, enrichment details endpoint failures, and media detail page API failures — ensure meaningful toast messages or error states
- [x] T128 Run manual validation of all three issue fixes: (1) scan results show-level navigation with TV show library, (2) enrichment run details showing per-media breakdown, (3) media detail page loading files and seasons without errors

**Checkpoint**: All issue fixes validated end-to-end
