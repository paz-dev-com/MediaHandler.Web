# Research: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24 (updated 2025-07-25 — added R-009 to R-015 for US-9 to US-15)

## R-001: Scan Language Pass-Through (FR-003)

**Decision**: Add `language?: string` to `StartScanRequest` and `StartScanCommand`. The frontend passes `TranslocoService.getActiveLang()` when triggering a scan.

**Rationale**: The legacy `POST /api/v1/files/scan-and-import?language=` endpoint already supports language via query param. The new admin scan pipeline (`POST /api/v1/admin/scan`) uses a request body with `StartScanRequest(LibraryRootIds, Mode)`. Adding an optional `language` field is the minimal API change. The `ScanStartParameters` passed to the coordinator also needs the new field so the TMDB matcher can use it.

**Alternatives Considered**:

- Auto-detect from user's `PreferredLanguage` in the database → rejected because scan is admin-only and the admin may want to scan in a different language than their preference.
- Use `Accept-Language` header → rejected because it's implicit and harder to test/document.

## R-002: Profile Picture Storage (FR-013–FR-016)

**Decision**: Create `POST /api/v1/users/profile-picture` endpoint on the API with server-side file storage. Add `ProfilePicturePath` to `User` entity and `ProfilePicturePath` to `UserDto`.

**Rationale**: The `User` entity has no picture field today. Auth0 provides a `picture` URL from the ID token (Google profile photo, Gravatar, etc.) — this is used as the default. Custom uploads need server-side storage so the URL persists across sessions and devices. The frontend already has the auth0 user$ observable with `picture` property.

**Alternatives Considered**:

- Store in Auth0 user metadata → rejected because it couples storage to the identity provider and Auth0 Management API has rate limits.
- Store as base64 in the database → rejected because it bloats the database and is inefficient for image serving.

**Implementation Notes**:

- API: `POST /api/v1/users/profile-picture` accepts `multipart/form-data`, validates file type (JPEG, PNG, WebP) and size (≤ 2MB), stores to disk, returns the URL.
- API: `DELETE /api/v1/users/profile-picture` removes the custom picture, reverting to auth provider default.
- Frontend: `ProfileService` gets new methods `uploadProfilePicture(file: File)` and `removeProfilePicture()`.
- The frontend resolves which picture to show: custom `profilePicturePath` > auth0 `picture` > generic avatar.

## R-003: MediaDto Extension for TV Show Fields (FR-011–FR-012)

**Decision**: Extend `MediaDto` to include `Status` (string) and `NumberOfSeasons` (int) fields. These already exist on the `Media` entity.

**Rationale**: The `Media` entity has `Status` (e.g., "Returning Series", "Ended") and `NumberOfSeasons` populated during TMDB enrichment. `MediaDto` today omits these fields. Adding them to the DTO is a simple mapping change — no database migration required.

**Alternatives Considered**:

- Fetch from TMDB on the frontend → rejected because the data is already in the database and an extra API call per detail page is wasteful.
- Create a separate endpoint for TV-specific metadata → rejected because it adds unnecessary complexity.

**Implementation Notes**:

- The frontend `Media` interface adds `status: string | null` and `numberOfSeasons: number | null`.
- The `season-list` component computes missing seasons by comparing `numberOfSeasons` with the count of owned seasons fetched from `GET /media/{id}/seasons`.

## R-004: Root Folder Dropdown (FR-006–FR-008)

**Decision**: Use the existing `GET /api/v1/files/locations` endpoint (returns `string[]` from `Nas.BasePaths` config) to populate a dropdown in the "Add Library Root" dialog.

**Rationale**: The endpoint already exists and returns the server-configured base paths. No API changes needed. The dialog currently has a free-text `path` input — it will be split into a dropdown (root folder) + text input (sub-path), with a composed path preview.

**Alternatives Considered**:

- Browse filesystem via API → rejected (security risk, complexity).
- Hardcode paths in frontend config → rejected (not portable, requires redeployment).

**Implementation Notes**:

- `AdminLibraryRootService` (or add a new `AdminFilesService`) calls `GET files/locations` to fetch base paths.
- The dialog shows a `<p-select>` for root selection and a text input for sub-path.
- When no locations are returned, show fallback message and enable full manual path entry (existing behavior).

## R-005: Wishlist Indicator on TMDB Search (FR-009–FR-010)

**Decision**: Pre-load the user's wishlist items on the search page and cross-reference by `tmdbId` to show a badge on matching result cards.

**Rationale**: The `WishlistService` already maintains `items()` signal with `WishlistItem[]`, each having a `tmdbId`. Loading the wishlist on search page init (or using the already-loaded signal if it's a root-provided service) enables O(1) lookup per search result.

**Alternatives Considered**:

- API returns wishlist status in search results → rejected because the TMDB search endpoint proxies to TMDB and shouldn't couple with user-specific data.
- Check wishlist per-card on render → rejected because it would fire N API calls.

**Implementation Notes**:

- On `TmdbSearchPageComponent` init, ensure wishlist is loaded (`wishlistService.loadItems()`).
- Create a computed signal `wishlistTmdbIds` as a `Set<number>` from `wishlistService.items()`.
- Pass `isInWishlist` flag to `TmdbResultCardComponent`.
- After `onWishlist()` completes, the card immediately shows the indicator (reactive via the signal update in `wishlistService.addItem()`).

## R-006: Icon Visibility Fix (FR-001–FR-002)

**Decision**: Debug and fix CSS/theming issue causing icon glyphs to not render inside rounded action buttons and the theme toggle icon.

**Rationale**: The spec assumes this is a CSS/theming problem (PrimeIcons are loaded, but glyphs aren't visible). Likely causes: `color: transparent` or matching foreground/background color in the dark theme tokens; or `overflow: hidden` clipping with border-radius; or missing `font-family` inheritance.

**Alternatives Considered**: None — this is a bug fix, not a design decision.

**Implementation Notes**:

- Audit all `.rounded-icon-btn` / action button styles for color and overflow issues.
- Verify PrimeIcons `font-family` is inherited correctly in themed contexts.
- Check the `ThemeToggleComponent` icon rendering specifically.

## R-007: i18n Completeness & Date Formatting (FR-004–FR-005)

**Decision**: Conduct a full audit of `en.json` / `fr.json`, add missing keys for all hardcoded strings, status badges, toast categories. Implement locale-aware date formatting via Angular pipes.

**Rationale**: Transloco is already in place. The date format difference (DD/MM/YYYY for FR, MM/DD/YYYY for EN) can be handled by Angular's `DatePipe` with locale parameter or a custom pipe wrapping `Intl.DateTimeFormat()`.

**Alternatives Considered**:

- Use a third-party date library (date-fns, luxon) → rejected due to bundle budget concerns and Angular's built-in capabilities.

**Implementation Notes**:

- Create a `LocaleDatePipe` that formats dates based on `TranslocoService.getActiveLang()`.
- Register Angular locales (`fr`) in `app.config.ts` with `registerLocaleData()`.
- Audit every component for hardcoded strings and date displays.

## R-008: Frontend Warning Fixes (FR-018–FR-019)

**Decision**: Directly fix known warning sources without a separate audit phase.

**Rationale**: The spec identifies the suspects: deprecated lifecycle hooks, `NgOptimizedImage` missing dimensions, `ExpressionChangedAfterItHasBeenChecked`.

**Implementation Notes**:

- Replace `OnInit`/`OnDestroy` lifecycle hooks with modern alternatives where deprecated (though these aren't actually deprecated in Angular 21 — the warning may be about deprecated _APIs_ used inside them).
- Ensure all `<img ngSrc>` tags have `width` and `height` attributes (or `fill` attribute for responsive images).
- Fix `ExpressionChangedAfterItHasBeenChecked` by ensuring signal reads are consistent within change detection cycles (e.g., avoid updating signals in `ngAfterViewInit`).

## R-009: Table Sorting, Filtering & Pagination (FR-020–FR-023)

**Decision**: Extend the existing `LazyLoadEvent` handling in every PrimeNG `p-table` component to pass `sortField`, `sortOrder`, and per-column filter values as query parameters to the backend. The backend paginated-list endpoints are extended to accept these parameters and apply them server-side.

**Rationale**: All admin data tables already use PrimeNG `p-table` with `[lazy]="true"` and `onLazyLoad` handlers. PrimeNG's `LazyLoadEvent` already carries `sortField`, `sortOrder`, `filters`, `first`, and `rows` — the infrastructure is in place. Extending the `onLazyLoad` handler to serialise filter and sort params into the HTTP query string is the minimal change. Server-side processing (not client-side) is required because tables can hold thousands of rows.

**Alternatives Considered**:

- Client-side sort/filter: rejected because full data sets must be loaded up front, which breaks pagination and is slow for large tables.
- GraphQL / OData: rejected due to complexity; simple query-param conventions suffice for this data volume.
- A generic `TableFilterService` that wraps every table: considered but rejected in favour of a lightweight `TableStateService` interface (plain object + signal) to avoid over-engineering at this scale.

**Implementation Notes**:

- Define a shared `TableQueryParams` interface: `{ page, pageSize, sortField?, sortOrder?, filters: Record<string, string> }`.
- Each admin list endpoint gains optional query params: `?page=1&pageSize=20&sortField=name&sortOrder=asc&status=Pending` etc.
- Backend response wraps results in a `PagedResult<T>` with `{ items, totalCount, page, pageSize }`.
- Frontend: store `TableQueryParams` as a `signal<TableQueryParams>` on each page component; pass it to the service call in `onLazyLoad`.
- Text filters: sent as `contains`-style substring match. Enum/status filters: sent as exact-match. Date filters: not required for this release.
- Affected endpoints: admin users, review items, scan decisions (scan results), scan history, enrichment history, library roots.

---

## R-010: Scan Results Position Retention After Assignment (FR-024–FR-025)

**Decision**: After a file is assigned, perform an in-place row refresh by updating only the assigned item in the local data signal rather than re-fetching the entire page (which would reset scroll position). Scroll position is preserved because the DOM structure does not change.

**Rationale**: PrimeNG `p-table` re-renders only when the input `value` signal's identity changes. If only one element in the array is replaced (via `signal.update()`), Angular's `OnPush` strategy re-renders only the changed row. Pagination state (current `first`/`rows`) is held in the component's `tableState` signal, which is not reset on assignment.

**Alternatives Considered**:

- Full table reload after assignment: simplest to implement but loses page/scroll position — rejected per spec requirement.
- `scrollIntoView()` after reload: requires storing the row's DOM reference, brittle — rejected.
- Virtual scrolling: excessive for this use case — rejected.

**Implementation Notes**:

- In `ScanResultsPageComponent`, after `assignFile()` resolves successfully, call `signal.update(items => items.map(i => i.id === assignedId ? updatedItem : i))`.
- If the assigned item is removed from the current filter set (e.g., only showing "Unassigned"), decrement `totalCount` and, if current page is now empty (`first >= totalCount`), navigate to `first - pageSize`.
- Scroll position is naturally retained because the DOM height does not change during in-place update.

---

## R-011: Real-Time Scanner Counter Incrementation (FR-026–FR-027)

**Decision**: Fix the backend `ScanCoordinator` to persist incremental counter values to `ScanRun.Counts` during scanning (not just at completion). The frontend already polls `GET /api/v1/admin/scan/active` every 4 seconds; no frontend polling frequency change is needed.

**Rationale**: Per the spec's assumption, `GET /api/v1/admin/scan/active` already returns `ScanRunDetail.counts`. The problem is server-side: counts are only written to the database (or in-memory cache read by the endpoint) at scan completion. The fix is to update the in-memory `ScanRun` object's counts after each file is processed, so the next poll returns the incremented values.

**Alternatives Considered**:

- SignalR push for real-time counter events: highest fidelity but introduces WebSocket infrastructure — rejected as over-engineering for a counter that needs ~4s granularity.
- Reduce poll interval to 1s: increases API load without meaningfully improving UX — rejected.
- Store counts in Redis: no Redis in the current stack — rejected.

**Implementation Notes**:

- Backend: Update `ScanCoordinator.ProcessFileAsync()` to call `scanRun.IncrementCount(category)` after each file outcome, where `scanRun` is held in a singleton/scoped `IScanRunStore`. The `GET /api/v1/admin/scan/active` endpoint reads from the same store.
- Frontend: The `ScannerPageComponent` already has a polling effect. Ensure the `counts` signal is updated from each poll response — verify the mapping from `ScanRunDetail.counts` to the four displayed counters (`totalDiscovered`, `added`, `updated`, `needsReview`).

---

## R-012: Review Item Multi-Select Batch Assignment (FR-028–FR-031)

**Decision**: Add a `POST /api/v1/admin/review-items/batch-assign` endpoint that accepts an array of review-item IDs and a target media ID, then dispatches `BatchAssignReviewItemsCommand`. The frontend shows checkboxes on the review table and a `BatchAssignDialogComponent` for media search.

**Rationale**: The existing `ReviewResolveDialogComponent` resolves one item at a time. Repeating single-assign calls from the frontend N times would work but creates N sequential round-trips and gives no consolidated error summary. A single batch endpoint is cleaner and allows the backend to process items in a transaction, returning per-item results.

**Alternatives Considered**:

- Parallel `Promise.all()` of existing single-assign calls: simpler but no atomic error summary, and fires N HTTP requests — rejected.
- Queue-based processing (fire-and-forget): complicates result reporting — rejected for this scale.

**Implementation Notes**:

- `POST /api/v1/admin/review-items/batch-assign` body: `{ reviewItemIds: string[], targetMediaId: string }`.
- Response: `{ succeeded: true, data: { results: [{ reviewItemId, success, errorMessage? }] } }`.
- Backend processes each item independently (not in a single transaction) so partial failures are possible; each result is reported.
- Frontend: `ReviewItemsPageComponent` gains a `selectedIds` signal (`Set<string>`), a header "Select All" checkbox, and a toolbar with "Batch Assign" button (disabled when `selectedIds.size === 0`).
- `BatchAssignDialogComponent` reuses the existing media-search input pattern from `ReviewResolveDialogComponent`.
- After batch assign, update each resolved row in place (same pattern as R-010) and clear `selectedIds`.

---

## R-013: TMDB Enrichment Detailed Process View (FR-032–FR-033)

**Decision**: Poll the existing `GET /api/v1/admin/enrichment/{runId}/details` endpoint during a running enrichment (not only in history expansion) and display the results in a new `EnrichmentDetailPanelComponent`.

**Rationale**: Per the spec's assumption, the endpoint already exists and returns per-media enrichment details. The enhancement is purely frontend: wire the same endpoint into the running enrichment view. Polling at the same 4-second interval used elsewhere is sufficient.

**Alternatives Considered**:

- New streaming/SSE endpoint for enrichment progress: higher fidelity but adds backend complexity — rejected; polling at 4s is adequate.
- Embed detail in the existing `GET /api/v1/admin/enrichment/active` response: would bloat the active-status payload — rejected.

**Implementation Notes**:

- `EnrichmentPageComponent` polls `GET /api/v1/admin/enrichment/{runId}/details` every 4 seconds while `enrichmentStatus === 'Running'`.
- `EnrichmentDetailPanelComponent` receives `items: EnrichmentItemDetail[]` and `processedCount`/`totalCount` as `input()` signals.
- Detail panel renders a scrollable list with title, folder path, and status chip per item.
- If the detail endpoint returns 404 or errors, the panel shows the fallback minimal view (progress bar + current item name) with a non-blocking warning message.

---

## R-014: Collection Page Totals by Type & Completeness (FR-034–FR-036)

**Decision**: Extend `GET /api/v1/media` (collection list) to include `tvShowCount` and `filmCount` in the response metadata. Completeness flag is derived on the frontend by comparing `media.numberOfSeasons` (already in `MediaDto` post R-003) with the count of owned seasons per TV show.

**Rationale**: The stats bar already shows a total count. Adding `tvShowCount` and `filmCount` to the paginated response metadata (or a separate lightweight `GET /api/v1/media/stats` endpoint) avoids a full second query. Completeness does not require a new API field — `numberOfSeasons` (R-003) and the existing seasons list per show are sufficient.

**Alternatives Considered**:

- Client-side count by filtering `media.type`: requires loading all items — rejected (server-side is more efficient).
- Separate `GET /api/v1/media/stats` endpoint: cleaner semantically; chosen as the preferred approach to avoid coupling stats to the paginated list response shape.
- New `isComplete` field on `MediaDto`: considered, but derivable client-side from `numberOfSeasons` vs owned seasons — rejected to avoid redundant data.

**Implementation Notes**:

- New endpoint: `GET /api/v1/media/stats` → returns `{ totalCount, tvShowCount, filmCount, incompletetvShowCount }`.
- Frontend: `CollectionPageComponent` calls this on init and exposes stats as signals to the stats bar.
- Completeness badge: displayed on TV show cards where `media.numberOfSeasons` is non-null and `media.ownedSeasonCount < media.numberOfSeasons`. `ownedSeasonCount` is already available per card from the existing media list.
- Tooltip/expandable detail shows missing season numbers: computed as `Array.from({length: numberOfSeasons}, (_, i) => i + 1).filter(n => !ownedSeasonNumbers.includes(n))`.

---

## R-015: File Location Quick Access (FR-037–FR-038)

**Decision**: Display file paths in a popover/tooltip on the media detail page using an `ngx-clipboard` or native `navigator.clipboard.writeText()` copy action. No new API endpoint needed — file paths are already present in the existing media detail response via `MediaFile.filePath`.

**Rationale**: Per the spec's assumption, `MediaFile` entities with `filePath` are already returned in the media detail response. The feature is purely UI: add a "File Location" button that opens a popover listing all file paths with a copy-to-clipboard action per path.

**Alternatives Considered**:

- `ngx-clipboard` package: convenience wrapper but adds a bundle dependency — rejected; native `navigator.clipboard.writeText()` is supported in all target browsers and a `<textarea>` fallback is straightforward for denied clipboard access.
- Deep-link to file manager (OS file URI): not universally supported in web browsers — rejected.

**Implementation Notes**:

- New `FileLocationComponent` (standalone): accepts `filePaths: string[]` input, renders a PrimeNG `p-overlay-panel` with the path list.
- Each path has a copy icon button; `navigator.clipboard.writeText(path)` is called on click.
- On clipboard permission denial, the path is shown in a `<textarea readonly>` for manual selection.
- Feedback: a `ToastService.success('admin.fileLocation.copied')` notification on successful copy.
- If `filePaths` is empty or null, the trigger button is hidden (`*ngIf="filePaths?.length"`).
- Long paths are displayed with `overflow-wrap: break-word` and a full-path tooltip via `pTooltip`.
