# Data Model: Media File Linking & Missing Content Detection

**Feature**: 007-media-file-linking  
**Date**: 2026-05-21

---

## Backend Entity Changes

### `Media` (MODIFIED)

New column: `RootFolder string? (nullable text)`.

```csharp
// MediaHandler.Domain/Entities/Media.cs — new property
/// <summary>
///     Manually set root folder path on the NAS for this media item.
///     When null the effective root folder is auto-derived at read time
///     from the common parent directory of all linked MediaFile.FilePath values.
/// </summary>
public string? RootFolder { get; set; }
```

EF Core configuration (`MediaConfiguration.cs`):

```csharp
builder.Property(m => m.RootFolder)
    .HasColumnName("root_folder")
    .HasColumnType("text")
    .IsRequired(false);
```

EF migration: `AddMediaRootFolder` — single `AlterTable` adding `root_folder text NULL`.

---

## New DTOs (Backend)

### `MediaDto` (MODIFIED)

Add `RootFolder` field:

```csharp
// MediaHandler.Application/Features/Media/DTOs/MediaDto.cs
public record MediaDto(
    // ...existing fields...
    string? RootFolder          // effective = stored override ?? computed common-parent
);
```

### `SeasonCompletenessDto` (NEW)

```csharp
// MediaHandler.Application/Features/Media/DTOs/SeasonCompletenessDto.cs
namespace MediaHandler.Application.Features.Media.DTOs;

public record SeasonCompletenessDto(
    int SeasonNumber,
    string SeasonName,
    int TotalExpected,      // TvSeason.EpisodeCount ?? TvEpisodes.Count
    int OwnedCount,         // episodes with at least one EpisodeFileLink
    IReadOnlyList<int> MissingEpisodeNumbers,
    bool IsComplete
);
```

### `UnlinkedFileDto` (NEW)

```csharp
// MediaHandler.Application/Features/Files/Queries/GetUnlinkedFiles/UnlinkedFileDto.cs
namespace MediaHandler.Application.Features.Files.Queries.GetUnlinkedFiles;

public record UnlinkedFileDto(
    Guid Id,
    string FilePath,
    long? FileSizeBytes,
    string? Format,
    string? Resolution
);
```

---

## New MediatR Queries & Commands (Backend)

| Type    | Name                           | Input                              | Output                                         |
| ------- | ------------------------------ | ---------------------------------- | ---------------------------------------------- |
| Query   | `GetMediaCompletenessQuery`    | `Guid MediaId`                     | `Result<IReadOnlyList<SeasonCompletenessDto>>` |
| Query   | `GetUnlinkedFilesQuery`        | `int Page, int PageSize`           | `Result<PagedResult<UnlinkedFileDto>>`         |
| Command | `LinkMediaFileCommand`         | `Guid MediaId, Guid FileId`        | `Result<Unit>`                                 |
| Command | `UnlinkMediaFileCommand`       | `Guid MediaId, Guid FileId`        | `Result<Unit>`                                 |
| Command | `UpdateMediaRootFolderCommand` | `Guid MediaId, string? RootFolder` | `Result<Unit>`                                 |

---

## Frontend Model Changes

### `media.model.ts` (MODIFIED)

```typescript
// Existing Media interface — add:
export interface Media {
  // ...existing fields...
  /** Effective root folder (manual override or auto-derived by API) */
  rootFolder: string | null;
}

// New type for completeness panel
export interface SeasonCompleteness {
  seasonNumber: number;
  seasonName: string;
  totalExpected: number;
  ownedCount: number;
  missingEpisodeNumbers: number[];
  isComplete: boolean;
}
```

---

## Frontend New Services

### `AdminMediaFileLinkService` (NEW)

Location: `src/app/core/services/admin-media-file-link.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AdminMediaFileLinkService {
  // Signals
  readonly unlinkedFiles = signal<UnlinkedFile[]>([]);
  readonly unlinkedFilesMeta = signal<PaginationMeta | null>(null);
  readonly unlinkedFilesLoading = signal(false);

  // Methods
  getUnlinkedFiles(page: number, pageSize: number): void {
    /* ... */
  }
  linkFile(mediaId: string, fileId: string): Observable<void> {
    /* ... */
  }
  unlinkFile(mediaId: string, fileId: string): Observable<void> {
    /* ... */
  }
  updateRootFolder(mediaId: string, rootFolder: string | null): Observable<void> {
    /* ... */
  }
}
```

### `MediaDetailService` (MODIFIED)

New methods appended:

```typescript
// Add to existing MediaDetailService
readonly completeness = signal<SeasonCompleteness[]>([]);
readonly completenessLoading = signal(false);
readonly completenessError = signal<string | null>(null);

loadCompleteness(mediaId: string): void { /* GET /media/{id}/completeness */ }
```

Link/unlink delegate to `AdminMediaFileLinkService` then call `loadMedia(id)` to refresh.

---

## State Transitions

### MediaFile.MediaId

```
null (unlinked)
  ─── link(mediaId) ──► mediaId (linked)
  ◄── unlink() ────────
```

### Media.RootFolder

```
null (no override, auto-derived)
  ─── updateRootFolder(path) ──► "path" (manual override)
  ─── updateRootFolder(null) ──► null (clear override)
```

---

## Completeness Derivation Logic

```
for each TvSeason where SeasonNumber > 0 AND NOT name contains "specials":
  ownedEps  = episodes.filter(e => e.episodeFileLinks.length > 0).map(e => e.episodeNumber)
  totalEps  = season.episodeCount ?? episodes.length
  missing   = [1..totalEps] - ownedEps     (set difference)
  isComplete = missing.length == 0
```

Edge cases:

- `TvSeason.EpisodeCount` is null → use `TvEpisodes.Count` as denominator.
- No TvSeasons enriched → return empty list; frontend shows "Metadata not available".
- Film media type → endpoint returns 400 Bad Request; frontend does not call it.
