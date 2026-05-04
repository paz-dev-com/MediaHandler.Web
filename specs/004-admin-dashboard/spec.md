# Feature Specification: Administration Dashboard

**Feature Branch**: `004-admin-dashboard`  
**Created**: 2026-04-10  
**Updated**: 2026-05-03  
**Status**: Clarified
**Input**: User description: "Administration section for admin roles only. Allows configuration of important settings including user management, NAS path global settings, scanner configuration, system health/status, and other practical administration features."

## Clarifications

### Session 2025-07-17

- Q: How should the frontend receive live scan status updates — polling (periodic HTTP requests), server-sent events (SSE), or WebSockets? → A: Polling — periodic HTTP requests every 3–5 seconds for scan status updates.
- Q: What should the Scanner section display — only the active scan, or also a history of recent scan runs? → A: Active scan + compact recent history, last 10–20 runs, paginated.
- Q: Can admins reopen a resolved or dismissed review item? → A: Yes — admins can reopen any resolved or dismissed item back to Open for reassignment.
- Q: Can admins toggle a library root's enabled status without removing it? → A: Yes — admins can toggle a library root enabled/disabled at will; disabled roots are excluded from scan targets but remain configured and are not deleted.
- Q: When selecting scan targets in the scan launcher, should disabled library roots appear as selectable (but inactive) options, or be hidden entirely? → A: Auto-exclude — disabled roots never appear as selectable targets in the scan launcher. "All roots" means all currently enabled roots only.

### Session 2025-07-18

- Extension: Scan results browser to show ALL scanned files (successful and problematic), not just review items.
- Extension: Manual TMDB search and assignment for problematic files without auto-suggested candidates.
- Extension: TV show parent-level TMDB assignment — assign once per show, propagate to all episodes.
- Extension: Batch TMDB enrichment scan — admin-triggered import of full TMDB metadata after validation.
- Extension: Opt-in automatic file renaming on NAS to match chosen TMDB source.
- Extension: Deprecation of legacy NAS Scanner page (`/nas-scanner`) — superseded by admin dashboard workflow.
- Q: How does the backend access the NAS for file rename (write) operations? → A: Local mounted path — the NAS is mounted as a filesystem path on the server; the backend uses standard filesystem I/O (e.g., `File.Move`) with no NAS-specific protocol or SDK required.

### Session 2026-05-03

- Q: Should TvShowGroup be a persisted database table or a transient/computed grouping? → A: Transient/computed — TvShowGroup is computed on-the-fly by grouping `ScanItemDecision` rows by parsed show name + scan ID. No dedicated DB table. Group identity is a derived key (hash of scanId + parsedShowName).
- Q: What is the default scope for TMDB enrichment re-runs — all entries, or only new/changed entries since the last enrichment? → A: Incremental — Enrich only media entries that are new or have had their TMDB assignment changed since the last enrichment run. Already-enriched unchanged entries are skipped.
- Q: What should the Scan Results Browser default view be when first opened? → A: Latest scan, all decisions — Pre-filtered to the most recent scan run; decision type filter set to "All". Admin can change filters freely.
- Q: What is the scope of TV show file renaming — file rename in-place or full folder/directory restructure? → A: File rename only — Renames the episode file in-place within its current directory. No folders are created or moved. Example: `show.s01e01.mkv` → `Show Name - S01E01 - Episode Title.mkv` in the same directory.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - User Management (Priority: P1)

As an admin, I want to view all registered users and manage their accounts so I can control who has access to the application and what level of access they have.

The admin navigates to the Administration section and selects "User Management". They see a paginated, searchable list of all users showing display name, email, role (User or Admin), and active status. The admin can change a user's role (promote to Admin or demote to User) and activate or deactivate a user account. Deactivated users cannot log in or use the application.

**Why this priority**: User management is the most critical administration function — controlling who can access the system and with what privileges is foundational to security and governance.

**Independent Test**: Can be tested by navigating to the admin section, viewing the user list, searching for a user, changing their role, and toggling their active status. Delivers immediate value for access governance.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the User Management section, **When** the page loads, **Then** they see a paginated table of all users with columns for display name, email, role, and active status.
2. **Given** the admin is viewing the user list, **When** they type a search term, **Then** the list filters to show only users whose name or email matches the search.
3. **Given** the admin is viewing a user with the "User" role, **When** they change the role to "Admin", **Then** the role is updated and a success confirmation is shown.
4. **Given** the admin is viewing a user with the "Admin" role, **When** they change the role to "User", **Then** the role is updated and a success confirmation is shown.
5. **Given** the admin is viewing an active user, **When** they deactivate the user, **Then** the user's active status changes to inactive and a success confirmation is shown.
6. **Given** the admin is viewing an inactive user, **When** they reactivate the user, **Then** the user's active status changes to active and a success confirmation is shown.
7. **Given** the admin is viewing the user list, **When** they paginate to the next page, **Then** the next set of users is displayed.

---

### User Story 2 - Library Root Management (Priority: P1)

As an admin, I want to manage NAS library root paths so I can configure where the application scans for media files. Library roots define the top-level directories on the NAS that contain media (movies, TV shows, or mixed content).

The admin navigates to the "Library Roots" section within Administration. They see a list of all configured library roots showing path, content kind (Movies, TV Shows, Mixed), optional label, enabled status, and creation date. The admin can add new library roots by specifying a path, content kind, and optional label. The admin can remove library roots that are no longer needed (existing media file records are soft-deleted). The admin can toggle a library root's enabled status at will — disabled roots remain configured and visible in the list but are excluded from all scan targets until re-enabled. The admin can filter roots by kind and enabled status.

**Why this priority**: Library roots are the foundational configuration for the Kodi-like scanner — without configured paths, the scanner has no targets. This is a prerequisite for all scanning operations.

**Independent Test**: Can be tested by navigating to the Library Roots section, viewing existing roots, adding a new root with a path and kind, toggling a root's enabled status, filtering by kind, and removing a root. Delivers the ability to configure scanner targets.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Library Roots section, **When** the page loads, **Then** they see a paginated list of all configured library roots with path, kind, label, enabled status, and creation date.
2. **Given** the admin is on the Library Roots section, **When** they click "Add Library Root", **Then** a form appears to enter a path, select a content kind (Movies, TV Shows, Mixed), and optionally provide a label.
3. **Given** the admin fills in a valid new library root, **When** they submit the form, **Then** the root is added and appears in the list with a success confirmation.
4. **Given** the admin tries to add a library root with a path that already exists, **When** they submit the form, **Then** the system displays a duplicate error message and does not create a second entry.
5. **Given** the admin views a library root, **When** they click "Remove", **Then** a confirmation prompt appears; upon confirming, the root is removed from the list.
6. **Given** a scan is currently running that targets a library root, **When** the admin tries to remove that root, **Then** the system shows an error indicating removal is blocked while a scan is in progress.
7. **Given** the admin is on the Library Roots section, **When** they filter by kind or enabled status, **Then** the list updates to show only matching roots.
8. **Given** the admin views an enabled library root, **When** they click "Disable", **Then** the root's enabled status changes to disabled, a success confirmation is shown, and the root is excluded from future scan targets while remaining configured.
9. **Given** the admin views a disabled library root, **When** they click "Enable", **Then** the root's enabled status changes to enabled, a success confirmation is shown, and the root is included in future scan targets.

---

### User Story 3 - Scanner Operations & Monitoring (Priority: P2)

As an admin, I want to start, monitor, and cancel NAS scan operations from the administration section so I can control when the system scans for new media and track scan progress.

The admin navigates to the "Scanner" section within Administration. They can start a new scan by selecting which library roots to scan (or "All", meaning all currently enabled roots) and choosing a scan mode (Full or Incremental). **Only enabled library roots appear in the scan root selector — disabled roots are automatically excluded and never shown as selectable targets.** While a scan is running, they see live status via polling (HTTP requests every 3–5 seconds) including scan state (Pending, Running, Completed, Failed, Cancelled) and scan counts (total discovered, added, updated, unchanged, removed, excluded, needs review). They can cancel a running scan. They can view details of a completed scan including all file decisions (see US7 — Scan Results Browser). Below the active scan panel, a compact paginated scan history table shows the last 10–20 runs per page, displaying scan mode, status, start/finish timestamps, and summary counts for each run.

**Why this priority**: The scanner is the core data ingestion mechanism. Admins need to control scan operations to keep the media library up to date and troubleshoot import issues.

**Independent Test**: Can be tested by navigating to the Scanner section, starting a Full scan on all enabled roots, observing the running status update, then viewing the completed scan results. Can also test cancellation by starting a scan and immediately cancelling it. Verify that any disabled roots do not appear in the root selector.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Scanner section, **When** the page loads, **Then** they see a scan control panel with options to select library roots (only enabled roots are listed), choose scan mode (Full or Incremental), and a "Start Scan" button.
2. **Given** one or more library roots are disabled, **When** the admin opens the scan root selector, **Then** the disabled roots do not appear in the selector at all — only enabled roots are listed as selectable targets.
3. **Given** no scan is currently running, **When** the admin clicks "Start Scan", **Then** the system starts a scan with the selected enabled roots and mode, and shows a running status indicator.
4. **Given** a scan is running, **When** the admin views the Scanner section, **Then** they see the current scan status (Pending/Running), counts (discovered, added, updated, unchanged, removed, excluded, needs review), and a "Cancel Scan" button.
5. **Given** a scan is running, **When** the admin clicks "Cancel Scan", **Then** the scan transitions to Cancelled status and the cancel button is replaced with the start controls.
6. **Given** a scan is already running, **When** the admin tries to start another scan, **Then** the system shows an error indicating a scan is already in progress.
7. **Given** a scan has completed, **When** the admin views its details, **Then** they see final counts, start/finish timestamps, and any failure reason if the scan failed.
8. **Given** a completed scan has file decisions, **When** the admin views its details, **Then** they can navigate to the Scan Results Browser to see all files processed (successful matches, needs-review items, unchanged, etc.).
9. **Given** the admin navigates to the Scanner section, **When** the page loads, **Then** below the active scan panel they see a paginated scan history table showing recent runs (10–20 per page) with scan mode, status, timestamps, and summary counts.
10. **Given** the admin is viewing the scan history, **When** they click on a completed scan row, **Then** they see the detailed results for that scan run including full counts and can navigate to the Scan Results Browser filtered to that run.

---

### User Story 4 - Review Queue Management (Priority: P2)

As an admin, I want to review and resolve media files that the scanner could not automatically match to TMDB entries so I can manually assign, dismiss, or delete unresolved items, including searching TMDB manually for files with no automatic candidates.

The admin navigates to the "Review Queue" section within Administration. They see a paginated list of review items that require attention. Each item shows the file path, the reason it needs review (no TMDB result, multiple candidates, year mismatch, unparseable episode, etc.), its status (Open, Resolved, Dismissed), parsed title/year information, and TMDB candidate suggestions (if any). The admin can resolve an item by assigning a specific TMDB entry from the candidates, **or by performing a manual TMDB search** to find and assign a TMDB entry that was not auto-suggested. The admin can also dismiss an item, delete the underlying file record, or reopen a previously resolved or dismissed item back to Open for reassignment. The admin can filter review items by status, reason, and scan run.

**Why this priority**: The review queue is the complement to the scanner — it handles edge cases where automatic matching fails. Without it, unmatched files remain orphaned and never appear in users' collections. Manual TMDB search ensures even files with zero auto-suggested candidates can be resolved.

**Independent Test**: Can be tested by navigating to the Review Queue, viewing open items, filtering by reason, selecting a review item, resolving it by assigning a TMDB candidate or by performing a manual TMDB search and assigning the result. Delivers the ability to complete the scan-to-collection pipeline for ambiguous files.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Review Queue, **When** the page loads, **Then** they see a paginated list of open review items showing file path, review reason, parsed title/year, and TMDB candidate suggestions (if available).
2. **Given** the admin views a review item with TMDB candidates, **When** they select a candidate and click "Assign", **Then** the item is resolved, its status changes to Resolved, and the file is linked to the selected TMDB entry.
3. **Given** the admin views a review item with no TMDB candidates (NoTmdbResult), **When** they click "Search TMDB", **Then** a search panel opens allowing free-text search of TMDB by title, with results displayed including title, year, poster, and media type.
4. **Given** the admin has performed a manual TMDB search, **When** they select a result and click "Assign", **Then** the review item is resolved and linked to the manually found TMDB entry.
5. **Given** the admin views a review item, **When** they click "Dismiss", **Then** the item is marked as Dismissed and no TMDB link is created.
6. **Given** the admin views a review item, **When** they click "Delete", **Then** the underlying file record is removed and the item is marked as Dismissed.
7. **Given** the admin views a resolved or dismissed review item, **When** they click "Reopen", **Then** the item's status is reset to Open and it becomes available for reassignment.
8. **Given** the admin is on the Review Queue, **When** they filter by status (Open, Resolved, Dismissed), **Then** only items matching the selected status are displayed.
9. **Given** the admin is on the Review Queue, **When** they filter by review reason (e.g., No TMDB Result, Multiple Candidates), **Then** only items matching that reason are displayed.
10. **Given** the admin is on the Review Queue, **When** they filter by scan run, **Then** only items from that specific scan run are shown.

---

### User Story 5 - System Health Overview (Priority: P3)

As an admin, I want to see the health status of the application at a glance on the administration landing page so I can quickly identify if any services are down or degraded.

The Administration landing page displays a system health panel showing the backend API health status (Healthy/Unhealthy), server timestamp, and application version. This provides a quick operational status check without needing external monitoring tools.

**Why this priority**: Health monitoring is useful for quick diagnostics but is supplementary — dedicated monitoring tools handle deeper issues. This is a convenience for the admin doing day-to-day tasks.

**Independent Test**: Can be tested by navigating to the Administration landing page and verifying the health panel shows the current status, timestamp, and version from the health endpoint.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Administration landing page, **When** the page loads, **Then** they see a system health panel showing the API status (Healthy or Unhealthy), the server timestamp, and the application version.
2. **Given** the backend API is healthy, **When** the admin views the health panel, **Then** the status is displayed as "Healthy" with a positive visual indicator (e.g., green badge).
3. **Given** the backend API is unhealthy, **When** the admin views the health panel, **Then** the status is displayed as "Unhealthy" with a warning visual indicator (e.g., red badge).
4. **Given** the health endpoint is unreachable, **When** the admin views the health panel, **Then** a clear error message is shown indicating the API is not responding.

---

### User Story 6 - Bilingual Support for Administration (Priority: P3)

As an admin using the application in French or English, I want all administration section labels, buttons, messages, table headers, and status indicators to appear in my chosen language.

**Why this priority**: The app already supports bilingual UI. All new administration text must follow the same pattern, but this is a cross-cutting concern that can be layered on after core functionality works.

**Independent Test**: Can be tested by switching language to French, navigating to each administration sub-section, and verifying all labels and text are displayed in French.

**Acceptance Scenarios**:

1. **Given** the admin's language is set to English, **When** they navigate to the Administration section, **Then** all labels, buttons, table headers, status indicators, and messages appear in English.
2. **Given** the admin's language is set to French, **When** they navigate to the Administration section, **Then** all labels, buttons, table headers, status indicators, and messages appear in French.

---

### User Story 7 - Scan Results Browser (Priority: P2)

As an admin, I want to browse ALL files processed by a scan — both successfully matched and problematic — so I can verify automatic TMDB matches, correct wrong assignments, and see a complete picture of what the scanner found.

The admin navigates to the "Scan Results" section within Administration (or accesses it from a completed scan's details). They see a paginated, filterable list of all scan item decisions from recent scans. Each entry shows the file path, decision type (Added, Updated, Unchanged, Removed, Excluded, NeedsReview), the assigned TMDB entry (if any), and the TMDB candidates that were considered. For successfully auto-matched files, the admin can view the TMDB candidates that were evaluated and **change the TMDB assignment** if the automatic choice was incorrect. The admin can filter by scan run, decision type, media type (Movie/TV Show), and library root. For TV shows, files are grouped by parent show (see US9).

**Why this priority**: Without visibility into all scanned files, admins can only react to problems. Seeing successful matches allows proactive quality control — catching auto-match errors before they propagate to user-visible collections.

**Independent Test**: Can be tested by running a scan, then navigating to Scan Results, viewing all file decisions, filtering by decision type, expanding a successfully matched file to see TMDB candidates, and changing its TMDB assignment to a different candidate.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Scan Results section, **When** the page loads, **Then** they see a paginated list of scan item decisions pre-filtered to the most recent scan run with the decision type filter set to "All"; the list shows file path, decision type, assigned TMDB entry (title, year, poster), and timestamp. The admin can freely change the scan run or decision type filters at any time.
2. **Given** the admin is viewing scan results, **When** they filter by decision type (e.g., Added, NeedsReview), **Then** only items matching that decision type are displayed.
3. **Given** the admin is viewing scan results, **When** they filter by scan run, **Then** only items from that specific scan are shown.
4. **Given** the admin is viewing scan results, **When** they filter by media type (Movie or TV Show), **Then** only items of that media type are displayed.
5. **Given** the admin views a successfully auto-matched file, **When** they expand its details, **Then** they see the TMDB candidates that were considered including title, year, poster, and match score.
6. **Given** the admin views a successfully matched file and the automatic TMDB choice was wrong, **When** they select a different TMDB candidate and click "Reassign", **Then** the file's TMDB assignment is updated to the newly selected entry and a success confirmation is shown.
7. **Given** the admin views a successfully matched file and none of the auto-suggested candidates are correct, **When** they click "Search TMDB", **Then** a search panel opens allowing free-text TMDB search and assignment (same as US4 manual search).
8. **Given** the admin is viewing scan results for TV show files, **When** the results load, **Then** TV show episode files are grouped under their parent show for easier navigation (see US9).
9. **Given** the admin is viewing scan results, **When** they filter by library root, **Then** only items from that library root are displayed.

---

### User Story 8 - Manual TMDB Search & Assignment (Priority: P2)

As an admin, I want to manually search TMDB and assign a specific entry to any media file — whether it's a review item with no candidates or a successfully matched file that needs correction — so I can ensure every file in the library has the correct TMDB source.

The admin can trigger a manual TMDB search from two contexts: (1) the Review Queue for problematic files (US4), or (2) the Scan Results Browser for any file (US7). The search panel allows free-text queries against TMDB, displaying results with title, year, poster image, overview, and media type (Movie or TV Show). The admin selects the correct result and confirms the assignment. The existing TMDB search endpoint (`GET /api/v1/tmdb/search`) is reused for the search functionality.

**Why this priority**: This is essential for completing the scan-to-collection pipeline when automatic matching fails entirely or produces incorrect results. It complements the existing candidate-based assignment.

**Independent Test**: Can be tested from the Review Queue by opening a NoTmdbResult item, searching TMDB by title, reviewing search results, selecting the correct one, and confirming the assignment. Verify the file is linked to the chosen TMDB entry.

**Acceptance Scenarios**:

1. **Given** the admin is on a review item or scan result, **When** they click "Search TMDB", **Then** a search panel opens with a text input field and a search button.
2. **Given** the admin enters a search query, **When** they click search or press Enter, **Then** TMDB search results are displayed showing title, year, poster image, overview, and media type.
3. **Given** TMDB search returns results, **When** the admin selects a result, **Then** the result is highlighted and an "Assign" button becomes available.
4. **Given** the admin has selected a TMDB result, **When** they click "Assign", **Then** the file is linked to the selected TMDB entry and a success confirmation is shown.
5. **Given** the admin searches TMDB and no results are found, **When** the search completes, **Then** an empty state message is shown suggesting alternative search terms.
6. **Given** the admin is searching TMDB, **When** they refine their search query, **Then** updated results are displayed reflecting the new query.

---

### User Story 9 - TV Show Parent-Level TMDB Assignment (Priority: P2)

As an admin, I want to assign a TMDB source once at the TV show level and have it apply to all episode files under that show, so I don't have to manually assign TMDB entries to hundreds of individual episode files.

When viewing TV show files in the Scan Results Browser or Review Queue, episode files are grouped by their detected parent show (based on parsed show name from file paths/names). The admin assigns the TMDB source at the show level — selecting the correct TV show entry from TMDB. This assignment propagates to all episode files under that show. Individual episode-level TMDB assignment is not required; the show-level assignment provides the series identity, and episode-level metadata (season/episode numbers) is derived from parsed file names.

**Why this priority**: TV show libraries can contain hundreds or thousands of episode files. Without parent-level assignment, the admin would need to individually assign each episode, making the workflow impractical for large libraries.

**Independent Test**: Can be tested by scanning a library root containing a TV show with multiple seasons and episodes, navigating to Scan Results, observing that the episodes are grouped under the parent show, assigning a TMDB source at the show level, and verifying all episodes inherit the assignment.

**Acceptance Scenarios**:

1. **Given** the admin is viewing scan results containing TV show files, **When** the results load, **Then** episode files are grouped under their parent show name, showing the show name as a group header with a count of episodes.
2. **Given** a TV show group has no TMDB assignment, **When** the admin clicks "Assign TMDB" on the show group header, **Then** a TMDB search panel opens pre-filled with the parsed show name and filtered to TV show results.
3. **Given** the admin selects a TMDB TV show result, **When** they confirm the assignment, **Then** all episode files under that show group are linked to the selected TMDB series and a success confirmation shows the number of episodes updated.
4. **Given** a TV show group already has a TMDB assignment, **When** the admin clicks "Change TMDB" on the show group, **Then** they can search and assign a different TMDB series, and all episodes are updated to the new assignment.
5. **Given** a TV show group has a TMDB assignment, **When** the admin expands the group, **Then** each episode file shows the inherited TMDB series along with its parsed season and episode numbers.
6. **Given** TV show files are in the Review Queue, **When** the admin views episodes from the same show, **Then** they are grouped under the parent show and can be resolved at the show level.

---

### User Story 10 - Batch TMDB Enrichment Scan (Priority: P2)

As an admin, after reviewing and validating all scanned files (auto-matched and manually assigned), I want to launch a batch TMDB enrichment scan that populates the database with full TMDB metadata for all validated media entries.

The admin navigates to the Scanner section or a dedicated "Enrichment" panel within Administration. After confirming that all files have been reviewed and assigned correct TMDB sources, they click "Start TMDB Enrichment". This triggers a backend process that fetches full metadata from the TMDB API for every validated media entry — including detailed descriptions, cast, crew, genres, ratings, episode details, poster/backdrop images, and other metadata. The enrichment process runs as a background operation with progress reporting. This is a deliberate, admin-initiated action — it only runs when explicitly triggered, not automatically after a scan.

**Why this priority**: The enrichment scan is the final step in the scan → review → validate → enrich pipeline. Without it, matched files have only basic TMDB identifiers but no rich metadata for user-facing display.

**Independent Test**: Can be tested by completing a scan, reviewing and assigning all files, then launching the enrichment scan. Verify that the enrichment process runs, shows progress, and that media entries are populated with full TMDB metadata (descriptions, cast, genres, etc.) upon completion.

**Acceptance Scenarios**:

1. **Given** the admin has reviewed all scan results and assigned TMDB sources, **When** they navigate to the enrichment panel, **Then** they see a summary of validated media entries ready for enrichment: the count of new entries and changed-assignment entries (movies and TV shows) that will be processed, plus the count of already-enriched unchanged entries that will be skipped.
2. **Given** the admin is on the enrichment panel, **When** they click "Start TMDB Enrichment", **Then** a confirmation dialog appears summarizing what will be enriched (e.g., "Enrich 12 new/changed movies and 4 new/changed TV shows with full TMDB metadata? 29 already-enriched unchanged entries will be skipped.").
3. **Given** the admin confirms the enrichment, **When** the process starts, **Then** they see a progress indicator showing the current item being processed, items completed, and total items.
4. **Given** the enrichment scan is running, **When** the admin views the enrichment panel, **Then** they see the live progress via polling (similar to scan status polling).
5. **Given** the enrichment scan completes successfully, **When** the admin views the results, **Then** they see a summary of enriched entries (count enriched, count failed, any errors).
6. **Given** some media entries fail TMDB enrichment (e.g., TMDB API errors, invalid TMDB IDs), **When** the enrichment completes, **Then** failed entries are listed with error reasons so the admin can investigate.
7. **Given** no validated media entries exist (nothing to enrich), **When** the admin views the enrichment panel, **Then** an empty state message indicates there are no entries ready for enrichment.
8. **Given** an enrichment scan is already running, **When** the admin tries to start another, **Then** the system prevents duplicate enrichment runs with an appropriate message.

---

### User Story 11 - Automatic File Renaming (Priority: P3)

As an admin, I want the option to automatically rename ambiguous media files on the NAS to match their assigned TMDB source so that future scans can match them correctly without manual intervention.

After assigning a TMDB source to a file (via the Review Queue, Scan Results Browser, or TV show group assignment), the admin is offered the option to rename the physical file on the NAS. The rename is **file-in-place only** — the file is renamed within its current directory; no new folders are created and no files are moved to different directories. Directory restructuring is out of scope for this iteration. The rename follows a standard naming convention: "Movie Title (Year)" for movies and "Show Name - SXXEXX - Episode Title" for TV show episodes (e.g., `show.s01e01.mkv` → `Show Name - S01E01 - Episode Title.mkv`). This is an opt-in action — the admin must explicitly choose to rename; it never happens automatically. A preview of the new file name is shown before confirmation. The rename operation updates both the physical file on the NAS and the file path records in the database.

**Why this priority**: File renaming is a quality-of-life improvement that prevents repeat scan issues for poorly named files. It is not critical to the core workflow and carries risk (modifying files on the NAS), so it is lower priority.

**Independent Test**: Can be tested by assigning a TMDB source to a poorly named file, clicking "Rename File", reviewing the preview of the new name, confirming the rename, and verifying the file path is updated in both the NAS filesystem and the database.

**Acceptance Scenarios**:

1. **Given** the admin has just assigned a TMDB source to a file, **When** the assignment is confirmed, **Then** a "Rename File" option is presented (not triggered automatically).
2. **Given** the admin clicks "Rename File" for a movie, **When** the rename dialog opens, **Then** they see a preview showing the current file name and the proposed new name in "Movie Title (Year)" format.
3. **Given** the admin clicks "Rename File" for a TV show episode, **When** the rename dialog opens, **Then** they see a preview showing the current file name and the proposed new name in "Show Name - SXXEXX - Episode Title" format (e.g., `show.s01e01.mkv` → `Show Name - S01E01 - Episode Title.mkv`); the renamed file will remain in its current directory — no folder restructuring occurs.
4. **Given** the admin reviews the rename preview, **When** they click "Confirm Rename", **Then** the physical file on the NAS is renamed, the database file path record is updated, and a success confirmation is shown.
5. **Given** the admin reviews the rename preview, **When** they click "Cancel", **Then** no rename occurs and the file retains its original name.
6. **Given** the rename operation fails (e.g., file locked, permissions error, disk full), **When** the error occurs, **Then** the admin sees a clear error message and the file retains its original name — no partial rename state.
7. **Given** the admin is viewing a TV show group, **When** they rename at the show level, **Then** the rename dialog offers to rename all episode files under that show in a single operation, with a preview of all proposed changes; each episode file is renamed in-place within its current directory following the "Show Name - SXXEXX - Episode Title" convention. No new folders are created and no files are moved.

---

### User Story 12 - Legacy NAS Scanner Page Deprecation (Priority: P1)

As an admin, I want the legacy NAS Scanner page (`/nas-scanner`) to be removed since the Administration Dashboard now fully supersedes its functionality with a more comprehensive scan → review → validate → enrich workflow.

The old NAS Scanner page provided basic scan + auto-import without review capabilities. The new admin dashboard provides full scanning control (US3), review queue (US4), scan results browsing (US7), manual TMDB assignment (US8), TV show grouping (US9), batch enrichment (US10), and file renaming (US11). The legacy page route is removed, and any navigation references or bookmarks to `/nas-scanner` redirect to the Administration Scanner section.

**Why this priority**: Keeping the legacy page creates confusion about which workflow to use and risks data inconsistencies if both paths are used simultaneously. Removal ensures a single, consistent media ingestion workflow.

**Independent Test**: Can be tested by verifying the `/nas-scanner` route no longer loads the old page, that existing navigation links to it are removed, and that navigating to `/nas-scanner` redirects to the Administration Scanner section.

**Acceptance Scenarios**:

1. **Given** a user navigates to `/nas-scanner`, **When** the route loads, **Then** they are redirected to the Administration Scanner section.
2. **Given** the application sidebar, **When** the admin views the navigation, **Then** there is no "NAS Scanner" link — scanning is accessed only through the Administration section.
3. **Given** any existing code references the legacy NAS Scanner page, **When** the page is removed, **Then** all related components, routes, services, and translation keys are cleaned up.

---

### Edge Cases

- What happens when a non-admin user attempts to navigate to the Administration route? They are redirected to the collection page by the existing admin guard — the Administration route is not accessible.
- What happens when the admin tries to change their own role from Admin to User? The role change is applied and the admin loses access to the admin section. They are redirected to the collection page on the next navigation. The system does not prevent self-demotion — this is a deliberate action.
- What happens when the admin tries to deactivate their own account? The deactivation is applied. The admin will be unable to log in on the next session.
- What happens when the admin adds a library root with an invalid or inaccessible path? The backend validates the path. If the path is outside allowed boundaries, a validation error is returned. If the path is syntactically valid but does not exist on the NAS, the root is saved — the scanner will report errors when it attempts to scan that root.
- What happens when the admin tries to remove a library root while a scan targeting it is running? The backend returns a conflict error and the UI displays a message indicating removal is blocked.
- What happens when the admin tries to disable a library root while a scan targeting it is currently running? The toggle is allowed — the running scan continues to completion using its originally targeted roots; only future scan runs will exclude the now-disabled root.
- What happens when the review queue is empty (all items resolved)? The Review Queue shows an empty state message indicating there are no items requiring review.
- What happens when the admin starts a scan and the NAS is unreachable? The scan transitions to Failed status with a failure reason describing the NAS connection error.
- What happens when the admin navigates between Administration sub-sections? Each sub-section loads its own data independently. Navigation within the admin section does not affect other sections' state.
- What happens when the health endpoint is slow to respond? The health panel shows a loading indicator until the response arrives. No timeout is enforced on the client side.
- What happens when the admin changes the TMDB assignment for a file that has already been enriched? The old TMDB metadata is replaced. The admin should re-run the enrichment scan after reassignment to fetch metadata for the new TMDB source. Because enrichment is incremental, the re-assigned entry is treated as "changed" and will be included in the next enrichment run automatically.
- What happens when the admin wants to force re-enrich already-enriched, unchanged entries (no new scan or TMDB assignment change)? Force re-enrichment of already-enriched entries whose TMDB assignment has not changed is not supported in this iteration. To re-enrich such entries, the admin must start a new full scan cycle to reset the enrichment state.
- What happens when the admin tries to rename a file that has been moved or deleted from the NAS since the last scan? The backend returns an error indicating the file was not found at the expected path. The admin is advised to run a new scan to update file records.
- What happens if the admin expects directory restructuring (moving files to organized subfolders) as part of TV show renaming? Directory restructuring is out of scope for this iteration. File renaming is in-place only — the renamed file stays in its current directory. No new Season XX subfolders or show-name parent folders are created.
- What happens when a TV show group contains episodes from multiple different shows (misdetected grouping due to similar names)? The admin can split the group by individually assigning different TMDB sources to specific episodes, overriding the parent-level assignment.
- What happens when the admin launches TMDB enrichment but some files have no TMDB assignment? Files without TMDB assignments are skipped during enrichment. The enrichment summary reports the count of skipped files so the admin can address them.
- What happens when the TMDB API rate limit is hit during enrichment? The enrichment process pauses and retries with backoff. If rate limiting persists, the enrichment reports partial completion with the count of remaining items.
- What happens when the admin tries to rename a file and the target name already exists on the NAS? The backend returns a conflict error and the rename is not performed. The admin is informed of the naming collision.
- What happens when a user navigates to the old `/nas-scanner` URL? They are redirected to the Administration Scanner section. No error page is shown.
- What happens when the admin assigns a Movie TMDB entry to a TV show file (or vice versa)? The system allows it — the admin is responsible for correct media type assignment. A warning indicator may be shown if the assigned media type differs from the library root's content kind.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an Administration section accessible only to users with the Admin role.
- **FR-002**: System MUST add an "Administration" navigation item to the sidebar, visible only to admin users.
- **FR-003**: System MUST display a paginated, searchable list of all registered users in the User Management sub-section.
- **FR-004**: System MUST allow admins to change a user's role between User and Admin.
- **FR-005**: System MUST allow admins to toggle a user's active status (activate/deactivate).
- **FR-006**: System MUST display a paginated, filterable list of configured library roots in the Library Roots sub-section.
- **FR-007**: System MUST allow admins to add a new library root by specifying a path, content kind (Movies, TV Shows, Mixed), and optional label.
- **FR-008**: System MUST prevent adding a library root with a path that is already registered (duplicate detection).
- **FR-009**: System MUST allow admins to remove a library root, with a confirmation prompt before deletion.
- **FR-009a**: System MUST allow admins to toggle a library root's enabled status at will. Disabled roots are excluded from all scan targets but remain configured and visible in the Library Roots list. Toggling is permitted even while a scan is running; the running scan continues with its original targets and only future scans reflect the change.
- **FR-010**: System MUST block library root removal while a scan targeting that root is in progress, displaying an appropriate error message.
- **FR-011**: System MUST allow admins to start a new scan with a selected scan mode (Full or Incremental) and optionally target specific library roots. Only currently enabled library roots are presented as selectable targets in the scan launcher; disabled roots are automatically excluded and never rendered as options.
- **FR-011a**: When an admin selects "All" roots in the scan launcher, the system MUST interpret this as all currently enabled library roots only. Disabled roots are never included in an "All" scan target selection.
- **FR-012**: System MUST display the current scan status (Pending, Running, Completed, Failed, Cancelled) and scan counts (discovered, added, updated, unchanged, removed, excluded, needs review) while a scan is running or after completion. Status updates are fetched via polling (HTTP GET requests every 3–5 seconds while a scan is active).
- **FR-012a**: System MUST display a paginated scan history table below the active scan panel, showing the last 10–20 scan runs per page with scan mode, status, start/finish timestamps, and summary counts. Admins can click a history row to view full scan details.
- **FR-013**: System MUST allow admins to cancel a running scan.
- **FR-014**: System MUST prevent starting a new scan while another scan is already running.
- **FR-015**: System MUST display a paginated, filterable list of review items in the Review Queue sub-section, showing file path, review reason, status, parsed metadata, and TMDB candidate suggestions.
- **FR-016**: System MUST allow admins to resolve a review item by assigning a TMDB entry from the candidate list or by performing a manual TMDB search.
- **FR-016a**: System MUST allow admins to reopen any resolved or dismissed review item, resetting its status to Open so it can be reassigned.
- **FR-016b**: System MUST provide a manual TMDB search panel within the Review Queue, allowing free-text search against the TMDB API and assignment of a result to a review item.
- **FR-017**: System MUST allow admins to dismiss a review item without assigning TMDB metadata.
- **FR-018**: System MUST allow admins to delete a review item's underlying file record.
- **FR-019**: System MUST allow filtering review items by status (Open, Resolved, Dismissed), review reason, and scan run.
- **FR-020**: System MUST display a system health panel on the Administration landing page showing API health status, server timestamp, and application version.
- **FR-021**: System MUST support bilingual display (English and French) for all administration labels, buttons, messages, table headers, and status indicators — including all new sections (Scan Results, Enrichment, Rename dialogs).
- **FR-022**: System MUST provide sub-navigation within the Administration section to switch between User Management, Library Roots, Scanner, Scan Results, Review Queue, and Enrichment.
- **FR-023**: System MUST display success confirmations after successful operations (role change, status toggle, root addition/removal/enable/disable, scan start/cancel, review resolution, TMDB reassignment, file rename, enrichment completion).
- **FR-024**: System MUST display meaningful error messages when operations fail, including backend validation errors, conflict errors, and TMDB API errors.
- **FR-025**: System MUST display a paginated, filterable list of ALL scan item decisions in the Scan Results Browser, showing file path, decision type, assigned TMDB entry, and TMDB candidates considered. On initial load, the browser MUST default to the most recent scan run with the decision type filter set to "All". Filterable by scan run, decision type, media type, and library root. Admins can change all filters freely.
- **FR-026**: System MUST allow admins to change the TMDB assignment for a successfully auto-matched file by selecting from the original candidates or performing a manual TMDB search.
- **FR-027**: System MUST group TV show episode files by their parent show in the Scan Results Browser and Review Queue, allowing TMDB assignment at the show level that propagates to all episodes in the group. Grouping is computed on-the-fly by aggregating `ScanItemDecision` rows by parsed show name + scan ID — no dedicated TvShowGroup database table exists. Group identity is a derived key (hash of scanId + parsedShowName).
- **FR-028**: System MUST allow admins to launch a batch TMDB enrichment scan that fetches full metadata from the TMDB API for validated media entries. Enrichment runs **incrementally by default** — only media entries that are new or have had their TMDB assignment changed since the last enrichment run are processed; already-enriched unchanged entries are automatically skipped. The enrichment is an explicit admin action, not triggered automatically. Force re-enrichment of already-enriched unchanged entries is not supported in this iteration.
- **FR-029**: System MUST display enrichment progress via polling (current item, completed count, total count) and a summary upon completion (enriched count, failed count, error details).
- **FR-030**: System MUST prevent starting a new enrichment scan while one is already running.
- **FR-031**: System MUST offer an opt-in file rename action after TMDB assignment. The rename is **file-in-place only** — the file is renamed within its current directory; no new folders are created and no files are moved to different directories. Directory restructuring is out of scope for this iteration. The rename updates the physical file on the NAS (which is locally mounted as a filesystem path; the backend uses standard filesystem I/O such as `File.Move`) and the database file path record. A preview of the new file name is shown before confirmation.
- **FR-032**: System MUST follow standard naming conventions for file renames: "Movie Title (Year)" for movies and "Show Name - SXXEXX - Episode Title" for TV show episodes. The renamed file remains in its current directory; no subdirectory creation or file movement occurs.
- **FR-033**: System MUST prevent file rename if the target file name already exists on the NAS, displaying a conflict error.
- **FR-034**: System MUST remove the legacy NAS Scanner page (`/nas-scanner`) and redirect any navigation to that URL to the Administration Scanner section.
- **FR-035**: System MUST remove all sidebar navigation references to the legacy NAS Scanner page.
- **FR-036**: System MUST allow batch file renaming at the TV show level, offering to rename all episode files under a show in a single operation with a preview of all proposed changes. All renames are in-place within each file's current directory — no folder restructuring occurs.

### Key Entities

- **User**: A registered person in the system. Has display name, email, preferred language, role (User or Admin), and active status. Managed by admins via the User Management section.
- **LibraryRoot**: A configured top-level NAS directory path that the scanner targets. Has path, content kind (Movies, TV Shows, Mixed), optional label, enabled status, and creation/update timestamps.
- **ScanRun**: A record of a scanner execution. Has scan mode (Full or Incremental), status (Pending, Running, Completed, Failed, Cancelled), start/finish timestamps, failure reason, targeted library root IDs, and scan counts. Recent runs (last 10–20 per page) are displayed in the Scanner section's paginated history table.
- **ScanCounts**: Statistics from a scan run. Includes total discovered, added, updated, unchanged, removed, excluded, and needs review counts.
- **ScanItemDecision**: A record of the scanner's decision for each individual file in a scan run. Has file path, decision type (Added, Updated, Unchanged, Removed, Excluded, NeedsReview), associated scan run, assigned TMDB entry (if matched), TMDB candidates JSON (candidates considered during matching), parsed metadata (title, year, season, episode), media type, and library root reference. Used by the Scan Results Browser to show all processed files.
- **ReviewItem**: A media file that could not be automatically matched during scanning. Has file path, review reason, status (Open, Resolved, Dismissed), parsed title/year/season/episode, TMDB candidate suggestions, resolution details, and timestamps.
- **TmdbCandidate**: A potential TMDB match suggested for a review item or scan item decision. Has TMDB ID, media kind, title, year, match score, and poster path.
- **TvShowGroup**: A transient, computed grouping of episode files — not a persisted database table. Computed on-the-fly by grouping `ScanItemDecision` rows by parsed show name + scan ID. Group identity is a derived key (hash of scanId + parsedShowName). Used in the Scan Results Browser and Review Queue to allow show-level TMDB assignment that propagates to all episodes in the group. Has parsed show name, episode count, TMDB assignment (if any), and list of child ScanItemDecision references.
- **MediaFile**: A tracked file on the NAS. Has file path, media ID (FK to Media), library root ID, fingerprint, and other metadata. File path is updated when a rename operation occurs.
- **EnrichmentRun**: A record of a batch TMDB enrichment execution. Has status (Pending, Running, Completed, Failed), start/finish timestamps, total items, enriched count, failed count, and error details for failed items. Progress is reported via polling.
- **HealthStatus**: The operational status of the backend API. Reports healthy/unhealthy state, server timestamp, and application version.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admins can find and modify a specific user's role or active status within 30 seconds using search and the user list.
- **SC-002**: Admins can add a new library root (path + kind) in under 1 minute.
- **SC-003**: Admins can start a scan and see its live status within 3 clicks from the Administration landing page.
- **SC-004**: Admins can resolve a review item (assign from candidates, manual TMDB search, dismiss, or delete) in under 30 seconds per item.
- **SC-005**: Non-admin users cannot access any part of the Administration section — they are redirected to the collection page.
- **SC-006**: All administration UI elements are displayed correctly in both English and French with no untranslated keys visible.
- **SC-007**: 90% of admins can successfully complete their first user management and library root configuration tasks on their first session without assistance.
- **SC-008**: The system health panel loads and displays the current backend status within 3 seconds.
- **SC-009**: Admins can browse all files from a completed scan and verify/change TMDB assignments within the Scan Results Browser without needing to access any external tools.
- **SC-010**: Admins can assign a TMDB source to a TV show and have it propagate to all episodes in under 1 minute, regardless of the number of episodes.
- **SC-011**: Admins can complete the full scan → review → validate → enrich workflow for a library of 500 files in under 30 minutes (excluding TMDB API response time).
- **SC-012**: After TMDB enrichment, 100% of validated media entries have full metadata populated (descriptions, genres, cast, poster images).
- **SC-013**: File rename operations complete successfully with no orphaned or partially renamed files — rename is atomic per file.
- **SC-014**: The legacy `/nas-scanner` route redirects to the Administration Scanner section with zero user-facing errors.

## Assumptions

- The backend API endpoints for user management (`GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/role`, `PUT /api/v1/admin/users/{id}/active`), library roots (`GET/POST/DELETE /api/v1/admin/library-roots`), scanning (`POST/GET /api/v1/admin/scan`, `GET /api/v1/admin/scan/active`, `POST /api/v1/admin/scan/{id}/cancel`), review queue (`GET /api/v1/admin/review-items`, `POST /api/v1/admin/review-items/{id}/resolve`), and health (`GET /api/v1/health`) are fully implemented and operational.
- All admin endpoints require Admin role authorization and are guarded server-side.
- The existing `AuthService`, `ApiService`, `adminGuard`, error interceptor, and Transloco i18n infrastructure are available and working.
- The existing sidebar dynamically shows admin-only navigation items when the user has Admin role — this pattern is extended for the new Administration entry.
- The legacy NAS Scanner page (`/nas-scanner`) is to be fully removed. Its route is replaced with a redirect to the Administration Scanner section. All related components, services, and translation keys are cleaned up.
- TMDB candidate poster images for review items use the same TMDB image URL pattern as the rest of the application (`https://image.tmdb.org/t/p/{size}{path}`).
- The frontend does not enforce timeouts for admin operations; timeout management is the backend's responsibility.
- Scan status polling is implemented via periodic HTTP GET requests to the active scan endpoint every 3–5 seconds. Polling starts when a scan is initiated and stops when the scan reaches a terminal state (Completed, Failed, or Cancelled).
- Enrichment progress polling uses the same pattern as scan status polling — HTTP GET every 3–5 seconds while the enrichment is running.
- Library root path validation (checking if the path exists on the NAS) is the backend's responsibility. The frontend only validates that the path field is not empty.
- The scan launcher's root selector is populated exclusively from enabled library roots. The frontend filters the root list client-side (or requests only enabled roots from the backend) before rendering selector options; disabled roots never appear as selectable scan targets regardless of how many are configured.
- The application targets modern evergreen browsers (Chrome, Firefox, Edge, Safari latest 2 versions).
- The existing `TmdbController` endpoints (`GET /api/v1/tmdb/search?query&language` and `POST /api/v1/tmdb/import/{tmdbId}?mediaType&language`) are reused for manual TMDB search and enrichment. No new TMDB endpoints are needed for the search functionality.
- **New backend endpoints will be needed** for the following capabilities (not yet implemented):
  - `GET /api/v1/admin/scan/{scanId}/decisions` — Browse scan item decisions (all files, not just review items), with filtering by decision type, media type, and library root.
  - `PUT /api/v1/admin/scan-decisions/{id}/reassign` — Change the TMDB assignment for an already-matched file.
  - `POST /api/v1/admin/files/{id}/rename` — Rename a physical file on the NAS and update the database record. Returns preview of new name when called with `?preview=true`.
  - `POST /api/v1/admin/enrichment/start` — Launch a batch TMDB enrichment scan for all validated media entries.
  - `GET /api/v1/admin/enrichment/status` — Get current enrichment progress (running/completed/failed, counts).
  - `GET /api/v1/admin/scan-decisions/tv-groups?scanId` — Get TV show file groupings computed on-the-fly from `ScanItemDecision` rows for a given scan (no dedicated TvShowGroup DB table; group identity is hash of scanId + parsedShowName).
  - `PUT /api/v1/admin/tv-groups/{groupId}/assign` — Assign TMDB source at the TV show group level, propagating to all episodes in the group (groupId is the derived hash key).
  - `POST /api/v1/admin/tv-groups/{groupId}/rename` — Batch rename all episode files under a TV show group in-place within their current directories; no folder restructuring occurs.
- The `ScanItemDecision` entity in the backend already tracks every file decision per scan (Added, Updated, Unchanged, Removed, Excluded, NeedsReview) and can be leveraged to power the Scan Results Browser without schema changes.
- TV show grouping is transient and computed at query time — the backend groups `ScanItemDecision` rows by parsed show name + scan ID with no dedicated TvShowGroup table in the database. Group identity is a derived key (hash of scanId + parsedShowName). Grouping accuracy depends on consistent file naming within a show's directory.
- File rename operations are atomic — if a rename fails, the file retains its original name and path with no partial state.
- **NAS access for rename operations**: The NAS is locally mounted as a filesystem path on the server. File rename/move operations are performed using standard filesystem I/O (`File.Move` or equivalent) — no NAS-specific protocol (SMB, NFS client SDK, etc.) is required on the backend.
- The rename naming conventions ("Movie Title (Year)" for movies, "Show Name - SXXEXX - Episode Title" for TV show episodes) are sourced from the assigned TMDB metadata. File renames are in-place within the file's current directory — no folder restructuring or file movement is performed.
