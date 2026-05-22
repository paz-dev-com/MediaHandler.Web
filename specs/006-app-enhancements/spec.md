# Feature Specification: Application Enhancements

**Feature Branch**: `feature/006-app-enhancements`  
**Created**: 2025-07-24  
**Updated**: 2025-07-25  
**Status**: Draft  
**Input**: User description: "Admin root folder selection, i18n completeness audit, TV show production status & missing seasons, wishlist indicator on search, icon visibility fixes, enhanced profile with picture upload, user info in nav menu, fix frontend warnings, pagination/filtering/sorting on all data tables, scan results position retention after assignment, real-time scanner counters, review item multi-select batch assignment, TMDB enrichment detailed process view, collection page totals and completeness, file location quick access"

## Clarifications

### Session 2026-05-16

API research findings before questions:

- `GET /api/v1/files/locations` already exists → returns `string[]` (sourced from `Nas.BasePaths` config) ✅
- `POST /api/v1/admin/scan` dispatches `StartScanCommand(LibraryRootIds, Mode)` — **no `language` parameter exists** in the command or request body ⚠️
- `UserDto` has no picture field; `AuthController` has only sync/me/preferences — **no profile picture endpoint or storage exists** ❌
- `Media.Status` ("Returning Series", "Ended") and `Media.NumberOfSeasons` are stored in the database but **`MediaDto` does not expose them** ⚠️

Decisions taken:

- **Scan language (FR-003)**: Option B chosen — add `language?: string` to `StartScanRequest` and `StartScanCommand`; the frontend passes the active UI locale explicitly when triggering a scan. This mirrors the pattern already used by the legacy `POST /api/v1/files/scan-and-import?language=` endpoint.
- **Profile picture storage (FR-013–FR-016)**: Option A chosen — create a new API endpoint (e.g. `POST /api/v1/users/profile-picture`) with server-side file storage. The frontend handles the upload UX and displays the stored URL.
- **TV show fields in DTO (FR-011–FR-012)**: Option A chosen — extend `MediaDto` to include `status` (string) and `numberOfSeasons` (int) so the frontend can display production status and detect missing seasons without additional TMDB calls.
- **Frontend warnings (FR-018–FR-019)**: Directly treat known suspects — deprecated lifecycle hooks, missing `NgOptimizedImage` width/height attributes, and `ExpressionChangedAfterItHasBeenChecked` errors — without a prior audit phase.

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Icon Visibility Fixes (Priority: P1)

A user navigates the application and sees rounded action icons throughout the interface. Currently, only the circular outline is visible — the icon glyph inside is not rendered, making the button purpose unclear. The dark/light mode toggle in the navigation menu is also invisible. After this fix, every icon across the app displays its glyph correctly in both dark and light themes.

**Why this priority**: Broken icons degrade usability across the entire app. Users cannot determine what action buttons do, making the application effectively unusable for any icon-driven interaction.

**Independent Test**: Can be verified by navigating through every page (Collection, Search, Wishlist, Profile, Admin, Nav menu) and confirming all icons render their glyph inside the rounded container, in both dark and light mode.

**Acceptance Scenarios**:

1. **Given** any page with rounded action icons, **When** the page loads in dark mode, **Then** the icon glyph inside each rounded button is clearly visible with sufficient contrast against the background.
2. **Given** the navigation menu, **When** the user views the dark/light mode toggle, **Then** the sun or moon icon is clearly visible in both themes.
3. **Given** any page with action icons, **When** the user switches between dark and light mode, **Then** all icon glyphs remain visible with appropriate contrast in both modes.
4. **Given** the application on a mobile viewport, **When** the bottom navigation bar is displayed, **Then** all navigation icons are visible and readable.

---

### User Story 2 — Translation Completeness & Language-Aware Scanning (Priority: P1)

A user sets their interface language to French. When they trigger a media scan from the admin panel, the scan queries TMDB using French-language search terms (matching the user's UI language) instead of always using English. Additionally, all UI elements display in the selected language — including status badges (e.g., "Watched" → "Vu"), date formats (European DD/MM/YYYY for French, US MM/DD/YYYY for English), toast notification categories, and any other text that was previously hardcoded or untranslated.

**Why this priority**: Language-aware scanning directly impacts data quality — wrong-language searches return wrong or missing results. Incomplete translations undermine the bilingual experience promised by the app.

**Independent Test**: Switch the app to French, trigger a scan, and verify TMDB queries use French-language parameters. Navigate every page and confirm no English text remains when French is selected (and vice versa).

**Acceptance Scenarios**:

1. **Given** a user whose UI language is French, **When** the admin triggers a media scan, **Then** the scan queries TMDB with the `language=fr` parameter.
2. **Given** a user whose UI language is English, **When** the admin triggers a media scan, **Then** the scan queries TMDB with the `language=en` parameter.
3. **Given** a user in French mode, **When** they view any status badge (scan status, review status, enrichment status, watched/unwatched), **Then** the badge text is displayed in French.
4. **Given** a user in French mode, **When** they view any date field, **Then** the date is formatted as DD/MM/YYYY (European format).
5. **Given** a user in English mode, **When** they view any date field, **Then** the date is formatted as MM/DD/YYYY (US format).
6. **Given** a user in French mode, **When** a toast notification appears, **Then** the toast title/category and message are displayed in French.
7. **Given** a full translation audit, **When** all pages and components are reviewed, **Then** zero hardcoded or untranslated English strings remain when the French locale is active.

---

### User Story 3 — Admin Library Root Folder Selection (Priority: P2)

An admin user opens the "Add Library Root" dialog. Instead of manually typing the full path, the system presents a dropdown of available root folders sourced from the API's application settings (e.g., "/Disque NAS 1", "/Disque NAS 2"). After selecting a root folder, the user can type an additional sub-path to complete the full library root path. The composed path is then saved as the library root.

**Why this priority**: Reduces data entry errors and ensures library roots are anchored to valid, server-configured mount points. This improves the admin workflow and prevents misconfigured paths.

**Independent Test**: Open the Add Library Root dialog, verify the root folder dropdown is populated from the API, select a root, add a sub-path, and confirm the composed path is saved correctly.

**Acceptance Scenarios**:

1. **Given** the admin opens the "Add Library Root" dialog, **When** the dialog loads, **Then** a dropdown displays the list of available root folders retrieved from the API's application settings.
2. **Given** the admin selects a root folder (e.g., "/Disque NAS 1"), **When** they type a sub-path (e.g., "/Films"), **Then** the composed path (e.g., "/Disque NAS 1/Films") is shown as the full path preview.
3. **Given** the API returns no root folders, **When** the dialog loads, **Then** the user sees a message indicating no root folders are configured and can still manually type a full path as a fallback.
4. **Given** the admin selects a root and sub-path, **When** they submit the form, **Then** the full composed path is sent to the API and the new library root appears in the list.

---

### User Story 4 — Wishlist Indicator on TMDB Search Page (Priority: P2)

A user searches for media on the TMDB search page. For any search result that is already present in the user's wishlist, a visual indicator (badge or icon) is displayed on the result card, distinguishing it from media not on the wishlist. This complements the existing "Already in your collection" indicator.

**Why this priority**: Prevents users from accidentally adding duplicates to their wishlist and provides quick visual context about what they've already bookmarked.

**Independent Test**: Add a media item to the wishlist, then search for it on the TMDB search page. Confirm the wishlist indicator appears on the matching result card.

**Acceptance Scenarios**:

1. **Given** a media item is in the user's wishlist, **When** the user searches TMDB and that item appears in results, **Then** the result card displays a visible wishlist indicator (e.g., a heart/bookmark icon or badge).
2. **Given** a media item is NOT in the user's wishlist, **When** it appears in TMDB search results, **Then** no wishlist indicator is shown on the card.
3. **Given** a media item is both in the collection and in the wishlist, **When** it appears in TMDB search results, **Then** both the "already in collection" and the wishlist indicators are displayed.
4. **Given** the user adds a media item to the wishlist from the search page, **When** the action completes, **Then** the wishlist indicator immediately appears on that result card without requiring a page refresh.

---

### User Story 5 — TV Show Production Status & Missing Seasons (Priority: P2)

A user views a TV show in their collection. The detail page indicates whether the show is still in production or has ended. If the user's collection is missing seasons that exist according to TMDB data, those missing seasons are highlighted to help the user identify gaps in their library.

**Why this priority**: Gives users actionable information about their TV show collection completeness and whether more content is expected from ongoing shows.

**Independent Test**: View a TV show that is still in production and has missing seasons. Confirm the production status badge appears and missing seasons are listed.

**Acceptance Scenarios**:

1. **Given** a TV show is still in production (per TMDB data), **When** the user views its detail page, **Then** a "Still in Production" indicator is displayed prominently near the show title or metadata area.
2. **Given** a TV show has ended production, **When** the user views its detail page, **Then** an "Ended" indicator is displayed.
3. **Given** a TV show has 5 seasons on TMDB but the user only has seasons 1, 2, and 4, **When** the user views the seasons section, **Then** seasons 3 and 5 are listed as "Missing" with a distinct visual treatment (e.g., greyed out, badge, or separate section).
4. **Given** a TV show where the user has all available seasons, **When** the user views the seasons section, **Then** no missing season indicators are shown.
5. **Given** a TV show still in production, **When** a new season is announced on TMDB but not yet in the user's collection, **Then** the newly announced season is indicated as missing on the next metadata refresh.

---

### User Story 6 — Enhanced Profile Page with Custom Picture (Priority: P3)

A user visits their profile page and can upload a custom profile picture. By default, the profile picture displayed is the one from their authentication provider (e.g., Google profile photo if they logged in via Google on Okta/Auth0). If the user uploads a custom picture, it replaces the default auth provider picture. The user can also remove their custom picture to revert to the auth provider default.

**Why this priority**: Personalization enhances user engagement but is not critical to core media management functionality.

**Independent Test**: Log in with a Google account, confirm the Google profile picture appears by default. Upload a custom picture, confirm it replaces the default. Remove it, confirm reversion.

**Acceptance Scenarios**:

1. **Given** a user logged in via an auth provider with a profile picture (e.g., Google), **When** they visit the profile page, **Then** their auth provider profile picture is displayed as the default.
2. **Given** a user on the profile page, **When** they upload a custom profile picture, **Then** the uploaded picture replaces the auth provider picture and is saved.
3. **Given** a user with a custom profile picture, **When** they choose to remove it, **Then** the profile picture reverts to the auth provider default.
4. **Given** a user attempts to upload a file that is not a valid image or exceeds the size limit, **When** they submit the upload, **Then** a clear error message is displayed and the current picture is not changed.
5. **Given** a user logged in via an auth provider without a profile picture, **When** they visit the profile page, **Then** a generic avatar placeholder is displayed.

---

### User Story 7 — User Info in Navigation Menu (Priority: P3)

The navigation menu displays the user's first name, last name, and profile picture next to the logout button. This gives users a visual confirmation of which account they are logged into and personalizes the navigation experience.

**Why this priority**: Polish and personalization feature. Depends on User Story 6 (profile picture) for full implementation.

**Independent Test**: Log in and verify the nav menu shows the user's name and profile picture next to the sign-out button.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** the navigation menu is displayed, **Then** the user's first name, last name, and profile picture appear next to the logout button.
2. **Given** a user without a custom profile picture, **When** the navigation menu is displayed, **Then** the auth provider picture (or generic avatar if none) is shown next to their name.
3. **Given** a mobile viewport, **When** the navigation menu is displayed, **Then** the user info is presented in a compact format appropriate for the smaller layout.

---

### User Story 8 — Fix Frontend Warnings (Priority: P3)

A developer opens the browser console while using the application. Currently, there are warnings being emitted on the frontend. After this fix, no avoidable warnings appear in the console during normal application use.

**Why this priority**: Technical hygiene that improves developer experience and can prevent future issues, but does not directly impact end-user functionality.

**Independent Test**: Open the browser developer console, navigate through all major pages and interactions, and confirm no warnings appear.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** a developer opens the browser console and navigates through all pages (Collection, Search, Wishlist, Profile, Admin sections), **Then** no avoidable warnings are logged in the console.
2. **Given** the application is built for production, **When** the build completes, **Then** no compilation warnings are emitted.

---

### User Story 9 — Pagination, Filtering & Sorting on All Data Tables (Priority: P1)

A user navigates to any page that displays a data table (admin users, review items, scan results, scan history, enrichment history, library roots, etc.). Every table provides pagination controls allowing the user to navigate between pages and select how many rows to display. Each column header is sortable — clicking it sorts the table by that column in ascending or descending order. Additionally, each column provides an inline filter (text search for text columns, dropdown for enum/status columns, date range for date columns) allowing the user to narrow down the displayed data without leaving the page.

**Why this priority**: Data tables are the primary interaction model for the admin dashboard. Without proper sorting and filtering, users must scroll through large datasets manually, making the admin experience cumbersome and error-prone with growing data volumes.

**Independent Test**: Navigate to any data table page, verify pagination controls appear, click a column header to sort, enter a filter value, and confirm the table updates correctly.

**Acceptance Scenarios**:

1. **Given** any data table in the application, **When** the table loads, **Then** pagination controls are displayed at the bottom showing current page, total pages, and rows-per-page selector.
2. **Given** any data table with a text column, **When** the user clicks the column header, **Then** the table sorts by that column in ascending order; clicking again reverses to descending order.
3. **Given** any data table with a status/enum column, **When** the user opens the column filter, **Then** a dropdown appears with all possible values for that column, and selecting a value filters the table to show only matching rows.
4. **Given** any data table with a text column, **When** the user types in the column filter input, **Then** the table filters to show only rows where that column contains the entered text (case-insensitive).
5. **Given** a table with active filters, **When** the user clears all filters, **Then** the table returns to showing all data with the current pagination.
6. **Given** a table with multiple active filters and a sort, **When** the user navigates to another page of results, **Then** the filters and sort order are preserved.
7. **Given** a table with server-side lazy loading, **When** the user sorts or filters, **Then** the request is sent to the server with the appropriate sort and filter parameters, and only matching results are returned.

---

### User Story 10 — Scan Results: Stay in Place After Assignment (Priority: P1)

An admin user is browsing the scan results page with many entries, has scrolled down or navigated to a specific page, and assigns a file to a TV show or film. After the assignment completes, the page remains at the exact same scroll position and pagination page instead of jumping back to the top or resetting to page 1. This allows the admin to continue processing results sequentially without losing their place.

**Why this priority**: The scan results page is the primary workflow for processing scanned files. Losing position after each assignment forces repetitive scrolling/navigation, significantly slowing down the admin's workflow when processing large scan batches.

**Independent Test**: Navigate to the scan results page, go to page 3, scroll halfway down, assign a file to a TV show, and verify the page stays on page 3 at the same scroll position.

**Acceptance Scenarios**:

1. **Given** an admin on page 3 of scan results, **When** they assign a file to a TV show, **Then** the page remains on page 3 after the assignment completes.
2. **Given** an admin scrolled to a specific row in the scan results, **When** they assign that file and the assignment completes, **Then** the scroll position is preserved (the surrounding rows remain visible).
3. **Given** an admin with active filters on the scan results page, **When** they assign a file, **Then** the filters remain active and the filtered view is refreshed in place.
4. **Given** an admin assigns the last item on the current page, **When** the item is removed from the current filter set after assignment, **Then** the page adjusts gracefully (staying on the same page if items remain, or moving to the previous page if the current page is now empty).

---

### User Story 11 — Scanner: Real-Time Counter Incrementation (Priority: P2)

An admin user starts a media scan from the scanner page. As the scan progresses, the counters displayed on the page ("total files discovered", "added", "updated", "needs review") increment in real time as files are being processed, rather than staying at 0 until the scan completes. This gives the admin immediate visual feedback about scan progress and confidence that the scan is actively working.

**Why this priority**: Real-time feedback during potentially long-running scans reduces user anxiety and prevents unnecessary scan cancellations. Currently, users see counters stuck at 0 which could appear broken.

**Independent Test**: Start a scan on a library with multiple files. Observe that the counters begin incrementing within a few seconds and continue to update as the scan progresses, rather than jumping from 0 to final values at the end.

**Acceptance Scenarios**:

1. **Given** a scan is in progress, **When** the polling interval elapses and the API returns updated counts, **Then** the "total discovered" counter reflects the current number reported by the API.
2. **Given** a scan is in progress, **When** files are being matched and categorized, **Then** the "added", "updated", and "needs review" counters increment as those categories are populated.
3. **Given** a scan is running on a large library, **When** the user watches the counters, **Then** the counters update smoothly at regular intervals (matching the polling frequency) rather than all at once at the end.
4. **Given** the scan completes, **When** the final status is shown, **Then** the counters display the final accurate totals.

---

### User Story 12 — Review Item: Multi-Select for Batch Assignment (Priority: P2)

An admin user opens the review item page and sees multiple unresolved items that should all be assigned to the same TV show. Instead of resolving them one by one, the admin selects multiple items using checkboxes, then triggers a single batch assignment action. All selected items are assigned to the chosen TV show at once, and the list refreshes to reflect the updated statuses.

**Why this priority**: When a scan produces many unresolved items from the same TV show (e.g., multiple episodes), resolving them one at a time is tedious. Batch assignment dramatically speeds up the review workflow.

**Independent Test**: Navigate to the review page, select 5 unresolved items via checkboxes, click the batch assign action, choose a TV show, and verify all 5 items are assigned at once.

**Acceptance Scenarios**:

1. **Given** the review page with multiple items, **When** the page loads, **Then** each row has a checkbox for selection.
2. **Given** multiple items are selected, **When** the user clicks a "Batch Assign" action button, **Then** a dialog appears allowing the user to search for and select a TV show or film to assign all selected items to.
3. **Given** the user confirms a batch assignment, **When** the assignment completes, **Then** all selected items are updated to reflect the assignment, and the selection is cleared.
4. **Given** multiple items are selected, **When** the user selects a "Select All" checkbox in the header, **Then** all items on the current page are selected.
5. **Given** items are selected and a batch assignment fails for some items, **When** the result is returned, **Then** the user sees a summary indicating which items succeeded and which failed, with error details for failures.
6. **Given** no items are selected, **When** the user views the action toolbar, **Then** the "Batch Assign" button is disabled.

---

### User Story 13 — TMDB Enrichment: Detailed Process View (Priority: P2)

An admin user starts a TMDB enrichment process. While the enrichment is running, the page displays detailed information about each item being enriched: which TV shows or films are being processed, the associated folders/files, the current enrichment step, and the result (success/failure) for each item as it completes. This replaces the current minimal running state that only shows a progress bar and optional current item name.

**Why this priority**: The enrichment process can be long-running and process many items. Detailed visibility into what's happening gives admins confidence the process is correct and helps diagnose issues without waiting for it to finish.

**Independent Test**: Start an enrichment run on a library with multiple media items. Verify that the running panel displays a live list of items being processed, with status updates as each item completes.

**Acceptance Scenarios**:

1. **Given** an enrichment is running, **When** the user views the enrichment page, **Then** a detailed panel shows the list of items currently being processed or queued.
2. **Given** an enrichment is processing a TV show, **When** that item is displayed in the detail panel, **Then** the TV show's title, associated folder path, and enrichment status (pending/in-progress/completed/failed) are shown.
3. **Given** an enrichment item completes successfully, **When** the detail panel updates, **Then** the item shows a "completed" status with summary information (e.g., number of seasons/episodes enriched).
4. **Given** an enrichment item fails, **When** the detail panel updates, **Then** the item shows a "failed" status with a user-friendly error message.
5. **Given** the enrichment is running with many items, **When** the user views the detail panel, **Then** a progress indicator shows how many items have been processed out of the total (e.g., "12 of 45 media items enriched").

---

### User Story 14 — Collection Page: Totals by Type and Completeness (Priority: P2)

A user views their collection page and sees summary statistics broken down by media type: total TV shows and total films are displayed prominently. For TV shows, the collection indicates which ones are incomplete — meaning they are missing seasons or episodes compared to what is available on TMDB. The user can quickly identify gaps in their library without drilling into each show individually.

**Why this priority**: Users need a quick overview of their collection's health. Knowing which TV shows are incomplete helps prioritize what to look for or scan next, directly supporting the core media management workflow.

**Independent Test**: View the collection page with a mix of TV shows and films. Verify that the stats bar shows separate counts for TV shows and films. Verify that incomplete TV shows are visually flagged or listed separately.

**Acceptance Scenarios**:

1. **Given** the collection page loads, **When** the stats bar is displayed, **Then** it shows separate counts for total TV shows and total films in addition to existing overall totals.
2. **Given** a TV show in the collection is missing seasons compared to TMDB data, **When** the user views the collection page, **Then** that TV show is visually indicated as incomplete (e.g., a badge, icon, or label on the media card).
3. **Given** a TV show is incomplete, **When** the user views the incompleteness indicator, **Then** they can see which specific seasons or episodes are missing (e.g., via a tooltip, expandable detail, or the media card itself).
4. **Given** all TV shows in the collection are complete, **When** the user views the collection page, **Then** no incompleteness indicators are shown.
5. **Given** a film in the collection, **When** the user views the collection page, **Then** no completeness indicator is shown (completeness applies only to TV shows).

---

### User Story 15 — File Location Quick Access (Priority: P3)

A user is viewing a media item in their collection (either from the collection page or a detail page) and wants to access the actual file on disk. A button or link is available that reveals the file's location path — for example, copying the full path to the clipboard or displaying it in a tooltip/popover. This allows the user to quickly navigate to the file in their file manager without having to remember or search for the folder structure.

**Why this priority**: Convenience feature that bridges the gap between the web application and the physical file system. Useful for advanced users but not critical to core media management.

**Independent Test**: View a media item that has associated files. Click the file location button and verify the file path is either displayed or copied to clipboard. Confirm it works for both TV shows and films.

**Acceptance Scenarios**:

1. **Given** a media item with at least one associated file, **When** the user views the media detail page, **Then** a file location button or link is visible near the file information.
2. **Given** the user clicks the file location button, **When** the action completes, **Then** the full file path is displayed (e.g., in a tooltip, popover, or inline text) and/or copied to the clipboard.
3. **Given** a media item with multiple associated files, **When** the user accesses file locations, **Then** all file paths are shown (not just the first one).
4. **Given** the user copies a file path to clipboard, **When** the copy action completes, **Then** a confirmation feedback (e.g., toast notification or visual indicator) is shown.
5. **Given** a media item with no associated files, **When** the user views the detail page, **Then** the file location button is hidden or disabled with a message indicating no files are linked.

---

### Edge Cases

- What happens when the API returns an empty list of root folders? The dialog falls back to manual path entry with a clear message.
- What happens when TMDB metadata does not include production status for a TV show? The system displays "Unknown" as the production status.
- What happens when a user uploads a profile picture in an unsupported format? The system rejects the upload with a descriptive error message indicating accepted formats.
- What happens when the user's auth provider account has no profile picture? A generic avatar placeholder is shown.
- What happens when the wishlist data fails to load on the search page? Search results display normally without wishlist indicators, and a non-blocking warning is logged.
- What happens when date format localization is applied to dates that are null or invalid? The system displays a placeholder dash ("—") instead of an incorrectly formatted date.
- What happens when the user applies sort and filter on a table, then the data changes server-side? The next lazy-load request returns the updated data with the same sort/filter parameters applied.
- What happens when the admin assigns the last item on a scan results page? The page adjusts gracefully — staying on the same page if items remain or navigating to the previous page if the current page becomes empty.
- What happens when a batch assignment partially fails? The user sees a summary of successes and failures with specific error details for each failed item.
- What happens when the polling response returns the same counter values as the previous poll? The display remains unchanged — no unnecessary UI flicker or re-render occurs.
- What happens when the enrichment detail API is unavailable during a running enrichment? The page falls back to the current minimal running view (progress bar + current item name) with a non-blocking warning.
- What happens when a media item's file path contains special characters or very long paths? The path is displayed with proper escaping, and long paths are truncated with a tooltip showing the full path.
- What happens when the user clicks "copy path" but clipboard access is denied by the browser? A fallback displays the path in a selectable text field for manual copying, with a friendly message.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display all icon glyphs clearly inside rounded action buttons across every page, in both dark and light mode, with sufficient contrast.
- **FR-002**: System MUST render the dark/light mode toggle icon (sun/moon) visibly in the navigation menu in both themes.
- **FR-003**: System MUST pass the user's active UI language as the `language` parameter when querying TMDB during media scanning.
- **FR-004**: System MUST translate all UI text — including status badges, toast notification categories, button labels, and any hardcoded strings — into the active language (EN or FR).
- **FR-005**: System MUST format dates according to the user's active language: DD/MM/YYYY for French, MM/DD/YYYY for English.
- **FR-006**: System MUST present a dropdown of available root folders (from API application settings) in the "Add Library Root" dialog.
- **FR-007**: System MUST allow the admin to select a root folder and append a sub-path to compose the full library root path.
- **FR-008**: System MUST fall back to manual full-path entry if no root folders are returned by the API.
- **FR-009**: System MUST display a visual indicator on TMDB search result cards for media items already in the user's wishlist.
- **FR-010**: System MUST update the wishlist indicator on a search result card immediately after the user adds that item to the wishlist (no page refresh required).
- **FR-011**: System MUST display the production status ("Still in Production" or "Ended") on TV show detail pages, sourced from TMDB metadata.
- **FR-012**: System MUST identify and visually indicate seasons missing from the user's collection compared to the seasons listed on TMDB for each TV show.
- **FR-013**: System MUST display the user's auth provider profile picture as the default on the profile page.
- **FR-014**: System MUST allow users to upload a custom profile picture that replaces the auth provider default.
- **FR-015**: System MUST allow users to remove their custom profile picture and revert to the auth provider default.
- **FR-016**: System MUST validate uploaded profile pictures for file type (common image formats) and file size before accepting the upload.
- **FR-017**: System MUST display the user's first name, last name, and profile picture next to the logout button in the navigation menu.
- **FR-018**: System MUST resolve all avoidable frontend console warnings during normal application use.
- **FR-019**: System MUST produce zero compilation warnings during production builds.
- **FR-020**: System MUST provide sortable column headers on all data tables, allowing ascending and descending sort on each column.
- **FR-021**: System MUST provide inline column filtering on all data tables — text search for text columns, dropdown selection for enum/status columns.
- **FR-022**: System MUST preserve active sort order, filters, and pagination state when the user navigates between pages of results.
- **FR-023**: System MUST send sort and filter parameters to the server on lazy-loaded tables so that results are sorted and filtered server-side.
- **FR-024**: System MUST preserve the current pagination page and scroll position on the scan results page after a file is assigned to a TV show or film.
- **FR-025**: System MUST refresh the assigned row's data in place after assignment without resetting the table to page 1.
- **FR-026**: System MUST display real-time counter updates on the scanner page during an active scan, reflecting the latest values returned by the polling API.
- **FR-027**: System MUST update the "total discovered", "added", "updated", and "needs review" counters at each polling interval rather than only at scan completion.
- **FR-028**: System MUST provide checkboxes on the review item page for selecting multiple items simultaneously.
- **FR-029**: System MUST provide a "Select All" checkbox in the review table header that selects all items on the current page.
- **FR-030**: System MUST provide a "Batch Assign" action that allows assigning all selected review items to a single TV show or film.
- **FR-031**: System MUST display individual success/failure results for each item in a batch assignment.
- **FR-032**: System MUST display detailed per-item information during a running TMDB enrichment process, including the media title, folder path, and enrichment status.
- **FR-033**: System MUST show a progress indicator during enrichment displaying how many items have been processed out of the total.
- **FR-034**: System MUST display separate totals for TV shows and films on the collection page stats bar.
- **FR-035**: System MUST visually indicate on the collection page which TV shows are incomplete (missing seasons or episodes compared to TMDB data).
- **FR-036**: System MUST allow users to see which specific seasons or episodes are missing for an incomplete TV show.
- **FR-037**: System MUST provide a file location button on the media detail page that reveals or copies the file path of associated files.
- **FR-038**: System MUST display all file paths when a media item has multiple associated files.

### Key Entities _(include if feature involves data)_

- **Root Folder Configuration**: Represents an available root folder path sourced from the API's application settings. Attributes: display name, absolute path. Used in the library root creation workflow.
- **User Profile Picture**: Represents a user's profile image. Can be a custom uploaded image or a default sourced from the auth provider. Attributes: image URL/data, source type (auth provider vs. custom upload), user association.
- **TV Show Production Status**: Metadata from TMDB indicating whether a TV show is still in production or has ended. Attributes: production status flag, total season count (TMDB), owned season numbers (user collection).
- **Wishlist State (Search Context)**: Cross-reference between the user's wishlist items and TMDB search results, enabling the UI to flag items already wishlisted. Attributes: TMDB ID, wishlist membership flag.
- **Collection Completeness**: Derived data comparing the user's owned seasons/episodes against TMDB metadata for each TV show. Attributes: total expected seasons, owned seasons, missing season numbers, completeness flag.
- **Enrichment Process Detail**: Per-item information during a running enrichment, including the media title, folder path, processing status, and result summary. Attributes: media ID, title, folder path, enrichment status (pending/in-progress/completed/failed), error message (if failed).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of icon-bearing UI elements display a visible glyph in both dark and light mode across all pages.
- **SC-002**: 100% of user-facing text strings are translated when either EN or FR is selected — zero untranslated strings detected in a full-app walkthrough.
- **SC-003**: Media scan results match expected TMDB entries when the scan language matches the user's selected UI language, verified on a sample of 10 media items per language.
- **SC-004**: Dates across the app display in the correct locale-specific format (DD/MM/YYYY for FR, MM/DD/YYYY for EN) on 100% of date-displaying components.
- **SC-005**: Admins can compose and save a library root path using the root folder dropdown in under 30 seconds.
- **SC-006**: Wishlist indicator appears on 100% of TMDB search result cards for media already in the user's wishlist, within 1 second of results loading.
- **SC-007**: TV show production status and missing seasons are displayed correctly for 100% of TV shows that have TMDB metadata available.
- **SC-008**: Users can upload a profile picture and see it displayed within 3 seconds of upload completion.
- **SC-009**: The user's name and profile picture are visible in the navigation menu on every page.
- **SC-010**: Zero avoidable console warnings during a full application walkthrough across all features.
- **SC-011**: Zero compilation warnings during production builds.
- **SC-012**: 100% of data tables in the application support sorting by clicking column headers, with ascending/descending toggle.
- **SC-013**: 100% of data tables in the application provide inline column filters appropriate to the column data type.
- **SC-014**: After assigning a file on the scan results page, the page retains its current pagination page and scroll position — zero page resets observed during a 10-assignment test session.
- **SC-015**: Scanner page counters begin updating within the first two polling cycles (within 8 seconds) after a scan starts, rather than remaining at 0 until completion.
- **SC-016**: An admin can select 10 review items and batch-assign them to a TV show in under 30 seconds, compared to the current manual one-by-one workflow.
- **SC-017**: During an enrichment run, the detail panel displays the title and status of at least every item being processed, with updates visible at each polling cycle.
- **SC-018**: Collection page stats bar displays separate TV show and film counts that sum to the total media count.
- **SC-019**: 100% of incomplete TV shows (where owned seasons < TMDB total seasons) are flagged on the collection page.
- **SC-020**: Users can access or copy the file path for any media item with linked files within 2 clicks from the media detail page.

## Assumptions

- `GET /api/v1/files/locations` already exists and returns `string[]` (sourced from `Nas.BasePaths` config); no new endpoint is required for root folder listing.
- `StartScanRequest` and `StartScanCommand` will be extended to add `language?: string`; the frontend passes the active UI locale (e.g. `"fr"`, `"en"`) when triggering a scan from the admin panel.
- A new API endpoint (`POST /api/v1/users/profile-picture`) will be created with server-side file storage for custom profile pictures. The frontend handles upload UX and displays the stored URL.
- `MediaDto` will be extended to expose `status` (string, e.g. `"Returning Series"` / `"Ended"`) and `numberOfSeasons` (int) sourced from existing `Media` entity fields already stored in the database.
- The Auth0/Okta integration exposes the user's auth provider profile picture URL via the ID token or user profile endpoint; no additional auth changes are required.
- TV show production status and total season count are already persisted in the database from the TMDB enrichment pipeline — the `Media.Status` and `Media.NumberOfSeasons` fields.
- The frontend warnings are known suspects: deprecated lifecycle hooks, missing `NgOptimizedImage` width/height attributes, and `ExpressionChangedAfterItHasBeenChecked` errors. No prior audit phase is required.
- File size limit for profile picture uploads defaults to 2 MB; accepted formats are JPEG, PNG, and WebP.
- The existing sidebar/nav component already has the logout button; user info (name + picture) will be added adjacent to it.
- The app already uses PrimeNG icons or PrimeIcons; the icon visibility issue is a CSS/theming problem rather than missing icon font files.
- All data tables already use PrimeNG `p-table` with lazy loading; adding sortable columns and column filters requires extending existing `onLazyLoad` handlers to pass `sortField`, `sortOrder`, and filter parameters to the backend API.
- The backend API endpoints for paginated lists (users, review items, scan decisions, scan history, enrichment history, library roots) will be extended to accept optional `sortField`, `sortOrder`, and column-specific filter query parameters.
- The scan active endpoint (`GET /api/v1/admin/scan/active`) already returns counter values in the `ScanRunDetail.counts` object; the issue is that the backend does not update these counters until the scan completes. The backend will be updated to report incremental counts during scanning.
- The existing 4-second polling interval for the active scan is sufficient for real-time counter updates.
- The review item resolution currently works one item at a time via the `ReviewResolveDialogComponent`; a new batch resolution endpoint or repeated calls to the existing endpoint will be needed for multi-select assignment.
- The enrichment detail API (`GET /api/v1/admin/enrichment/{runId}/details`) already exists and returns per-media enrichment details; the enhancement is to poll this endpoint during a running enrichment to display live results rather than only showing details in the history expansion.
- Media items in the collection already have associated `MediaFile` entities with `filePath` attributes; no new data model changes are needed for file location quick access.
- Clipboard API (`navigator.clipboard.writeText()`) is available in modern browsers; a fallback will be provided for browsers that deny clipboard access.
- Collection completeness relies on the same `Media.NumberOfSeasons` and per-show season data already used in User Story 5 (TV show production status & missing seasons). No new TMDB calls are required.
