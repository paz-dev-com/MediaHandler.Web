# Data Model: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24 (updated 2025-07-25 — added entities for US-9 to US-15)

## Entity Changes

### 1. Media (extended — frontend model only)

The backend `Media` entity already has `Status` and `NumberOfSeasons`. The change is adding them to `MediaDto` (API) and `Media` interface (frontend).

**Backend DTO change** (`MediaDto.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Status` | `string?` | TMDB production status: "Returning Series", "Ended", "Released", etc. |
| `NumberOfSeasons` | `int?` | Total season count from TMDB. Null for films. |

**Frontend model change** (`media.model.ts`):
| Field | Type | Description |
|-------|------|-------------|
| `status` | `string \| null` | Production status from TMDB metadata |
| `numberOfSeasons` | `number \| null` | Total season count from TMDB. Null for films |

### 2. User (extended — requires API change)

**Backend entity change** (`User.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `ProfilePicturePath` | `string?` | Relative path to server-stored custom profile picture. Null when using auth provider default. |

**Backend DTO change** (`UserDto.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `ProfilePicturePath` | `string?` | URL/path to custom profile picture, or null |

**Frontend model change** (`user.model.ts`):
| Field | Type | Description |
|-------|------|-------------|
| `profilePicturePath` | `string \| null` | Server-stored custom profile picture path |

### 3. StartScanRequest (extended — requires API change)

**Backend request change** (`ScanRequests.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Language` | `string?` | Optional TMDB language code (e.g., "en", "fr"). Null falls back to API default. |

**Backend command change** (`StartScanCommand.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Language` | `string?` | Passed through to TMDB matcher during scan |

## New Frontend Types

### ProfilePictureUploadResponse

```typescript
// No new model needed — the upload endpoint returns the updated User object
```

### WishlistLookup (computed, not stored)

```typescript
// Computed signal in TmdbSearchPageComponent
// wishlistTmdbIds: Signal<Set<number>>
// Derived from wishlistService.items().map(i => i.tmdbId)
```

### MissingSeason (computed, not stored)

```typescript
interface MissingSeason {
  seasonNumber: number;
  /** True if this season exists on TMDB but is not in the user's collection */
  isMissing: true;
}
```

### TableQueryParams (frontend shared type — US-9)

```typescript
/** Shared query-param model for all lazy-loaded admin tables */
interface TableQueryParams {
  page: number; // 1-based
  pageSize: number; // e.g., 10 | 20 | 50
  sortField?: string; // column field name
  sortOrder?: 'asc' | 'desc';
  filters: Record<string, string>; // column field name → filter value
}

/** Default state factory */
const defaultTableQueryParams = (): TableQueryParams => ({
  page: 1,
  pageSize: 20,
  sortField: undefined,
  sortOrder: undefined,
  filters: {},
});
```

### PagedResult<T> (backend response wrapper — US-9)

**Backend DTO** (`PagedResult.cs`):

```csharp
public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize);
```

**Frontend model** (`paged-result.model.ts`):

```typescript
interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

All affected paginated endpoints return `ApiResponse<PagedResult<T>>` instead of `ApiResponse<T[]>`.

### BatchAssignRequest / BatchAssignResult (US-12)

**Frontend model** (`batch-assign.model.ts`):

```typescript
interface BatchAssignRequest {
  reviewItemIds: string[];
  targetMediaId: string;
}

interface BatchAssignItemResult {
  reviewItemId: string;
  success: boolean;
  errorMessage?: string;
}

interface BatchAssignResult {
  results: BatchAssignItemResult[];
}
```

**Backend DTO** (`BatchAssignRequests.cs`):

```csharp
public record BatchAssignReviewItemsRequest(
    Guid[] ReviewItemIds,
    Guid TargetMediaId);

public record BatchAssignItemResult(
    Guid ReviewItemId,
    bool Success,
    string? ErrorMessage);

public record BatchAssignReviewItemsResponse(
    IReadOnlyList<BatchAssignItemResult> Results);
```

### EnrichmentItemDetail (US-13)

**Backend DTO** (`EnrichmentDtos.cs` — extend existing):

```csharp
public record EnrichmentItemDetailDto(
    Guid MediaId,
    string Title,
    string FolderPath,
    EnrichmentItemStatus Status,   // Pending | InProgress | Completed | Failed
    string? ErrorMessage,
    int? SeasonsEnriched,          // null for films
    int? EpisodesEnriched);        // null for films

public enum EnrichmentItemStatus { Pending, InProgress, Completed, Failed }
```

**Frontend model** (`enrichment.model.ts` — extend existing):

```typescript
type EnrichmentItemStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

interface EnrichmentItemDetail {
  mediaId: string;
  title: string;
  folderPath: string;
  status: EnrichmentItemStatus;
  errorMessage?: string;
  seasonsEnriched?: number;
  episodesEnriched?: number;
}
```

### CollectionStats (US-14)

**Backend DTO** (`CollectionStatsDtos.cs`):

```csharp
public record CollectionStatsDto(
    int TotalCount,
    int TvShowCount,
    int FilmCount,
    int IncompleteTvShowCount);
```

**Frontend model** (`collection-stats.model.ts`):

```typescript
interface CollectionStats {
  totalCount: number;
  tvShowCount: number;
  filmCount: number;
  incompleteTvShowCount: number;
}
```

## Relationships

```text
User 1──* ProfilePicture (0..1 custom, default from Auth0 ID token `picture` claim)
Media 1──* TvSeason (existing)
Media.numberOfSeasons ──> compared against TvSeason[] count for missing detection
WishlistItem.tmdbId ──> cross-referenced with TmdbSearchResult.id for indicator
StartScanRequest ──> StartScanCommand ──> ScanStartParameters ──> ITmdbMatcher (language)

TableQueryParams ──> (serialised as HTTP query params) ──> admin list endpoints
PagedResult<T>   ──> returned by all admin list endpoints (replaces T[])
BatchAssignRequest ──> POST /api/v1/admin/review-items/batch-assign ──> BatchAssignResult
EnrichmentItemDetail[] ──> GET /api/v1/admin/enrichment/{runId}/details (polled every 4s)
CollectionStats ──> GET /api/v1/media/stats ──> CollectionPageComponent stats bar
```

## Validation Rules

| Entity                 | Field         | Rule                                                                        |
| ---------------------- | ------------- | --------------------------------------------------------------------------- |
| Profile Picture Upload | file type     | Must be JPEG, PNG, or WebP                                                  |
| Profile Picture Upload | file size     | Must be ≤ 2 MB                                                              |
| StartScanRequest       | Language      | Optional; if provided, must be a valid IETF language tag (e.g., "en", "fr") |
| TableQueryParams       | pageSize      | Must be one of: 10, 20, 50, 100                                             |
| TableQueryParams       | page          | Must be ≥ 1                                                                 |
| BatchAssignRequest     | reviewItemIds | Must be non-empty array (≥ 1 item); max 200 items per batch                 |
| BatchAssignRequest     | targetMediaId | Must be a valid existing Media GUID                                         |

## State Transitions

### Profile Picture State

```text
[No Custom Picture] ──upload──> [Custom Picture Active]
[Custom Picture Active] ──remove──> [No Custom Picture]
[No Custom Picture] ──display──> Auth0 picture or generic avatar
[Custom Picture Active] ──display──> Custom uploaded picture
```

### TV Show Production Status Display

```text
Media.status == "Returning Series" ──> Show "Still in Production" badge
Media.status == "Ended" ──> Show "Ended" badge
Media.status == null/unknown ──> Show "Unknown" badge
```

### Enrichment Item Status Flow

```text
[Pending] ──> [InProgress] ──> [Completed]
                           └──> [Failed]
```

### Review Item Selection (Batch Assign)

```text
[No Selection] ──select item──> [Items Selected]
[Items Selected] ──deselect all──> [No Selection]
[Items Selected] ──batch assign success──> [No Selection] (rows updated in place)
[Items Selected] ──batch assign partial fail──> [No Selection] (summary shown)
```

### Table State

```text
[Initial Load] ──onLazyLoad──> [Data Loaded]
[Data Loaded] ──sort column──> [Data Loaded] (re-fetched with sortField/sortOrder)
[Data Loaded] ──apply filter──> [Data Loaded] (re-fetched with filters, page reset to 1)
[Data Loaded] ──change page──> [Data Loaded] (re-fetched with new page)
[Data Loaded] ──in-place update──> [Data Loaded] (signal.update(), no fetch)
```
