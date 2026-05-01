# Research: Administration Dashboard

**Feature**: 004-admin-dashboard  
**Date**: 2025-07-17

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
