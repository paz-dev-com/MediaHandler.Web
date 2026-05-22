# Feature Specification: Media File Linking & Missing Content Detection

**Feature Branch**: `feature/007-media-file-linking`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "Link media files to each TV show or film from detail pages. Link the root folder and open file explorer. Detect missing episodes & seasons (ignore season 0). Scan result page filter: 'TMDB Assigned' should only show entries with a TMDB match but not yet imported into the collection."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Media File Linking from Detail Page (Priority: P1)

A user views the detail page of a TV show or film in their collection. Alongside the existing file list, they see any media files that are currently linked to this media item plus a control to link additional unlinked files found on the NAS. The user selects one or more unlinked files (e.g., episodes discovered during a scan that were not automatically matched) and clicks "Link file(s)". The selected files are immediately associated with the media item and appear in the file list. The user can also unlink an existing file from the media item if it was incorrectly assigned.

**Why this priority**: The current workflow forces admins to link files solely from the admin scan results page, which breaks the natural flow of browsing the collection. Being able to link/unlink files from the media detail page reduces context-switching and makes corrections faster.

**Independent Test**: Navigate to any TV show or film detail page. Confirm the file list shows linked files with an unlink action. Confirm a "Link file" control is present. Select an unlinked file, link it, and verify it appears in the file list. Unlink a file and verify it disappears from the list.

**Acceptance Scenarios**:

1. **Given** a media detail page for a TV show with linked files, **When** the page loads, **Then** all currently linked media files are listed with their file paths and an "Unlink" action button for each.
2. **Given** a media detail page, **When** the user opens the "Link file" control, **Then** a searchable list of unlinked files (files with no associated media) is presented, filtered to files plausibly belonging to this media (same genre/type).
3. **Given** the user selects one or more unlinked files and confirms the link action, **When** the operation completes, **Then** the selected files appear in the linked file list without requiring a page reload.
4. **Given** the user clicks "Unlink" on a linked file, **When** the confirmation is accepted, **Then** the file is removed from the media item's file list and returned to the unlinked pool.
5. **Given** a film detail page (as opposed to a TV show), **When** the user links a file, **Then** the same linking behavior applies regardless of media type.
6. **Given** no unlinked files exist, **When** the user opens the "Link file" control, **Then** a message indicates that no unlinked files are available.

---

### User Story 2 — Root Folder Association & File Explorer Access (Priority: P1)

A user views a TV show or film in their collection. The detail page displays a "Root Folder" field showing the primary directory on the NAS where this media's files reside. For TV shows, this is the folder containing all season sub-folders. For films, this is the folder containing the film file. The user can click an "Open in explorer" action which copies the folder path to the clipboard (or launches a system file-manager protocol link) so they can navigate to it immediately. The user can also manually update the root folder if the detected path is incorrect.

**Why this priority**: Direct access to the physical location of media is a core utility for power users managing a NAS library. It bridges the gap between the web interface and the local file system, enabling quick manual operations without leaving the app.

**Independent Test**: View a film and a TV show detail page. Confirm the root folder path is displayed for each. Click "Open in explorer", confirm the path is copied to the clipboard. Update the root folder to a different path and confirm the change persists.

**Acceptance Scenarios**:

1. **Given** a media item with at least one linked file, **When** the user views the detail page, **Then** the root folder path is displayed — derived automatically from the common parent directory of the linked files.
2. **Given** the user clicks the "Open in explorer" button, **When** clipboard access is available, **Then** the root folder path is copied to the clipboard and a confirmation toast is shown.
3. **Given** clipboard access is blocked by the browser, **When** the user clicks "Open in explorer", **Then** a fallback dialog displays the path in a selectable text field for manual copying.
4. **Given** the user edits the root folder path manually and saves, **When** the update completes, **Then** the new path is stored and displayed, and missing episode detection runs against the new path.
5. **Given** a media item with no linked files, **When** the user views the detail page, **Then** the root folder field shows an empty state with a prompt to link files or set the path manually.
6. **Given** a TV show with files spread across multiple directories, **When** the root folder is displayed, **Then** it shows the highest common parent directory among all linked files.

---

### User Story 3 — Missing Episodes & Seasons Detection (Priority: P1)

A user views a TV show in their collection. A "Completeness" section on the detail page lists each season expected by TMDB. For each season (excluding season 0 and specials), the user sees how many episodes they own versus the total expected, and which specific episode numbers are missing. A visual indicator (e.g., a progress bar or badge) gives a quick glance at overall completeness. The missing episodes are derived from the linked files on record — no live NAS scan is triggered on page load.

**Why this priority**: Identifying missing content is one of the core reasons users maintain a media library application. Without this, users must manually cross-reference their files against TMDB data, which is the main pain point this feature resolves.

**Independent Test**: View a TV show that has 3 seasons on TMDB but only 2 seasons of files linked. Confirm seasons 1 and 2 show their owned episodes. Confirm season 3 appears as fully missing. Verify season 0 is not shown.

**Acceptance Scenarios**:

1. **Given** a TV show detail page, **When** the completeness section loads, **Then** each numbered season (season 1, 2, 3… — excluding season 0 and specials) is listed with the count of owned episodes vs. total TMDB episodes.
2. **Given** a season where the user owns all episodes, **When** the completeness section renders, **Then** that season is marked as complete with a visual "complete" indicator.
3. **Given** a season where some episodes are missing, **When** the completeness section renders, **Then** the specific missing episode numbers are listed or indicated (e.g., "Missing: E03, E05, E07").
4. **Given** a season that is entirely absent from the user's linked files, **When** the completeness section renders, **Then** the entire season is shown as missing with an "0 / N episodes" count.
5. **Given** a TV show that has season 0 (specials) defined on TMDB, **When** the completeness section renders, **Then** season 0 and specials seasons are not shown — only numbered seasons starting from season 1.
6. **Given** a TV show where all seasons and episodes are present, **When** the completeness section renders, **Then** an "All seasons complete" summary is displayed with no missing indicators.
7. **Given** a film (not a TV show), **When** the user views the detail page, **Then** no completeness section is shown — this feature applies to TV shows only.

---

### User Story 4 — Scan Results Filter: "TMDB Assigned (Pending Import)" (Priority: P2)

An admin user is on the scan results page (parent folders view). The current filter options are "Non assigned" and "TMDB assigned". The admin selects the "TMDB assigned" filter and expects to see only the folders/groups that have a TMDB match recorded from the scan (i.e., a TMDB entry was identified during scanning or manually assigned) but whose media has **not yet been imported** into the collection. Folders already fully imported into the collection with enriched metadata are excluded from this view, making it clearly actionable: everything in the "TMDB Assigned" filter still requires the import/enrichment step to be completed.

**Why this priority**: The current "TMDB assigned" label is ambiguous — it could mean "has assignment in scan DB" (pending import) or "already in collection". Clarifying this makes the admin's workflow unambiguous: the "TMDB assigned" list is exactly the backlog of pending imports, and the admin knows each item in this list still needs action.

**Independent Test**: Set up three folders: one unassigned, one assigned-but-not-imported, one fully in-collection. Select "TMDB Assigned" filter. Confirm only the assigned-but-not-imported folder appears. Confirm neither the unassigned nor the in-collection folder appears.

**Acceptance Scenarios**:

1. **Given** the scan results page, **When** the user applies the "TMDB Assigned" filter, **Then** only folders/groups with a TMDB match recorded but not yet imported into the collection are shown.
2. **Given** a folder that is fully imported and enriched in the media collection (status: InCollection), **When** the "TMDB Assigned" filter is active, **Then** this folder does NOT appear in the filtered results.
3. **Given** a folder with no TMDB assignment (status: NotAssigned), **When** the "TMDB Assigned" filter is active, **Then** this folder does NOT appear in the filtered results.
4. **Given** the "Non Assigned" filter is selected, **When** applied, **Then** only folders with no TMDB match at all are shown — behavior unchanged from current.
5. **Given** an admin wants to view items already in the collection, **When** they select the "In Collection" filter (new option), **Then** only folders whose media is fully imported and enriched in the collection are shown.
6. **Given** all filters are cleared (no filter active), **When** the page loads, **Then** all folders regardless of status are shown.

---

### Edge Cases

- What happens when a file is linked to a media item but is physically missing from the NAS? The file is displayed with a "file not found" indicator, but the link record remains in the database until explicitly removed.
- What happens when the user tries to link the same file to two different media items? The system rejects the second link with an error message indicating the file is already linked to another media item.
- What happens when the root folder cannot be auto-detected (no linked files)? The root folder field shows an empty state and the user can set it manually.
- What happens when TMDB episode count data is unavailable (no enrichment yet)? The completeness section shows a message indicating enrichment is needed before missing episode detection can run.
- What happens when a TV show has no enriched season data (NumberOfSeasons is null)? The completeness section shows a "Metadata not available" message rather than an empty list.
- What happens when a file unlink operation leaves the media item with zero linked files? The root folder is cleared automatically unless the user has manually set a custom root folder path.
- What happens when the "TMDB Assigned" filter is applied but there are no pending-import entries? An empty state message is shown ("All TMDB-matched entries have been imported into the collection").
- What happens when there are hundreds of unlinked files and the user opens the "Link file" control? The list is paginated or filtered by media type/name to avoid overwhelming the user.
- What happens when a TV show's linked files span mixed episode naming (e.g., some files match standard naming, others do not)? The episode matching logic uses the episode number extracted from the file path and falls back to sequential order if the pattern is ambiguous.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display all currently linked media files on the detail page for any TV show or film, with individual unlink actions for each file.
- **FR-002**: System MUST provide a "Link file" control on media detail pages that presents a list of unlinked media files for the user to select and associate.
- **FR-003**: System MUST immediately reflect newly linked or unlinked files in the detail page file list without requiring a full page reload.
- **FR-004**: System MUST prevent the same media file from being linked to more than one media item simultaneously, returning a clear error if attempted.
- **FR-005**: System MUST display the root folder path on each media detail page, auto-derived from the common parent directory of linked files when not explicitly set.
- **FR-006**: System MUST provide an "Open in explorer" action on the detail page that copies the root folder path to the clipboard.
- **FR-007**: System MUST provide a fallback text display of the root folder path when clipboard access is denied by the browser.
- **FR-008**: System MUST allow the user to manually override the root folder path on a media detail page, with the change persisted on the media record.
- **FR-009**: System MUST display a completeness section on TV show detail pages listing each season (season 1 and above) with owned vs. total episode counts.
- **FR-010**: System MUST exclude season 0 and any season explicitly typed as "Specials" from the completeness section.
- **FR-011**: System MUST identify and display the specific missing episode numbers within each incomplete season.
- **FR-012**: System MUST show a "complete" indicator for seasons where all TMDB-expected episodes are present in the linked files.
- **FR-013**: System MUST not show a completeness section on film detail pages.
- **FR-014**: System MUST show a "Metadata not available" message in the completeness section when the TV show has not yet been enriched with TMDB season/episode data.
- **FR-015**: System MUST update the "TMDB Assigned" filter on the scan results page to display only folders/groups with a TMDB match that have NOT yet been imported into the media collection (status: Assigned, not InCollection).
- **FR-016**: System MUST NOT include folders with "InCollection" status in the "TMDB Assigned" filter results.
- **FR-017**: System MUST add an "In Collection" filter option to the scan results page to display folders whose media is already fully imported and enriched in the collection.
- **FR-018**: System MUST preserve existing "Non Assigned" filter behavior — showing only folders with no TMDB match.
- **FR-019**: System MUST support showing all folders regardless of status when no filter is applied on the scan results page.

### Key Entities _(include if feature involves data)_

- **Media File Link**: Represents the association between a `MediaFile` (physical file on NAS) and a `Media` entity (TV show or film in the collection). A file may be linked to at most one media item. Attributes: file ID, media ID, file path, link status.
- **Root Folder**: The primary directory path on the NAS associated with a media item. Can be auto-derived from linked files' common parent, or manually set by the user. Stored on the `Media` entity. Attributes: absolute path, derivation source (auto/manual).
- **Season Completeness**: Derived data for a TV show comparing owned episode numbers (from linked files) against TMDB expected episodes per season. Excludes season 0 and special seasons. Attributes: season number, total expected episodes (TMDB), owned episode numbers, missing episode numbers, is complete flag.
- **Parent Folder Assignment Status (refined)**: The status of a scan result folder entry. Values: `NotAssigned` (no TMDB match), `Assigned` (TMDB match recorded but not yet imported into collection), `InCollection` (fully imported and enriched media record exists). The "TMDB Assigned" filter maps exclusively to the `Assigned` status.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user can link an unlinked file to a media item from the detail page in under 30 seconds, with no navigation to the admin scan results page required.
- **SC-002**: 100% of media detail pages for items with linked files display the root folder path correctly derived from those files' common parent directory.
- **SC-003**: The "Open in explorer" action successfully delivers the root folder path (via clipboard or fallback display) on 100% of invocations in supported browsers.
- **SC-004**: The completeness section correctly identifies all missing seasons and episodes for 100% of enriched TV shows tested, with season 0 excluded in all cases.
- **SC-005**: The completeness section loads within 2 seconds of the TV show detail page opening, without requiring a separate user action.
- **SC-006**: After applying the "TMDB Assigned" filter on the scan results page, 0% of results belong to the "InCollection" status — every visible entry is a pending import item.
- **SC-007**: The "In Collection" filter on the scan results page correctly shows only fully imported entries, with 0 false positives or false negatives.
- **SC-008**: Linking or unlinking a file from the detail page reflects in the file list within 1 second of the action completing.

## Assumptions

- The `MediaFile` entity already has a `FilePath` attribute (string) and a nullable `MediaId` foreign key; no schema changes are needed for the link/unlink feature beyond ensuring the relationship is updatable via a new API endpoint.
- The `Media` entity does not currently have a `RootFolder` field; a new nullable `string RootFolder` column will be added to store the manually-set or auto-derived path.
- Auto-derivation of root folder uses the common parent directory of all linked `MediaFile.FilePath` values for a given media item. For a single file, the parent directory of that file is used.
- Episode number matching (for completeness detection) relies on the episode numbers already parsed and stored in `TvEpisode` records linked to the media files, rather than re-parsing file names on the fly.
- TMDB season/episode metadata is already enriched and available via the existing `TvSeason` / `TvEpisode` entities populated during the enrichment pipeline; no additional TMDB API calls are needed for completeness detection.
- Season 0 exclusion is implemented by filtering out any `TvSeason` where `SeasonNumber == 0` or `Name` contains "Specials" (case-insensitive).
- The scan results page already uses `ParentFolderGroupDto` with statuses `NotAssigned`, `Assigned`, and `InCollection`; the "TMDB Assigned" filter will be remapped to query only `Assigned` status from the backend.
- A new "In Collection" filter option on the scan results page will query the `InCollection` status.
- The `ListParentFoldersQuery` already accepts a `status` string parameter; the change is purely in how the frontend labels and maps the filter values, plus ensuring the API correctly distinguishes `Assigned` from `InCollection`.
- Linking a file from the detail page calls a new `PUT /api/v1/media/{mediaId}/files/{fileId}/link` endpoint (or equivalent) and unlinking calls a corresponding `DELETE` or `PUT` endpoint. These endpoints handle updating `MediaFile.MediaId` and related `ScanItemDecision` records.
- The "Link file" control on the detail page fetches unlinked files from an existing or new `GET /api/v1/admin/files?unlinked=true&type={mediaType}` endpoint, paginated.
- File-explorer "opening" is client-side only — the app copies the path to the clipboard; no server-side process is launched. A system file-manager URI scheme (e.g., `file://`) may be used as a progressive enhancement where supported.
