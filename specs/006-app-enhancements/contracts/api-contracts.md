# API Contract Changes: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24 (updated 2025-07-25 — added contracts for US-9 to US-15)

## Modified Endpoints

### 1. POST /api/v1/admin/scan — Start Scan

**Change**: Add optional `language` field to request body.

**Request Body** (modified):

```json
{
  "libraryRootIds": ["guid", "..."],
  "mode": "Full" | "Incremental",
  "language": "en" | "fr" | null
}
```

**Response**: Unchanged (202 Accepted with `ScanRunSummaryResponse`).

**Notes**: When `language` is null/omitted, the API falls back to its default behavior (currently no language filter on TMDB queries).

---

### 2. GET /api/v1/media/{id} — Get Media Detail

**Change**: Response DTO extended with `status` and `numberOfSeasons`.

**Response Body** (extended fields only):

```json
{
  "data": {
    "...existing fields...",
    "status": "Returning Series" | "Ended" | "Released" | null,
    "numberOfSeasons": 5 | null
  }
}
```

**Notes**: `status` and `numberOfSeasons` are populated from the `Media` entity (filled during TMDB enrichment). `null` for films or when data is unavailable.

---

### 3. GET /api/v1/auth/me — Get Current User

**Change**: Response DTO extended with `profilePicturePath`.

**Response Body** (extended fields only):

```json
{
  "data": {
    "...existing fields...",
    "profilePicturePath": "/uploads/profile-pictures/user-guid.jpg" | null
  }
}
```

---

### 4. POST /api/v1/auth/sync — Sync User

**Change**: Response DTO extended with `profilePicturePath` (same as above, via `UserDto`).

---

### 5. GET /api/v1/admin/users — List Users (US-9)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter     | Type     | Description                                                          |
| ------------- | -------- | -------------------------------------------------------------------- |
| `page`        | `int`    | Page number, 1-based. Default: 1                                     |
| `pageSize`    | `int`    | Rows per page (10, 20, 50, 100). Default: 20                         |
| `sortField`   | `string` | Column to sort by (e.g., `email`, `displayName`, `role`, `isActive`) |
| `sortOrder`   | `string` | `asc` or `desc`. Default: `asc`                                      |
| `email`       | `string` | Filter — case-insensitive `contains` match on email                  |
| `displayName` | `string` | Filter — case-insensitive `contains` match on display name           |
| `role`        | `string` | Filter — exact match on role enum value                              |
| `isActive`    | `bool`   | Filter — exact match on active status                                |

**Response Body** (before: `ApiResponse<UserDto[]>`; after: `ApiResponse<PagedResult<UserDto>>`):

```json
{
  "succeeded": true,
  "data": {
    "items": [ { "...UserDto..." } ],
    "totalCount": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6. GET /api/v1/admin/review-items — List Review Items (US-9)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter   | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| `page`      | `int`    | Page number. Default: 1                    |
| `pageSize`  | `int`    | Default: 20                                |
| `sortField` | `string` | e.g., `fileName`, `status`, `createdAt`    |
| `sortOrder` | `string` | `asc` or `desc`                            |
| `fileName`  | `string` | Filter — `contains` match                  |
| `status`    | `string` | Filter — exact match on review status enum |

**Response Body**: `ApiResponse<PagedResult<ReviewItemDto>>`

---

### 7. GET /api/v1/admin/scan/decisions — List Scan Decisions / Scan Results (US-9, US-10)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter   | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| `page`      | `int`    | Page number. Default: 1                 |
| `pageSize`  | `int`    | Default: 20                             |
| `sortField` | `string` | e.g., `fileName`, `status`, `scannedAt` |
| `sortOrder` | `string` | `asc` or `desc`                         |
| `fileName`  | `string` | Filter — `contains` match               |
| `status`    | `string` | Filter — exact match on decision status |

**Response Body**: `ApiResponse<PagedResult<ScanDecisionDto>>`

---

### 8. GET /api/v1/admin/scan/history — List Scan Runs (US-9)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter   | Type     | Description                             |
| ----------- | -------- | --------------------------------------- |
| `page`      | `int`    | Default: 1                              |
| `pageSize`  | `int`    | Default: 20                             |
| `sortField` | `string` | e.g., `startedAt`, `status`, `mode`     |
| `sortOrder` | `string` | `asc` or `desc`                         |
| `status`    | `string` | Filter — exact match on scan run status |
| `mode`      | `string` | Filter — `Full` or `Incremental`        |

**Response Body**: `ApiResponse<PagedResult<ScanRunSummaryDto>>`

---

### 9. GET /api/v1/admin/enrichment/history — List Enrichment Runs (US-9)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter   | Type     | Description                                   |
| ----------- | -------- | --------------------------------------------- |
| `page`      | `int`    | Default: 1                                    |
| `pageSize`  | `int`    | Default: 20                                   |
| `sortField` | `string` | e.g., `startedAt`, `status`                   |
| `sortOrder` | `string` | `asc` or `desc`                               |
| `status`    | `string` | Filter — exact match on enrichment run status |

**Response Body**: `ApiResponse<PagedResult<EnrichmentRunSummaryDto>>`

---

### 10. GET /api/v1/admin/library-roots — List Library Roots (US-9)

**Change**: Add optional pagination, sort, and filter query parameters.

**Query Parameters** (all optional):

| Parameter   | Type     | Description               |
| ----------- | -------- | ------------------------- |
| `page`      | `int`    | Default: 1                |
| `pageSize`  | `int`    | Default: 20               |
| `sortField` | `string` | e.g., `path`, `createdAt` |
| `sortOrder` | `string` | `asc` or `desc`           |
| `path`      | `string` | Filter — `contains` match |

**Response Body**: `ApiResponse<PagedResult<LibraryRootDto>>`

---

### 11. GET /api/v1/admin/scan/active — Active Scan Status (US-11)

**Change**: No structural change to the response. Backend fix: counter values (`totalDiscovered`, `added`, `updated`, `needsReview`) in `ScanRunDetail.counts` must be updated incrementally during scanning, not only at completion.

**Response Body** (existing, now correct during scan):

```json
{
  "succeeded": true,
  "data": {
    "runId": "guid",
    "status": "Running",
    "counts": {
      "totalDiscovered": 84,
      "added": 12,
      "updated": 3,
      "needsReview": 7
    },
    "startedAt": "2025-07-25T10:00:00Z",
    "currentItem": "ShowName/S01E03.mkv"
  }
}
```

---

## New Endpoints

### 12. POST /api/v1/users/profile-picture — Upload Profile Picture

**Authorization**: Authenticated user (acts on current user).

**Request**: `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | Image file (JPEG, PNG, or WebP, ≤ 2MB) |

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "id": "guid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "preferredLanguage": "en",
    "role": "User",
    "isActive": true,
    "profilePicturePath": "/uploads/profile-pictures/user-guid.jpg"
  }
}
```

**Error Responses**:

- `400 Bad Request` — Invalid file type or file exceeds 2MB.
- `401 Unauthorized` — Not authenticated.

---

### 13. DELETE /api/v1/users/profile-picture — Remove Profile Picture

**Authorization**: Authenticated user (acts on current user).

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "...UserDto with profilePicturePath: null..."
  }
}
```

**Error Responses**:

- `401 Unauthorized` — Not authenticated.
- `404 Not Found` — No custom profile picture to remove.

---

### 14. POST /api/v1/admin/review-items/batch-assign — Batch Assign Review Items (US-12)

**Authorization**: Admin role required.

**Request Body**:

```json
{
  "reviewItemIds": ["guid-1", "guid-2", "guid-3"],
  "targetMediaId": "guid-media"
}
```

| Field           | Constraint                          |
| --------------- | ----------------------------------- |
| `reviewItemIds` | Non-empty array; max 200 items      |
| `targetMediaId` | Must be a valid existing Media GUID |

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "results": [
      { "reviewItemId": "guid-1", "success": true, "errorMessage": null },
      { "reviewItemId": "guid-2", "success": true, "errorMessage": null },
      { "reviewItemId": "guid-3", "success": false, "errorMessage": "Item already assigned" }
    ]
  }
}
```

**Error Responses**:

- `400 Bad Request` — `reviewItemIds` empty, or `targetMediaId` invalid.
- `401 Unauthorized` — Not authenticated.
- `403 Forbidden` — Not an admin.

---

### 15. GET /api/v1/admin/enrichment/{runId}/details — Enrichment Run Details (US-13)

**Change**: Endpoint already exists for history expansion. Now also called during an active run (polling).

**Authorization**: Admin role required.

**Path Parameter**: `runId` — GUID of the enrichment run.

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "runId": "guid",
    "totalCount": 45,
    "processedCount": 12,
    "items": [
      {
        "mediaId": "guid",
        "title": "Breaking Bad",
        "folderPath": "/Disque NAS 1/TV Shows/Breaking Bad",
        "status": "Completed",
        "errorMessage": null,
        "seasonsEnriched": 5,
        "episodesEnriched": 62
      },
      {
        "mediaId": "guid-2",
        "title": "The Wire",
        "folderPath": "/Disque NAS 1/TV Shows/The Wire",
        "status": "InProgress",
        "errorMessage": null,
        "seasonsEnriched": null,
        "episodesEnriched": null
      }
    ]
  }
}
```

**Error Responses**:

- `404 Not Found` — No enrichment run with this ID exists.
- `401 Unauthorized` — Not authenticated.

---

### 16. GET /api/v1/media/stats — Collection Statistics (US-14)

**Authorization**: Authenticated user.

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "totalCount": 312,
    "tvShowCount": 87,
    "filmCount": 225,
    "incompleteTvShowCount": 14
  }
}
```

**Notes**: A TV show is considered incomplete when `Media.NumberOfSeasons` > number of owned `TvSeason` records. `incompleteTvShowCount` counts only TV shows with non-null `NumberOfSeasons`.

---

## Existing Endpoints (No Changes)

### GET /api/v1/files/locations — Get NAS Locations

Already exists. Returns `string[]` from `Nas.BasePaths` config. Used by the frontend for the root folder dropdown.

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": ["/Disque NAS 1", "/Disque NAS 2"]
}
```

---

## Frontend Service Contracts

### AdminScanService.startScan()

**Change**: Add `language` parameter.

```typescript
startScan(libraryRootIds: string[], mode: ScanMode, language?: string): void
// POST body: { libraryRootIds, mode, language }
```

### ProfileService

**New methods**:

```typescript
uploadProfilePicture(file: File): void
// POST /api/v1/users/profile-picture (multipart/form-data)
// Updates user signal on success

removeProfilePicture(): void
// DELETE /api/v1/users/profile-picture
// Updates user signal on success (profilePicturePath → null)
```

### AdminFilesService (or AdminLibraryRootService extension)

**New method**:

```typescript
getLocations(): Observable<ApiResponse<string[]>>
// GET /api/v1/files/locations
```

### AdminTableService (generic helper — new, US-9)

```typescript
/** Converts TableQueryParams to Angular HttpParams */
toHttpParams(params: TableQueryParams): HttpParams

// Usage in each admin list service:
getUsers(query: TableQueryParams): Observable<ApiResponse<PagedResult<UserDto>>>
// GET /api/v1/admin/users?page=1&pageSize=20&sortField=email&sortOrder=asc&role=Admin

getReviewItems(query: TableQueryParams): Observable<ApiResponse<PagedResult<ReviewItemDto>>>
// GET /api/v1/admin/review-items?...

getScanDecisions(query: TableQueryParams): Observable<ApiResponse<PagedResult<ScanDecisionDto>>>
// GET /api/v1/admin/scan/decisions?...

getScanHistory(query: TableQueryParams): Observable<ApiResponse<PagedResult<ScanRunSummaryDto>>>
// GET /api/v1/admin/scan/history?...

getEnrichmentHistory(query: TableQueryParams): Observable<ApiResponse<PagedResult<EnrichmentRunSummaryDto>>>
// GET /api/v1/admin/enrichment/history?...

getLibraryRoots(query: TableQueryParams): Observable<ApiResponse<PagedResult<LibraryRootDto>>>
// GET /api/v1/admin/library-roots?...
```

### AdminReviewItemsService

**New method**:

```typescript
batchAssign(request: BatchAssignRequest): Observable<ApiResponse<BatchAssignResult>>
// POST /api/v1/admin/review-items/batch-assign
```

### AdminEnrichmentService

**New method**:

```typescript
getRunDetails(runId: string): Observable<ApiResponse<EnrichmentRunDetailsDto>>
// GET /api/v1/admin/enrichment/{runId}/details
```

### CollectionService / MediaService

**New method**:

```typescript
getStats(): Observable<ApiResponse<CollectionStats>>
// GET /api/v1/media/stats
```
