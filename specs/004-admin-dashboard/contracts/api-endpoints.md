# API Contract Mapping: Admin Endpoints

**Feature**: 004-admin-dashboard  
**Date**: 2025-07-17  
**Updated**: 2025-07-18 (US7–US12 extension)
**Base URL**: `{apiBaseUrl}` (from `environment.apiBaseUrl`)

All endpoints require `Authorization: Bearer {token}` (added by `authInterceptor`).  
All admin endpoints require the `Admin` role (enforced server-side by `AdminOnly` policy).  
All responses use the `ApiResponse<T>` envelope: `{ data: T, meta: PaginationMeta | null, errors: ApiError[] }`.

---

## User Management

### GET `admin/users`

List all users with optional search.

| Param      | Type      | Default | Description             |
| ---------- | --------- | ------- | ----------------------- |
| `page`     | `number`  | `1`     | Page number             |
| `pageSize` | `number`  | `20`    | Items per page          |
| `search`   | `string?` | `null`  | Filter by name or email |

**Response**: `ApiResponse<User[]>` with `PaginationMeta`

### PUT `admin/users/{userId}/role`

**Body**: `{ role: 'User' | 'Admin' }`  
**Response**: `204 No Content`  
**Errors**: `404` user not found

### PUT `admin/users/{userId}/active`

**Body**: `{ isActive: boolean }`  
**Response**: `204 No Content`  
**Errors**: `404` user not found

---

## Library Roots

### GET `admin/library-roots`

| Param         | Type               | Default | Description             |
| ------------- | ------------------ | ------- | ----------------------- |
| `page`        | `number`           | `1`     | Page number             |
| `pageSize`    | `number`           | `20`    | Items per page          |
| `kind`        | `LibraryRootKind?` | `null`  | Filter by kind          |
| `enabledOnly` | `boolean`          | `false` | Show only enabled roots |

**Response**: `ApiResponse<LibraryRoot[]>` with `PaginationMeta`

### POST `admin/library-roots`

**Body**: `{ path: string, kind: LibraryRootKind, label?: string }`  
**Response**: `201 Created` → `ApiResponse<LibraryRoot>`  
**Errors**: `409 LIBRARY_ROOT_DUPLICATE` duplicate path; `400 VALIDATION_ERROR`

### DELETE `admin/library-roots/{id}`

**Response**: `204 No Content`  
**Errors**: `404` not found; `409 SCAN_IN_PROGRESS` scan targeting root is running

### PUT `admin/library-roots/{id}/enabled` ⚠️ PENDING BACKEND

**Body**: `{ isEnabled: boolean }`  
**Response**: `204 No Content`  
**Errors**: `404` not found

> **Note**: This endpoint is required by FR-009a but is not yet implemented in the backend. The frontend service should be coded against this contract; the endpoint must be added to `AdminLibraryRootsController` before integration testing.

---

## Scanner

### POST `admin/scan`

**Body**: `{ libraryRootIds: string[], mode: 'Full' | 'Incremental' }`  
**Response**: `202 Accepted` → `ApiResponse<ScanRunSummary>`  
**Errors**: `409 SCAN_IN_PROGRESS` scan already running; `400 VALIDATION_ERROR`

> When `libraryRootIds` is empty, the backend scans all currently enabled roots.

### GET `admin/scan/{id}`

| Param           | Type      | Default | Description              |
| --------------- | --------- | ------- | ------------------------ |
| `includeReview` | `boolean` | `false` | Attach open review items |

**Response**: `ApiResponse<ScanRunDetail>`  
**Errors**: `404` not found

### GET `admin/scan/active`

**Response**: `ApiResponse<ScanRunSummary | null>`  
Returns `null` data when no scan is active.

### POST `admin/scan/{id}/cancel`

**Response**: `200 OK` → `ApiResponse<ScanRunSummary>` (idempotent)  
**Errors**: `404` not found

### GET `admin/scan?page&pageSize` ⚠️ PENDING BACKEND

| Param      | Type     | Default | Description    |
| ---------- | -------- | ------- | -------------- |
| `page`     | `number` | `1`     | Page number    |
| `pageSize` | `number` | `20`    | Items per page |

**Response**: `ApiResponse<ScanRunSummary[]>` with `PaginationMeta`

> **Note**: Required by FR-012a for scan history. Not yet implemented. The frontend should code against this contract.

---

## Review Queue

### GET `admin/review-items`

| Param       | Type            | Default | Description        |
| ----------- | --------------- | ------- | ------------------ |
| `status`    | `ReviewStatus?` | `Open`  | Filter by status   |
| `reason`    | `ReviewReason?` | `null`  | Filter by reason   |
| `scanRunId` | `string?`       | `null`  | Filter by scan run |
| `page`      | `number`        | `1`     | Page number        |
| `pageSize`  | `number`        | `25`    | Items per page     |

**Response**: `ApiResponse<ReviewItem[]>` with `PaginationMeta`

### POST `admin/review-items/{id}/resolve`

**Body**: `{ action: ReviewResolutionAction, tmdbId?: number, kind?: MediaType }`  
**Response**: `200 OK` → `ApiResponse<ReviewItem>`  
**Errors**: `404` not found; `409 REVIEW_ALREADY_RESOLVED`; `422 TMDB_ID_NOT_FOUND`; `400 VALIDATION_ERROR`

> The `Reopen` action (⚠️ PENDING BACKEND) should be handled via the same endpoint by adding `Reopen` to the `ReviewResolutionAction` enum.

---

## Health

### GET `health`

**Response**: `ApiResponse<HealthStatus>`  
**No authentication required** (public endpoint).  
Returns `200` when healthy, `503` when unhealthy (both with valid response body).

---

## Scan Results Browser (US7)

### GET `admin/scan/{scanId}/decisions` ⚠️ PENDING BACKEND

Browse all scan item decisions for a given scan run.

| Param           | Type                | Default | Description                        |
| --------------- | ------------------- | ------- | ---------------------------------- |
| `decisionType`  | `ScanDecisionType?` | `null`  | Filter by decision type            |
| `mediaType`     | `MediaType?`        | `null`  | Filter by media type (Film/TvShow) |
| `libraryRootId` | `string?`           | `null`  | Filter by library root             |
| `page`          | `number`            | `1`     | Page number                        |
| `pageSize`      | `number`            | `20`    | Items per page                     |

**Response**: `ApiResponse<ScanItemDecision[]>` with `PaginationMeta`  
**Errors**: `404` scan not found

### PUT `admin/scan-decisions/{id}/reassign` ⚠️ PENDING BACKEND

Change the TMDB assignment for a scan item decision.

**Body**: `{ tmdbId: number, kind: MediaType }`  
**Response**: `200 OK` → `ApiResponse<ScanItemDecision>`  
**Errors**: `404` decision not found; `422 TMDB_ID_NOT_FOUND`; `400 VALIDATION_ERROR`

---

## TV Show Groups (US9)

### GET `admin/scan-decisions/tv-groups` ⚠️ PENDING BACKEND

Get TV show file groupings for a scan run. Groups are computed on-the-fly — no DB table.

| Param    | Type     | Default    | Description   |
| -------- | -------- | ---------- | ------------- |
| `scanId` | `string` | _required_ | Scan run UUID |

**Response**: `ApiResponse<TvShowGroup[]>`  
**Errors**: `404` scan not found

### PUT `admin/tv-groups/{groupId}/assign` ⚠️ PENDING BACKEND

Assign TMDB source at the TV show group level. Propagates to all episodes.

**Body**: `{ tmdbId: number }`  
**Response**: `200 OK` → `ApiResponse<TvShowGroup>` (updated group with episode count)  
**Errors**: `404` group not found; `422 TMDB_ID_NOT_FOUND`

---

## Enrichment (US10)

### POST `admin/enrichment/start` ⚠️ PENDING BACKEND

Launch a batch TMDB enrichment scan for validated media entries.

**Body**: (none)  
**Response**: `202 Accepted` → `ApiResponse<EnrichmentRun>`  
**Errors**: `409 ENRICHMENT_IN_PROGRESS` enrichment already running

### GET `admin/enrichment/status` ⚠️ PENDING BACKEND

Get current enrichment status/progress. When no enrichment has ever run, returns a summary of entries ready for enrichment.

**Response**: `ApiResponse<EnrichmentRun | EnrichmentSummary>`

> The response type is discriminated by structure: if `status` field is present, it's an `EnrichmentRun`; if `newEntries` field is present, it's an `EnrichmentSummary` (pre-enrichment state).

---

## File Rename (US11)

### POST `admin/files/{id}/rename` ⚠️ PENDING BACKEND

Rename a physical file on the NAS. Supports preview mode.

| Param     | Type      | Default | Description                                     |
| --------- | --------- | ------- | ----------------------------------------------- |
| `preview` | `boolean` | `false` | If true, return proposed name without executing |

**Body**: (none)  
**Response (preview=true)**: `200 OK` → `ApiResponse<RenamePreview>`  
**Response (preview=false)**: `200 OK` → `ApiResponse<RenameResult>`  
**Errors**: `404` file not found; `409 FILE_NAME_CONFLICT` target name exists; `500 RENAME_FAILED` filesystem error

### POST `admin/tv-groups/{groupId}/rename` ⚠️ PENDING BACKEND

Batch rename all episode files under a TV show group.

| Param     | Type      | Default | Description                                        |
| --------- | --------- | ------- | -------------------------------------------------- |
| `preview` | `boolean` | `false` | If true, return proposed renames without executing |

**Body**: (none)  
**Response (preview=true)**: `200 OK` → `ApiResponse<BatchRenamePreview>`  
**Response (preview=false)**: `200 OK` → `ApiResponse<BatchRenameResult>`  
**Errors**: `404` group not found; `409 FILE_NAME_CONFLICT`

---

## TMDB Search (reused — US8)

### GET `tmdb/search` (existing endpoint)

Search TMDB by title. Already implemented and used by `TmdbSearchService`.

| Param      | Type     | Default     | Description           |
| ---------- | -------- | ----------- | --------------------- |
| `query`    | `string` | _required_  | Search text           |
| `language` | `string` | active lang | Language code (en/fr) |

**Response**: `ApiResponse<TmdbSearchResult[]>`

> No new endpoint needed. The existing `TmdbSearchService` is reused by the `TmdbSearchPanelComponent`.

---

## Frontend Service → Endpoint Mapping (Updated)

| Frontend Service                               | Method     | API Endpoint                             |
| ---------------------------------------------- | ---------- | ---------------------------------------- |
| `AdminUserService.getUsers()`                  | `GET`      | `admin/users`                            |
| `AdminUserService.setRole()`                   | `PUT`      | `admin/users/{id}/role`                  |
| `AdminUserService.setActive()`                 | `PUT`      | `admin/users/{id}/active`                |
| `AdminLibraryRootService.getRoots()`           | `GET`      | `admin/library-roots`                    |
| `AdminLibraryRootService.addRoot()`            | `POST`     | `admin/library-roots`                    |
| `AdminLibraryRootService.removeRoot()`         | `DELETE`   | `admin/library-roots/{id}`               |
| `AdminLibraryRootService.setEnabled()`         | `PUT`      | `admin/library-roots/{id}/enabled`       |
| `AdminScanService.startScan()`                 | `POST`     | `admin/scan`                             |
| `AdminScanService.getActiveScan()`             | `GET`      | `admin/scan/active`                      |
| `AdminScanService.getScanDetail()`             | `GET`      | `admin/scan/{id}`                        |
| `AdminScanService.cancelScan()`                | `POST`     | `admin/scan/{id}/cancel`                 |
| `AdminScanService.getScanHistory()`            | `GET`      | `admin/scan`                             |
| `AdminReviewService.getItems()`                | `GET`      | `admin/review-items`                     |
| `AdminReviewService.resolveItem()`             | `POST`     | `admin/review-items/{id}/resolve`        |
| `AdminHealthService.getHealth()`               | `GET`      | `health`                                 |
| **`AdminScanDecisionService.getDecisions()`**  | **`GET`**  | **`admin/scan/{scanId}/decisions`**      |
| **`AdminScanDecisionService.reassign()`**      | **`PUT`**  | **`admin/scan-decisions/{id}/reassign`** |
| **`AdminScanDecisionService.getTvGroups()`**   | **`GET`**  | **`admin/scan-decisions/tv-groups`**     |
| **`AdminScanDecisionService.assignTvGroup()`** | **`PUT`**  | **`admin/tv-groups/{groupId}/assign`**   |
| **`AdminScanDecisionService.renameFile()`**    | **`POST`** | **`admin/files/{id}/rename`**            |
| **`AdminScanDecisionService.renameTvGroup()`** | **`POST`** | **`admin/tv-groups/{groupId}/rename`**   |
| **`AdminEnrichmentService.start()`**           | **`POST`** | **`admin/enrichment/start`**             |
| **`AdminEnrichmentService.getStatus()`**       | **`GET`**  | **`admin/enrichment/status`**            |
| `TmdbSearchService.search()` _(existing)_      | `GET`      | `tmdb/search`                            |
