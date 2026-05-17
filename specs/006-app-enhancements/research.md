# Research: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24

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
