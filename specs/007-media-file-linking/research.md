# Research: Media File Linking & Missing Content Detection

**Feature**: 007-media-file-linking  
**Date**: 2026-05-21  
**Phase**: 0 — Outline & Research

---

## R-001 — File Linking Architecture: MediaFile ↔ Media

**Decision**: Use the existing `MediaFile.MediaId` nullable FK as the sole link between a `MediaFile` and a `Media`. Linking = setting `MediaId`; unlinking = nulling it.

**Rationale**: The FK already exists in the domain model. No join table is needed for a many-to-one (file → media) relationship. The `GetMediaByIdQueryHandler` already includes `MediaFiles` via `Include(m => m.MediaFiles)`.

**Alternatives considered**:

- Separate `MediaFileLinkEvent` audit table — over-engineered for a small-team tool; no audit requirement in spec.
- Many-to-many link table — rejected because a file must belong to at most one media item (FR-004).

**Impact**: Two new MediatR commands (`LinkMediaFileCommand`, `UnlinkMediaFileCommand`). One new admin controller `AdminMediaFilesController`.

---

## R-002 — Root Folder Storage Strategy

**Decision**: Add a nullable `string? RootFolder` column to the `Media` entity/table. Auto-derivation (common parent path of linked files) is computed in the query handler at read time and returned in `MediaDto`. The stored value is only populated when the user explicitly sets/overrides it.

**Rationale**:

- Always recomputing from linked files paths is correct for auto-derivation but may return an incorrect value if files were manually reorganised. Storing the override avoids stale computed values.
- Keeping auto-derivation as a live computation (not persisted) ensures it always reflects current linked files when no override is set.
- The API returns the effective root folder = stored override ?? computed auto-derivation.

**Alternatives considered**:

- Always compute, never store — loses manual overrides across page reloads.
- Always store + recompute on every link/unlink change — premature optimisation; no observed performance issue at this scale.

**Implementation note for `GetMediaByIdQueryHandler`**:

```
effectiveRootFolder = media.RootFolder   // manual override
    ?? commonParent(media.MediaFiles.Select(f => f.FilePath))
    // returns null if no files
```

Common-parent algorithm: `Path.GetDirectoryName()` of the first file if single file; longest common leading path segments for multiple files.

---

## R-003 — Season Completeness Detection: Data Source

**Decision**: Completeness is derived entirely from the database via the existing `EpisodeFileLink` join table. Episodes with at least one `EpisodeFileLink` record are considered "owned". No live NAS scan is performed on page load.

**Rationale**: The `GetMediaStats` handler already uses `s.TvEpisodes.Any(e => e.EpisodeFileLinks.Any())` to count incomplete TV shows. The same logic can be reused to enumerate missing episodes per season in a new `GetMediaCompletenessQuery`.

**Season 0 exclusion**: Filter `WHERE SeasonNumber > 0 AND NOT (Name ILIKE '%specials%')`.

**Query shape** (`GetMediaCompletenessQueryHandler`):

```csharp
context.TvSeasons
    .Include(s => s.TvEpisodes)
        .ThenInclude(e => e.EpisodeFileLinks)
    .Where(s => s.MediaId == mediaId && s.SeasonNumber > 0
                && !s.Name.Contains("specials", StringComparison.OrdinalIgnoreCase))
    .OrderBy(s => s.SeasonNumber)
```

**Missing episode list**: For each season, `ownedEpisodeNumbers = episodes.Where(e => e.EpisodeFileLinks.Any()).Select(e => e.EpisodeNumber)`. Missing = all episode numbers in season − owned.

**Alternatives considered**:

- NAS folder scan on demand — requires filesystem access from the API, raises security concerns, contradicts FR-009 ("based on linked files").

---

## R-004 — Unlinked Files List for Link Picker

**Decision**: New `GetUnlinkedFilesQuery` in `Features/Files/Queries/GetUnlinkedFiles/`. Returns paginated `MediaFile` rows where `MediaId IS NULL`, optionally filtered by `MediaType` (Film = single-episode files, TvShow = episode files). Endpoint: `GET /api/v1/admin/media/unlinked-files?page=1&pageSize=20&type=TvShow`.

**Rationale**: The `GetMediaStats` handler already performs `context.MediaFiles.CountAsync(f => f.MediaId == null)`, confirming the pattern is used. Extending it to a paginated list query is straightforward.

**Frontend**: `FileLinkPickerDialogComponent` opens a `p-dialog`, loads unlinked files paginated via the service, and displays file path + size. A "Link" button per row calls `AdminMediaFileLinkService.linkFile()`.

**Filtering by type heuristic**: Pass the current media's type; the handler filters by file path pattern (`/Season` suffix → TvShow) or leaves unfiltered and lets the user search by filename. Given small dataset, no type filter is strictly needed on the backend.

---

## R-005 — Parent-Folder "TMDB Assigned" Label vs InCollection

**Decision**: No backend change required. The API `AdminParentFoldersController` already accepts `status=Assigned` and `status=InCollection` as separate filter values. The frontend `AdminParentFoldersPageComponent` already passes the raw enum value to the API. Only the i18n label for `statusAssigned` needs updating:

- `en.json`: `"statusAssigned": "TMDB Assigned (Pending Import)"`
- `fr.json`: `"statusAssigned": "TMDB assigné (import en attente)"`

**Rationale**: The existing behaviour is already semantically correct — selecting "Assigned" returns only folders pending import. The confusion stems solely from a vague label. Changing the label is the minimal, zero-risk fix.

**Alternatives considered**:

- Backend: merge Assigned+InCollection under one "TMDB Assigned" status then add a separate "In Collection" → unnecessary churn; the DB already has the right distinction.
- Rename the enum value in the API — breaking change with no benefit.

---

## R-006 — Admin-Only Guard for Linking Operations

**Decision**: All link/unlink/root-folder/unlinked-files endpoints are placed under the existing `[Authorize(Policy = "AdminOnly")]` policy on a new `AdminMediaFilesController`. The completeness endpoint (`GET /api/v1/media/{id}/completeness`) is on the existing `MediaController` under the standard `[Authorize]` (any authenticated user can read completeness — read-only, no data mutation).

**Rationale**: Consistent with existing API design (`AdminFilesController`, `AdminParentFoldersController` require `AdminOnly`; `MediaController` requires only `Authorize`). The frontend shows the link/unlink/root-folder UI elements only when the current user has the `admin` role (via existing `AuthService.isAdmin` signal).

---

## R-007 — Root Folder Auto-Update on File Link/Unlink

**Decision**: The root folder **is NOT automatically persisted** when files are linked/unlinked. Instead:

- If `Media.RootFolder` is `null` (no override), the API always computes it live from current linked files when returning `MediaDto`.
- If `Media.RootFolder` is set (manual override), it is returned as-is and is NOT cleared by link/unlink operations.
- The user can clear the override by sending an empty string to `PATCH /api/v1/admin/media/{id}/root-folder`.

**This resolves the spec contradiction** (US2 acceptance scenario 4 says "missing episode detection runs against the new path" — this refers to the completeness panel re-loading after a root folder edit triggers a page refresh, not a folder scan; the panel is always based on linked files, not the folder path).

**Rationale**: Avoids unexpected side-effects where linking a new file silently overwrites a carefully set root folder.
