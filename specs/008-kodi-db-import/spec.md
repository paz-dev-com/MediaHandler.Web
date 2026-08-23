# Feature Specification: Kodi Video Database Import — Admin UI

**Feature Branch**: `feature/008-kodi-db-import`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "A new backend feature 'Kodi Video Database Import' has been developed on the API side. We now need the front-end (admin UI) for it. The user (an admin) uploads Kodi's local SQLite video database (`MyVideos<version>.db`); the backend creates Media entries from the Kodi library and links them to already-scanned NAS files; the operation is on-demand, repeatable, idempotent, and produces browsable run reports."

**Backend contract (source of truth)**: `MediaHandler.API/specs/008-kodi-db-import/spec.md` and `plan.md` (§1.8 DTOs, §1.10 API Surface). All endpoints are admin-only under `admin/kodi-import`, wrapped in the standard `ApiResponse` envelope; paginated endpoints carry `meta`.

## Context & Consistency Anchors

- The feature is exposed only in the **admin area** (`/admin`, guarded by `authGuard` + `adminGuard`), as a new tab alongside Dashboard, Users, Library Roots, Scanner, Review, Scan Results, TMDB Enrichment.
- The closest analog is the **Scanner** feature: launch control + active-run status with polling + paged run history, plus a dedicated paged/filterable item list (Scan Results). The import UI mirrors this pattern so admins get a familiar workflow: upload → monitor → browse history → inspect report.
- The closest analog for path-mapping CRUD is **Library Roots** (list + add/edit dialog + delete with confirmation).
- All user-facing strings are bilingual en/fr; every enum value shown to the admin (mode, run status, item kind, item outcome, link outcome) has a translated label in both languages.
- API errors already surface as translated toasts via the global error interceptor; this feature adds **inline, code-specific messages** where the admin must act on the error (upload rejections, 409 conflict, duplicate mapping).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Upload a Kodi Database and Launch an Import or Preview (Priority: P1)

An administrator opens the Kodi Import admin page, selects their exported `MyVideos<version>.db` file, chooses between **Import** (apply changes) and **Preview** (dry run, changes nothing), and launches the operation. The UI validates the file early (type and naming pattern), submits it, and immediately shows the run as started. Rejections (wrong file name, unsupported version, oversized file, not a valid Kodi video database) are surfaced with specific, actionable messages — never a generic error.

**Why this priority**: Triggering the import is the entry point of the whole feature; without clear upload feedback the admin cannot tell a bad export from a system failure.

**Independent Test**: From the Kodi Import page, upload a valid `MyVideos121.db` in each mode and confirm a run starts and appears as active. Then upload an invalid file (renamed file, unsupported version, non-database file) and confirm each rejection shows its specific reason.

**Acceptance Scenarios**:

1. **Given** the Kodi Import admin page, **When** the admin opens the upload section, **Then** they see a file selector accepting `.db` files, a mode choice between "Import" (default) and "Preview" with a short explanation of each, and a launch button that stays disabled until a file is selected.
2. **Given** a selected file whose name does not match the `MyVideos<version>.db` pattern (e.g. `database.db`), **When** the admin tries to launch, **Then** an inline warning explains that the original Kodi file name must be kept (the version is read from the name) — the server remains the final authority if the admin proceeds.
3. **Given** a valid file and the "Import" mode, **When** the admin launches, **Then** the UI confirms the run started and switches to the active-run view showing the source file name, mode, schema version, and start time.
4. **Given** the "Preview" mode, **When** the run is launched, **Then** the active-run view and the resulting run are clearly labeled "Preview" so the admin knows nothing was persisted.
5. **Given** an upload rejected by the server, **When** the response arrives, **Then** a specific inline message is shown per error code: invalid file name (keep the original `MyVideos<version>.db` name), unsupported version (naming the detected version and the supported set), upload too large (naming the limit), invalid Kodi database (not a Kodi video database / corrupt — with guidance to close Kodi before copying the file).
6. **Given** an upload is in flight, **When** the admin views the form, **Then** the launch button shows a busy state and cannot be submitted twice.

---

### User Story 2 — Monitor the Active Run (Priority: P1)

An administrator sees live progress of the running import or preview: status, mode, source file, elapsed time, and counters updating as the run proceeds. When the run finishes, the UI stops polling, announces completion or failure, and refreshes the history. Only one run can be active at a time; if the admin tries to launch while one is running, they are told a run is already in progress and directed to it.

**Why this priority**: Runs can take minutes; without visible progress and a clear single-run rule, the admin would re-upload blindly and hit confusing 409s.

**Independent Test**: Start an import, watch the status panel update without page interaction until completion, and confirm the history refreshes. While a run is active, attempt a second launch and confirm the 409 is explained with a link to the active run.

**Acceptance Scenarios**:

1. **Given** a run was just launched or is already running when the admin opens the page, **When** the page loads, **Then** the active-run panel appears (mode, status, source file name, schema version, started-at, live counters) and updates automatically every few seconds without user interaction.
2. **Given** an active run reaches a terminal state (Completed or Failed), **When** the next poll observes it, **Then** polling stops, a completion or failure indication is shown, the final counters are displayed, and the run history is refreshed to include it.
3. **Given** no run is active, **When** the admin opens the page, **Then** the active-run panel shows an idle/empty state and the launch form is available.
4. **Given** a run is active, **When** the admin launches another upload, **Then** the launch is rejected with a message explaining that an import is already in progress and offering to view the active run.
5. **Given** a failed run, **When** the terminal state is shown, **Then** the failure reason provided by the server is displayed.
6. **Given** the admin navigates away mid-run and returns later, **When** the page reloads, **Then** the still-running (or since-finished) run is recovered and displayed correctly.
7. **Given** the active-run polling encounters a network failure, **When** this happens, **Then** the UI shows a recoverable warning state instead of silently freezing, and polling resumes or can be retried.

---

### User Story 3 — Browse Run History (Priority: P1)

An administrator browses past import and preview runs, newest first, in a paged table. Each row shows the mode (Import/Preview clearly distinguished), status, source file name, start/finish times, and headline counters; completed and failed runs offer a "View report" action.

**Why this priority**: Idempotent re-import is the core workflow — the admin compares successive runs ("what did the last sync change?") and needs quick access to each report.

**Independent Test**: Seed several runs of both modes, open the history, confirm ordering, paging, per-row counters, and navigation to any terminal run's report.

**Acceptance Scenarios**:

1. **Given** several past runs, **When** the admin opens the history, **Then** runs appear newest-first with mode, status, source file name, started/finished times, and summary counters (at minimum: items created, files linked, conflicts, needs review).
2. **Given** more runs than one page holds, **When** the admin pages, **Then** pages are fetched server-side (default page size 20) with a loading indicator.
3. **Given** a terminal run row, **When** the admin clicks "View report", **Then** the run report for that run opens.
4. **Given** no run has ever been executed, **When** the history loads, **Then** an empty state explains that no imports have been run yet.
5. **Given** preview runs exist in history, **When** the admin scans the list, **Then** preview runs are visually distinguished from real imports (e.g. a "Preview" badge on the mode).

---

### User Story 4 — Inspect a Run Report (Priority: P1)

An administrator opens the report of any past or current run: header (mode, status, source file, schema version, timestamps, failure reason when failed), the full set of summary counters, the list of unmatched Kodi path prefixes, and a paged, filterable per-item outcome list where every row shows the Kodi title, item kind, media kind, item outcome, link outcome, linked-file count, and a human-readable reason for non-success outcomes.

**Why this priority**: The report is how the admin discovers unmapped prefixes, conflicts, and items needing review — it turns "sync" into an auditable operation and drives the follow-up actions (fix mappings, scan, resolve review items).

**Independent Test**: Open the report of a completed run containing one item of each outcome category; verify every counter is displayed, the unmatched prefixes are listed, and filtering the item list by outcome and kind yields the expected rows with reasons.

**Acceptance Scenarios**:

1. **Given** a completed run, **When** the admin opens its report, **Then** all summary counters are displayed with translated labels: total items, movies created, shows created, episodes created, items reused, items unchanged, files linked, unmatched paths, no scanned files, unsupported locations, conflicts, no longer in Kodi, needs review, identity lookup failures, skipped music videos.
2. **Given** a run with unmatched paths, **When** the admin views the report, **Then** the distinct uncovered Kodi path prefixes are listed, with an affordance to create a path mapping pre-filled with that prefix.
3. **Given** a completed run, **When** the admin pages through the item list, **Then** each row shows Kodi title, item kind (Movie / TV Show / Episode / Music Video), media kind when applicable, outcome, link outcome when applicable, linked-file count, and the reason for non-success outcomes; pages are fetched server-side (default page size 50).
4. **Given** the item list, **When** the admin filters by outcome (e.g. Conflict, Needs Review) and/or by item kind, **Then** only matching items are shown and the paging total reflects the filter.
5. **Given** an item outcome row referencing a media entry, **When** the admin clicks the title (or an action), **Then** they can navigate to that media's detail page.
6. **Given** a filter combination matching no items, **When** applied, **Then** an empty state is shown within the list.
7. **Given** items reported as "needs review", **When** the admin views them, **Then** the UI indicates they are handled through the existing admin Review queue and offers a link to it.
8. **Given** a run id that does not exist, **When** the report URL is opened directly, **Then** a translated "run not found" state is shown with a way back to the history.
9. **Given** a preview run's report, **When** viewed, **Then** it is clearly labeled as a preview (projected outcomes, nothing persisted), including the "requires identity lookup" outcome meaning.

---

### User Story 5 — Manage Kodi→NAS Path Mappings (Priority: P2)

An administrator manages the ordered list of path prefix mappings (Kodi URI prefix → NAS path prefix) that every import applies: list them in evaluation order, create, edit, reorder (sort order), and delete. Duplicate Kodi prefixes are rejected with a clear message. Mappings persist across runs.

**Why this priority**: Path translation is the make-or-break rule of linking; the admin must be able to fix mappings after reading a report's unmatched prefixes, then re-import. P2 because a first import can run without any mapping (items are imported unlinked and reported).

**Independent Test**: Create two mappings, reorder them, edit one, delete one; attempt to create a duplicate Kodi prefix and confirm the 422 is surfaced inline; confirm the list order matches the evaluation order.

**Acceptance Scenarios**:

1. **Given** the path-mappings section, **When** it loads, **Then** all mappings are listed in evaluation order (sort order ascending), each showing Kodi prefix, NAS prefix, and actions to edit and delete.
2. **Given** the admin creates a mapping with a Kodi prefix (e.g. `smb://FREEBOX/Films/`) and a NAS prefix (e.g. `/nas/Movies/`), **When** saved, **Then** it appears in the list without a page reload and is placed last by default unless a sort order was given.
3. **Given** a Kodi prefix that already exists, **When** the admin saves a create or edit with that prefix, **Then** an inline message explains the prefix is already mapped and the list is unchanged.
4. **Given** invalid input (empty prefix, or a NAS prefix not starting with `/`), **When** the admin submits, **Then** client-side validation blocks the submission with a field-level message.
5. **Given** the admin deletes a mapping, **When** they confirm the deletion, **Then** the mapping disappears from the list; deletion requires an explicit confirmation.
6. **Given** no mappings exist, **When** the section loads, **Then** an empty state explains that without mappings, Kodi paths cannot be linked to NAS files and imports will report unmatched paths.
7. **Given** the admin edits a mapping's sort order, **When** saved, **Then** the list reflects the new evaluation order.
8. **Given** a mapping row was created from a run report's unmatched prefix, **When** the dialog opens, **Then** the Kodi prefix field is pre-filled with that prefix.

---

### User Story 6 — Per-Upload Mapping Overrides (Priority: P3 — pending scope decision)

When launching an import or preview, the administrator may optionally supply one-off Kodi→NAS prefix overrides that take precedence over the persisted mappings for that run only, without modifying the persisted list.

**Why this priority**: Useful for testing a candidate mapping in preview before persisting it. P3 and **flagged as an open question**: the backend supports it, but the UI could defer it to a follow-up.

**Acceptance Scenarios** (if retained):

1. **Given** the launch form, **When** the admin expands the overrides section, **Then** they can add zero or more override rows (Kodi prefix + NAS prefix) with client-side validation identical to persisted mappings.
2. **Given** overrides provided, **When** the run starts, **Then** the run applies them ahead of persisted mappings for that run only, and the persisted list is unchanged afterwards.
3. **Given** malformed override input, **When** the admin launches, **Then** client-side validation prevents submission before any request is sent.

---

### Edge Cases

- **Empty Kodi library**: the run completes successfully with all counters at zero; the report shows the zeroed counters and an empty item list state rather than an error.
- **Oversized file**: rejected before processing; the UI relays the server's limit message (the limit is server-configured; the UI does not hardcode it).
- **Music database or corrupt upload**: rejected as "not a valid Kodi video database" with guidance to close Kodi before copying the file; no run appears in history.
- **Second launch while running**: the 409 is translated into "an import is already in progress" with a link to the active run — never a raw error toast alone.
- **Failed run**: report shows status Failed, the server-provided failure reason, and whatever partial counters exist; the failure is also visible in the history row.
- **Run report requested while the run is still active**: the report shows live status/counters and keeps refreshing until the run terminates, or directs back to the active-run view.
- **Unauthorized / session expiry**: non-admin users never see the admin tab (route guard); an API 401/403 surfaces through the standard error handling.
- **Network failure during history or report loading**: the affected section shows an inline error with a retry action (not just a toast).
- **Non-ASCII titles and prefixes**: titles, reasons, and prefixes with accented or non-Latin characters render without mojibake.
- **Very large item lists**: filtering + server-side paging keep the report usable; page size choices mirror the scan results page.
- **Preview-only outcomes**: "requires identity lookup" appears only in preview reports and its label explains that a real import would resolve these against the provider.

## Requirements _(mandatory)_

### Functional Requirements

#### Navigation and access

- **FR-001**: System MUST expose the feature as a new tab in the admin area, labeled in both languages, available only to admin users via the existing admin route guard.
- **FR-002**: System MUST provide a Kodi Import page (launch + active run + history + path mappings) and a run-report view reachable from history rows and from the active-run panel, addressable by a stable URL per run id.

#### Upload and launch

- **FR-003**: System MUST let the admin select a `.db` file, choose the mode (Import default, Preview), and launch; the launch control is disabled without a file and while a submission is in flight.
- **FR-004**: System MUST warn early when the selected file name does not match `MyVideos<version>.db`, while still treating server validation as authoritative.
- **FR-005**: System MUST map each upload rejection to a specific translated inline message: invalid file name, unsupported version (with detected version), upload too large (with limit), invalid Kodi database, generic validation failure.
- **FR-006**: System MUST handle the single-active-run rejection with a dedicated message and a link to the active run.
- **FR-007**: On successful launch (202), system MUST switch to the active-run view and begin monitoring without further user action.

#### Monitoring

- **FR-008**: System MUST poll the active run at a regular short interval (consistent with the scanner feature) and update status and counters live; polling MUST stop on terminal states.
- **FR-009**: System MUST recover the active run on page load (an admin returning mid-run sees it; an idle state is shown when none is active).
- **FR-010**: System MUST refresh the run history when a run reaches a terminal state, and MUST display the failure reason for failed runs.

#### History and report

- **FR-011**: System MUST show run history newest-first, server-side paged (default 20), with mode (preview visually distinguished), status, source file, timestamps, and headline counters per row, plus a report action for terminal runs.
- **FR-012**: The run report MUST display the run header, all summary counters with translated labels, the unmatched Kodi prefixes list, and the per-item outcome list.
- **FR-013**: The per-item list MUST be server-side paged (default 50) and filterable by outcome and by item kind, and MUST show a human-readable reason for every non-success outcome.
- **FR-014**: System MUST surface "needs review" items as actionable via the existing admin Review queue (link), and MUST allow navigating from an outcome row to the referenced media entry when one exists.
- **FR-015**: System MUST show a translated not-found state when a run id does not exist, and inline error/retry states on load failures.

#### Path mappings

- **FR-016**: System MUST list persisted mappings in evaluation order and provide create, edit (including sort order), and confirmed delete, with the list updating in place after each mutation.
- **FR-017**: System MUST validate mapping input client-side (non-empty prefixes, NAS prefix starting with `/`) and MUST surface the duplicate-prefix rejection as an inline message.
- **FR-018**: System MUST offer creating a mapping pre-filled from a report's unmatched prefix.
- **FR-019**: If per-upload overrides are retained (Open Question 1), the launch form MUST accept optional one-off overrides applied only to that run, with the same validation as persisted mappings.

#### Internationalization and consistency

- **FR-020**: Every user-facing string — labels, enum values (modes, statuses, item kinds, outcomes, link outcomes), messages, empty states — MUST exist in both `en.json` and `fr.json`.
- **FR-021**: Dates, statuses, and paging behavior MUST be consistent with the existing scanner/scan-results admin features (localized dates, status tags, lazy paged tables).

### Key Entities _(frontend view — mirror of backend DTOs)_

- **Import Run**: one execution — id, mode (Import/Preview), status (Pending/Running/Completed/Failed), source file name, schema version, started/finished timestamps, failure reason, summary counts.
- **Import Counts**: totalItems, moviesCreated, showsCreated, episodesCreated, itemsReused, itemsUnchanged, filesLinked, unmatchedPaths, noScannedFiles, unsupportedLocations, conflicts, noLongerInKodi, needsReview, identityLookupFailures, skippedMusicVideos.
- **Import Item Outcome**: per Kodi library item — item kind (Movie/TvShow/Episode/MusicVideo), Kodi item id, title, media kind (Film/TvShow/none), outcome (Created/Reused/Unchanged/NeedsReview/RequiresIdentityLookup/IdentityLookupFailed/Conflict/SkippedMusicVideo/NoLongerInKodi), link outcome when applicable (Linked/AlreadyLinked/PartiallyLinked/UnmatchedPath/NoScannedFile/UnsupportedLocation/Conflict), linked file count, reason, Kodi path prefix, referenced media id.
- **Path Mapping**: id, Kodi prefix, NAS prefix, sort order (evaluation order).
- **Run Detail**: an import run plus the list of unmatched Kodi path prefixes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An admin can go from opening the page to a launched import in under 1 minute (select file, choose mode, launch), with no ambiguous step.
- **SC-002**: 100% of server upload rejections produce a specific, translated, actionable message — zero raw or generic-only errors.
- **SC-003**: A second launch attempt while a run is active always yields the dedicated "already in progress" message with a path to the active run — zero unexplained 409s.
- **SC-004**: 100% of run reports display all 15 counters, and every non-success item row shows its reason — the admin never has to guess what happened.
- **SC-005**: An admin can go from an unmatched prefix in a report to a saved mapping covering it in under 30 seconds via the pre-filled creation flow.
- **SC-006**: Every enum value and message renders correctly in both English and French; no untranslated keys appear in either language.
- **SC-007**: Monitoring never requires a manual page refresh: progress, completion/failure, and history refresh all happen automatically.

## Assumptions

- The feature lives under the existing `/admin` guarded area as a new tab; no changes to routing guards are needed.
- The run report is a dedicated view with its own URL per run id (mirroring Scan Results), not an expandable table row.
- Path mappings are managed in a section of the Kodi Import page (not a separate admin tab), consistent with the launch → report → fix-mappings loop.
- The active-run polling cadence and pattern reuse the scanner's established approach (regular interval, stop on terminal, history refresh).
- The upload size limit is server-configured; the UI relays the server's message rather than hardcoding a number.
- Runs cannot be cancelled from the UI because the backend exposes no cancel operation.
- The import is strictly one-way and file-based; the UI never offers any connection to a live Kodi instance.
- Per-upload mapping overrides (US6) are included provisionally pending Open Question 1.

## Out of Scope

- Cancelling a running import (no backend support).
- Scheduled or continuous synchronization; any connection to a running Kodi instance.
- Importing Kodi watched status, ratings, artwork, movie sets, or the music database (backend scope exclusions surfaced nowhere in the UI).
- Conflict resolution actions beyond reporting (admins use the existing link/unlink and review features).
- Editing which items get imported (the import is all-or-nothing per upload).
- Any change to the scanner, review queue, enrichment, or media detail features beyond links to them.
- Backend changes of any kind (the API contract is fixed and implemented).

## Open Questions

1. **Per-upload mapping overrides (US6)** — The backend accepts one-off overrides per upload. Options: (a) include the overrides UI in this delivery (recommended — enables "test a mapping in preview before persisting it"); (b) defer to a follow-up and ship launch/preview/history/report/mappings first. Include or defer?
2. **Outcome row → media detail navigation** — Outcome rows carry the referenced media id when an entry was created or reused. Options: (a) make the title/action navigate to the media detail page (recommended); (b) report-only, no navigation. Preference?
3. **Unmatched-prefix → mapping shortcut** — Options: (a) pre-filled create-mapping action on each unmatched prefix (recommended — closes the fix loop fast); (b) display-only list. Preference?
