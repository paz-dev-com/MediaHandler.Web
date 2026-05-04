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
- [x] T049 [P] [US7] Create `ScanDecisionDetailComponent` (expanded row) showing TMDB candidates list with poster/title/year/score, "Reassign" button per candidate, and "Search TMDB" button opening `TmdbSearchPanelComponent` in a `Dialog` — in `src/app/features/admin/scan-results/scan-decision-detail.component.ts`, `src/app/features/admin/scan-results/scan-decision-detail.component.html`, and `src/app/features/admin/scan-results/scan-decision-detail.component.scss`
- [x] T050 [P] [US7] Create `ScanDecisionTableComponent` with PrimeNG `Table` (server-side pagination, row expansion), columns for file path, decision type `Tag`, assigned TMDB entry (title/year/poster), and timestamp — `Select` filters for decision type, media type, and library root — in `src/app/features/admin/scan-results/scan-decision-table.component.ts`, `src/app/features/admin/scan-results/scan-decision-table.component.html`, and `src/app/features/admin/scan-results/scan-decision-table.component.scss`
- [x] T051 [P] [US7] Create `AdminScanResultsPageComponent` orchestrating scan run `Select` (populated from `AdminScanService.getScanHistory()`, defaulting to most recent scan), filter controls, and `ScanDecisionTableComponent` — in `src/app/features/admin/scan-results/admin-scan-results-page.component.ts`, `src/app/features/admin/scan-results/admin-scan-results-page.component.html`, and `src/app/features/admin/scan-results/admin-scan-results-page.component.scss`
- [x] T052 [P] [US7] Add `scan-results` and `scan-results/:scanId` child routes to `src/app/features/admin/admin.routes.ts` lazy-loading `AdminScanResultsPageComponent`
- [x] T053 [P] [US7] Add "Scan Results" tab to the `tabs` array in `src/app/features/admin/admin-layout.component.ts`

**Checkpoint**: User Story 7 complete — admin can browse all scan decisions, filter, and reassign TMDB entries

---

## Phase 14: User Story 9 — TV Show Parent-Level TMDB Assignment (Priority: P2)

**Goal**: TV show episode files are grouped by parent show in the Scan Results Browser; admin assigns TMDB at show level and it propagates to all episodes

**Independent Test**: Navigate to `/admin/scan-results`, switch to TV show group view, see episodes grouped by show name with episode count, click "Assign TMDB" on a group header, search and select a TV show, confirm — verify all episodes inherit the assignment

**Depends on**: US7 (Scan Results Browser), US8 (TMDB Search Panel)

### Implementation for User Story 9

- [ ] T054 [US9] Create `TvShowGroupListComponent` with PrimeNG `Accordion` for show groups (header: show name, episode count `Chip`, TMDB assignment status `Tag`), expanded panel listing episodes, "Assign TMDB" / "Change TMDB" `Button` on group header opening `TmdbSearchPanelComponent` with `initialQuery` pre-filled and `mediaTypeFilter` set to TvShow — in `src/app/features/admin/scan-results/tv-show-group-list.component.ts`, `src/app/features/admin/scan-results/tv-show-group-list.component.html`, and `src/app/features/admin/scan-results/tv-show-group-list.component.scss`
- [ ] T055 [US9] Integrate `TvShowGroupListComponent` into `AdminScanResultsPageComponent` — add toggle between flat table view and TV show group view, load groups via `AdminScanDecisionService.getTvGroups()` when group view is selected — modify `src/app/features/admin/scan-results/admin-scan-results-page.component.ts` and `src/app/features/admin/scan-results/admin-scan-results-page.component.html`

**Checkpoint**: User Story 9 complete — TV show episodes grouped by parent show with show-level TMDB assignment

---

## Phase 15: User Story 10 — Batch TMDB Enrichment Scan (Priority: P2)

**Goal**: Admins can launch a batch TMDB enrichment scan, monitor progress via polling, and view results summary

**Independent Test**: Navigate to `/admin/enrichment`, see summary of entries ready for enrichment (new + changed counts, skipped count), click "Start TMDB Enrichment", confirm in dialog, observe progress bar updating via polling, view completion summary with enriched/failed counts

### Tests for User Story 10

- [ ] T056 [P] [US10] Create unit tests for `AdminEnrichmentService` in `src/app/features/admin/enrichment/admin-enrichment.service.spec.ts` — test `startEnrichment()`, `getStatus()`, polling lifecycle (start on launch, stop on terminal), signal state, discriminated response handling

### Implementation for User Story 10

- [ ] T057 [US10] Implement `AdminEnrichmentService` with signals (`enrichmentStatus`, `summary`, `loading`) and methods `startEnrichment()`, `getStatus()`, plus `interval(4000)` + `switchMap` polling with `takeUntilDestroyed()` and `stopPolling$` subject — in `src/app/features/admin/enrichment/admin-enrichment.service.ts`
- [ ] T058 [US10] Create `AdminEnrichmentPageComponent` with enrichment summary panel (new/changed entries count, skipped count from `EnrichmentSummary`), "Start TMDB Enrichment" `Button` with `ConfirmDialog`, PrimeNG `ProgressBar` for running state, results summary panel (enriched/failed/error details), empty state `Message` when nothing to enrich, and prevention of duplicate runs — in `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`, `src/app/features/admin/enrichment/admin-enrichment-page.component.html`, and `src/app/features/admin/enrichment/admin-enrichment-page.component.scss`
- [ ] T059 [US10] Add `enrichment` child route to `src/app/features/admin/admin.routes.ts` lazy-loading `AdminEnrichmentPageComponent`
- [ ] T060 [US10] Add "Enrichment" tab to the `tabs` array in `src/app/features/admin/admin-layout.component.ts`

**Checkpoint**: User Story 10 complete — admin can launch, monitor, and review batch TMDB enrichment

---

## Phase 16: User Story 11 — Automatic File Renaming (Priority: P3)

**Goal**: Admins can opt-in rename media files on the NAS to match TMDB naming conventions, with preview before confirmation, for both single files and batch TV show renames

**Independent Test**: From Scan Results, expand a matched file, click "Rename File", see preview (current name → proposed name), confirm — verify success toast. From TV show group view, click "Rename All" on a group, see batch preview of all episodes, confirm — verify all renamed.

**Depends on**: US7 (Scan Results — single file rename), US9 (TV Show Groups — batch rename)

### Implementation for User Story 11

- [ ] T061 [US11] Create `RenameDialogComponent` (standalone, reusable) with PrimeNG `Dialog` supporting two modes — single file (shows current/proposed name from `RenamePreview`) and batch TV show (shows all proposed renames from `BatchRenamePreview`) — `ConfirmDialog` for final confirmation, error `Message` display, accepts `fileId` or `groupId` + `mode` input — in `src/app/features/admin/shared/rename-dialog.component.ts`, `src/app/features/admin/shared/rename-dialog.component.html`, and `src/app/features/admin/shared/rename-dialog.component.scss`
- [ ] T062 [US11] Integrate "Rename File" button into `ScanDecisionDetailComponent` — opens `RenameDialogComponent` in single-file mode after TMDB assignment, calls `AdminScanDecisionService.renameFile()` — modify `src/app/features/admin/scan-results/scan-decision-detail.component.ts` and `src/app/features/admin/scan-results/scan-decision-detail.component.html`
- [ ] T063 [US11] Integrate "Rename All Episodes" button into `TvShowGroupListComponent` — opens `RenameDialogComponent` in batch mode, calls `AdminScanDecisionService.renameTvGroup()` — modify `src/app/features/admin/scan-results/tv-show-group-list.component.ts` and `src/app/features/admin/scan-results/tv-show-group-list.component.html`

**Checkpoint**: User Story 11 complete — single file and batch TV show renaming with preview and confirmation

---

## Phase 17: Bilingual Support for US7–US12 (Priority: P3)

**Goal**: All new admin section labels, buttons, messages, table headers, and status indicators for US7–US12 are translated in English and French

**Independent Test**: Switch language to French, navigate to Scan Results, Enrichment, trigger rename dialog and TMDB search panel — verify all visible text appears in French with no untranslated keys

### Implementation for Bilingual Support

- [ ] T064 [P] [US6] Add English translation keys (`admin.scanResults.*`, `admin.tmdbSearch.*`, `admin.enrichment.*`, `admin.rename.*`) to `src/assets/i18n/en.json`
- [ ] T065 [P] [US6] Add French translation keys (matching `admin.scanResults.*`, `admin.tmdbSearch.*`, `admin.enrichment.*`, `admin.rename.*` structure) to `src/assets/i18n/fr.json`
- [ ] T066 [US6] Wire up `transloco` pipes in all new component templates — replace hardcoded strings with `{{ t('admin.*') }}` translation keys in all `.component.html` files under `src/app/features/admin/scan-results/`, `src/app/features/admin/enrichment/`, and `src/app/features/admin/shared/`

**Checkpoint**: All new admin UI (US7–US12) fully bilingual — no untranslated keys in either language

---

## Phase 18: Polish & Cross-Cutting Concerns (US7–US12)

**Purpose**: Final validation, loading states, empty states, error handling, and cleanup for all new admin sub-sections

- [ ] T067 [P] Add loading states (`ProgressSpinner` or button `loading` property) to all async operations in scan-results, enrichment, and shared components
- [ ] T068 [P] Add empty state `Message` components for empty scan decisions list, no TV show groups, no enrichment entries, and no TMDB search results across new components
- [ ] T069 Verify error handling — ensure backend `404`, `409`, `422`, `500` errors from new endpoints (scan-decisions, reassign, tv-groups, enrichment, rename) display meaningful toast messages via existing error interceptor
- [ ] T070 Add "View Scan Results" navigation link from `ScanHistoryTableComponent` (completed scan row click) and `ScanStatusComponent` (completed state) to `/admin/scan-results/:scanId` — modify `src/app/features/admin/scanner/scan-history-table.component.ts` and `src/app/features/admin/scanner/scan-status.component.ts`
- [ ] T071 Run `quickstart.md` validation for US7–US12 — start app, navigate to `/admin/scan-results`, `/admin/enrichment`, exercise TMDB search panel, rename dialog, TV show groups, and verify `/nas-scanner` redirects to `/admin/scanner`

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
Task T052: "Add scan-results routes to admin.routes.ts"
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
