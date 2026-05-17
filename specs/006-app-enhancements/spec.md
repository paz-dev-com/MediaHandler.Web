# Feature Specification: Application Enhancements

**Feature Branch**: `feature/006-app-enhancements`  
**Created**: 2025-07-24  
**Status**: Clarified  
**Input**: User description: "Admin root folder selection, i18n completeness audit, TV show production status & missing seasons, wishlist indicator on search, icon visibility fixes, enhanced profile with picture upload, user info in nav menu, fix frontend warnings"

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

### Edge Cases

- What happens when the API returns an empty list of root folders? The dialog falls back to manual path entry with a clear message.
- What happens when TMDB metadata does not include production status for a TV show? The system displays "Unknown" as the production status.
- What happens when a user uploads a profile picture in an unsupported format? The system rejects the upload with a descriptive error message indicating accepted formats.
- What happens when the user's auth provider account has no profile picture? A generic avatar placeholder is shown.
- What happens when the wishlist data fails to load on the search page? Search results display normally without wishlist indicators, and a non-blocking warning is logged.
- What happens when date format localization is applied to dates that are null or invalid? The system displays a placeholder dash ("—") instead of an incorrectly formatted date.

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

### Key Entities _(include if feature involves data)_

- **Root Folder Configuration**: Represents an available root folder path sourced from the API's application settings. Attributes: display name, absolute path. Used in the library root creation workflow.
- **User Profile Picture**: Represents a user's profile image. Can be a custom uploaded image or a default sourced from the auth provider. Attributes: image URL/data, source type (auth provider vs. custom upload), user association.
- **TV Show Production Status**: Metadata from TMDB indicating whether a TV show is still in production or has ended. Attributes: production status flag, total season count (TMDB), owned season numbers (user collection).
- **Wishlist State (Search Context)**: Cross-reference between the user's wishlist items and TMDB search results, enabling the UI to flag items already wishlisted. Attributes: TMDB ID, wishlist membership flag.

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
