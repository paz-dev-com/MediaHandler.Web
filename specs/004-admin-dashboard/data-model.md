# Data Model: Administration Dashboard

**Feature**: 004-admin-dashboard  
**Date**: 2025-07-17

## Frontend TypeScript Interfaces

All interfaces mirror the backend DTOs from `MediaHandler.Application.Common.DTOs` and `MediaHandler.Application.Features.Auth.DTOs`. Field names use camelCase per TypeScript convention (the .NET API serializes with camelCase by default).

### Enums (additions to `src/app/shared/models/enums.ts`)

```typescript
// Already exists:
// export enum UserRole { User = 'User', Admin = 'Admin' }
// export enum MediaType { Film = 'Film', TvShow = 'TvShow' }

export enum LibraryRootKind {
  Movies = 'Movies',
  TvShows = 'TvShows',
  Mixed = 'Mixed',
}

export enum ScanMode {
  Full = 'Full',
  Incremental = 'Incremental',
}

export enum ScanStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export enum ReviewStatus {
  Open = 'Open',
  Resolved = 'Resolved',
  Dismissed = 'Dismissed',
}

export enum ReviewReason {
  NoTmdbResult = 'NoTmdbResult',
  MultipleCandidates = 'MultipleCandidates',
  YearMismatch = 'YearMismatch',
  UnparseableEpisode = 'UnparseableEpisode',
  NfoMalformed = 'NfoMalformed',
  UnknownFormat = 'UnknownFormat',
  OrphanedAfterMissing = 'OrphanedAfterMissing',
}

export enum ReviewResolutionAction {
  Assign = 'Assign',
  Dismiss = 'Dismiss',
  Delete = 'Delete',
  Reopen = 'Reopen',
}
```

### Entities

#### LibraryRoot (`src/app/shared/models/library-root.model.ts`)

| Field       | Type              | Description              | Source DTO                 |
| ----------- | ----------------- | ------------------------ | -------------------------- |
| `id`        | `string`          | UUID                     | `LibraryRootDto.Id`        |
| `path`      | `string`          | NAS directory path       | `LibraryRootDto.Path`      |
| `kind`      | `LibraryRootKind` | Movies / TvShows / Mixed | `LibraryRootDto.Kind`      |
| `label`     | `string \| null`  | Optional display label   | `LibraryRootDto.Label`     |
| `isEnabled` | `boolean`         | Active scan target flag  | `LibraryRootDto.IsEnabled` |
| `createdAt` | `string`          | ISO 8601 timestamp       | `LibraryRootDto.CreatedAt` |
| `updatedAt` | `string \| null`  | ISO 8601 timestamp       | `LibraryRootDto.UpdatedAt` |

```typescript
export interface LibraryRoot {
  id: string;
  path: string;
  kind: LibraryRootKind;
  label: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
}
```

#### ScanCounts (`src/app/shared/models/admin-scan.model.ts`)

| Field             | Type     | Description             | Source DTO                      |
| ----------------- | -------- | ----------------------- | ------------------------------- |
| `totalDiscovered` | `number` | Files found on disk     | `ScanCountsDto.TotalDiscovered` |
| `added`           | `number` | New files added         | `ScanCountsDto.Added`           |
| `updated`         | `number` | Existing files updated  | `ScanCountsDto.Updated`         |
| `unchanged`       | `number` | Files unchanged         | `ScanCountsDto.Unchanged`       |
| `removed`         | `number` | Files removed           | `ScanCountsDto.Removed`         |
| `excluded`        | `number` | Files excluded by rules | `ScanCountsDto.Excluded`        |
| `needsReview`     | `number` | Files requiring review  | `ScanCountsDto.NeedsReview`     |

```typescript
export interface ScanCounts {
  totalDiscovered: number;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  excluded: number;
  needsReview: number;
}
```

#### ScanRunSummary (`src/app/shared/models/admin-scan.model.ts`)

| Field            | Type             | Description         | Source DTO                              |
| ---------------- | ---------------- | ------------------- | --------------------------------------- |
| `id`             | `string`         | UUID                | `ScanRunSummaryResponse.Id`             |
| `mode`           | `ScanMode`       | Full / Incremental  | `ScanRunSummaryResponse.Mode`           |
| `status`         | `ScanStatus`     | Lifecycle state     | `ScanRunSummaryResponse.Status`         |
| `startedAt`      | `string`         | ISO 8601            | `ScanRunSummaryResponse.StartedAt`      |
| `finishedAt`     | `string \| null` | ISO 8601 or null    | `ScanRunSummaryResponse.FinishedAt`     |
| `libraryRootIds` | `string[]`       | Targeted root UUIDs | `ScanRunSummaryResponse.LibraryRootIds` |
| `counts`         | `ScanCounts`     | Scan statistics     | `ScanRunSummaryResponse.Counts`         |

```typescript
export interface ScanRunSummary {
  id: string;
  mode: ScanMode;
  status: ScanStatus;
  startedAt: string;
  finishedAt: string | null;
  libraryRootIds: string[];
  counts: ScanCounts;
}
```

#### ScanRunDetail (`src/app/shared/models/admin-scan.model.ts`)

Extends summary with failure reason and optional review items.

```typescript
export interface ScanRunDetail extends ScanRunSummary {
  failureReason: string | null;
  reviewItems: ReviewItem[] | null;
}
```

#### TmdbCandidate (`src/app/shared/models/review.model.ts`)

| Field        | Type             | Description      | Source DTO                    |
| ------------ | ---------------- | ---------------- | ----------------------------- |
| `tmdbId`     | `number`         | TMDB ID          | `TmdbCandidateDto.TmdbId`     |
| `kind`       | `MediaType`      | Film / TvShow    | `TmdbCandidateDto.Kind`       |
| `title`      | `string`         | Display title    | `TmdbCandidateDto.Title`      |
| `year`       | `number \| null` | Release year     | `TmdbCandidateDto.Year`       |
| `score`      | `number \| null` | Match confidence | `TmdbCandidateDto.Score`      |
| `posterPath` | `string \| null` | TMDB poster path | `TmdbCandidateDto.PosterPath` |

```typescript
export interface TmdbCandidate {
  tmdbId: number;
  kind: MediaType;
  title: string;
  year: number | null;
  score: number | null;
  posterPath: string | null;
}
```

#### ReviewItem (`src/app/shared/models/review.model.ts`)

| Field            | Type                | Description                 | Source DTO                     |
| ---------------- | ------------------- | --------------------------- | ------------------------------ |
| `id`             | `string`            | UUID                        | `ReviewItemDto.Id`             |
| `filePath`       | `string`            | Full NAS file path          | `ReviewItemDto.FilePath`       |
| `reason`         | `ReviewReason`      | Why review needed           | `ReviewItemDto.Reason`         |
| `status`         | `ReviewStatus`      | Open / Resolved / Dismissed | `ReviewItemDto.Status`         |
| `parsedTitle`    | `string \| null`    | Extracted title             | `ReviewItemDto.ParsedTitle`    |
| `parsedYear`     | `number \| null`    | Extracted year              | `ReviewItemDto.ParsedYear`     |
| `parsedSeason`   | `number \| null`    | Extracted season            | `ReviewItemDto.ParsedSeason`   |
| `parsedEpisode`  | `number \| null`    | Extracted episode           | `ReviewItemDto.ParsedEpisode`  |
| `candidates`     | `TmdbCandidate[]`   | Suggested matches           | `ReviewItemDto.Candidates`     |
| `resolvedTmdbId` | `number \| null`    | Assigned TMDB ID            | `ReviewItemDto.ResolvedTmdbId` |
| `resolvedKind`   | `MediaType \| null` | Assigned media type         | `ReviewItemDto.ResolvedKind`   |
| `resolvedAt`     | `string \| null`    | Resolution timestamp        | `ReviewItemDto.ResolvedAt`     |
| `createdAt`      | `string`            | Creation timestamp          | `ReviewItemDto.CreatedAt`      |

```typescript
export interface ReviewItem {
  id: string;
  filePath: string;
  reason: ReviewReason;
  status: ReviewStatus;
  parsedTitle: string | null;
  parsedYear: number | null;
  parsedSeason: number | null;
  parsedEpisode: number | null;
  candidates: TmdbCandidate[];
  resolvedTmdbId: number | null;
  resolvedKind: MediaType | null;
  resolvedAt: string | null;
  createdAt: string;
}
```

#### HealthStatus (`src/app/shared/models/health.model.ts`)

| Field       | Type     | Description                  | Source DTO                 |
| ----------- | -------- | ---------------------------- | -------------------------- |
| `status`    | `string` | `'Healthy'` or `'Unhealthy'` | `HealthResponse.Status`    |
| `timestamp` | `string` | Server UTC timestamp         | `HealthResponse.Timestamp` |
| `version`   | `string` | Application version          | `HealthResponse.Version`   |

```typescript
export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}
```

## Request Bodies

#### SetRoleRequest

```typescript
{
  role: UserRole;
} // PUT /admin/users/{id}/role
```

#### SetActiveRequest

```typescript
{
  isActive: boolean;
} // PUT /admin/users/{id}/active
```

#### AddLibraryRootRequest

```typescript
{ path: string; kind: LibraryRootKind; label?: string }  // POST /admin/library-roots
```

#### SetLibraryRootEnabledRequest (pending backend implementation)

```typescript
{
  isEnabled: boolean;
} // PUT /admin/library-roots/{id}/enabled
```

#### StartScanRequest

```typescript
{ libraryRootIds: string[]; mode: ScanMode }  // POST /admin/scan
```

#### ResolveReviewRequest

```typescript
{
  action: ReviewResolutionAction;  // Assign, Dismiss, Delete, or Reopen
  tmdbId?: number;                 // Required when action = Assign
  kind?: MediaType;                // Required when action = Assign
}
// POST /admin/review-items/{id}/resolve
```

## Relationships

```
User (existing) ──── managed via admin user endpoints
  └── role: UserRole
  └── isActive: boolean

LibraryRoot ──── scan targets
  └──< ScanRun.libraryRootIds (many-to-many via ID array)

ScanRun
  └──< ReviewItem (via scanRunId filter param)

ReviewItem
  └──< TmdbCandidate[] (embedded in response)

HealthStatus ──── standalone, no relationships
```

## State Transitions

### ScanRun Lifecycle

```
Pending → Running → Completed
                  → Failed
                  → Cancelled (via POST /scan/{id}/cancel)
```

Terminal states: `Completed`, `Failed`, `Cancelled`. Polling stops on terminal.

### ReviewItem Lifecycle

```
Open → Resolved (via Assign action)
     → Dismissed (via Dismiss or Delete action)

Resolved → Open (via Reopen action)
Dismissed → Open (via Reopen action)
```

## Validation Rules

| Entity        | Field            | Rule                            | Source              |
| ------------- | ---------------- | ------------------------------- | ------------------- |
| LibraryRoot   | `path`           | Required, non-empty             | Frontend validation |
| LibraryRoot   | `path`           | Unique (duplicate detection)    | Backend 409         |
| LibraryRoot   | `kind`           | Must be valid enum value        | Frontend dropdown   |
| StartScan     | `libraryRootIds` | Empty array = all enabled roots | Spec FR-011a        |
| StartScan     | `mode`           | Must be `Full` or `Incremental` | Frontend dropdown   |
| ResolveReview | `tmdbId`         | Required when action = `Assign` | Frontend validation |
| ResolveReview | `kind`           | Required when action = `Assign` | Frontend validation |
