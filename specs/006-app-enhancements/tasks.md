# Tasks: Application Enhancements

**Input**: Design documents from `specs/006-app-enhancements/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api-contracts.md ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.
**Tests**: No test tasks generated — not explicitly requested in the feature specification.
**Backend repo**: `../MediaHandler.API/` (companion solution at `/home/tpfeifer/Repos/MediaHandler/MediaHandler.API/`)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no blocking dependencies)
- **[US#]**: User story label (US1–US8 map to spec.md priority order)
- Paths starting with `src/` are relative to the Angular workspace root (`MediaHandler.Web/`)
- Paths starting with `../MediaHandler.API/` refer to the companion .NET backend

---

## Phase 1: Setup

**Purpose**: Confirm the working environment and ensure both frontend and backend projects are accessible and buildable before any story work begins.

- [x] T001 Confirm feature branch `feature/006-app-enhancements` is checked out, run `npm install` from workspace root `/home/tpfeifer/Repos/MediaHandler/MediaHandler.Web/` and `dotnet restore` from `/home/tpfeifer/Repos/MediaHandler/MediaHandler.API/` to verify clean builds in both projects with zero errors

---

## Phase 2: Foundational — Backend API Changes

**Purpose**: Backend changes that MUST be shipped before P1 scan-language (US2), P2 TV-show status (US5), and P3 profile picture (US6/US7) frontends can be fully tested against the live API.
**⚠️ CRITICAL**: US2 (scan language), US5 (TV status), US6 (profile picture), and US7 (nav user info) all have a hard dependency on one or more tasks in this phase.

- [x] T002 Extend `StartScanRequest` record in `../MediaHandler.API/` `ScanRequests.cs` to add `string? Language = null`; extend `StartScanCommand` in `StartScanCommand.cs` to add `string? Language = null`; update `AdminScanController.StartScan()` to pass `request.Language` through to the command, and propagate it through `ScanStartParameters` so the TMDB matcher receives it — verify with `dotnet build` and a local scan run
- [x] T003 [P] Extend `MediaDto` in `../MediaHandler.API/` `MediaDto.cs` to add `string? Status` and `int? NumberOfSeasons`; update the AutoMapper mapping profile (or manual mapping) to map from the existing `Media.Status` and `Media.NumberOfSeasons` entity fields — verify that `GET /api/v1/media/{id}` returns both fields for a TV show in the response
- [x] T004 [P] Add `string? ProfilePicturePath` to the `User` entity in `../MediaHandler.API/` `User.cs`; create and apply a new EF Core database migration (e.g. `AddProfilePicturePathToUser`) — verify migration runs cleanly against the local SQLite/PostgreSQL database without data loss
- [x] T005 Extend `UserDto` in `../MediaHandler.API/` `UserDto.cs` to add `string? ProfilePicturePath`; update the `UserDto` mapping profile so `GET /api/v1/auth/me` and `POST /api/v1/auth/sync` responses include `profilePicturePath` — depends on T004; verify both endpoints return the new field (null for existing users)
- [x] T006 Implement `POST /api/v1/users/profile-picture` endpoint in `../MediaHandler.API/` (new `UserProfileController.cs` or extend existing `AuthController.cs`): accept `multipart/form-data` with a `file` field, validate content type (JPEG/PNG/WebP) and size (≤ 2 MB), store to a configurable uploads path on disk with a unique filename, update `User.ProfilePicturePath`, return the full `UserDto` (200 OK); return `400 Bad Request` for invalid type/size; return `401` if unauthenticated — depends on T005
- [x] T007 Implement `DELETE /api/v1/users/profile-picture` endpoint in `../MediaHandler.API/` (same controller as T006): delete the stored file from disk, set `User.ProfilePicturePath = null`, return updated `UserDto` (200 OK); return `404 Not Found` if no custom picture exists; return `401` if unauthenticated — depends on T006
- [x] T008 [P] Configure static file serving in `../MediaHandler.API/` `Program.cs` so the uploads directory (e.g. `wwwroot/uploads/profile-pictures/`) is served under the `/uploads/` path using `app.UseStaticFiles()`; ensure the directory is created at startup if missing — depends on T006; verify profile picture URL is accessible in the browser after upload

**Checkpoint**: Backend API is complete — all frontend user story work can proceed. US2 can send scan language, US5 can read TV status fields, US6/US7 can upload/display profile pictures.

---

## Phase 3: User Story 1 — Icon Visibility Fixes (Priority: P1) 🎯 MVP

**Goal**: All icon glyphs inside rounded action buttons and the dark/light mode toggle are clearly visible in both dark and light themes across every page.

**Independent Test**: Navigate through every page (Collection, Search, Wishlist, Profile, Admin, Nav menu) with DevTools open — in both dark and light mode. Confirm every icon inside a rounded button renders its glyph with sufficient contrast. Confirm the sun/moon toggle in the navigation sidebar is clearly visible in both themes.

- [x] T009 [US1] Audit icon visibility failures: open the running app at `http://localhost:4200`, switch between dark and light mode, and inspect all rounded icon buttons across Collection, Search, Wishlist, Profile, and Admin pages using DevTools — document the failing CSS selectors, computed `color`, `background`, and `font-family` values for PrimeIcons glyphs inside `.rounded-icon-btn` or equivalent classes; identify whether the issue is `color: transparent`, color-on-color, `overflow: hidden` clipping, or missing `font-family` inheritance
- [x] T010 [US1] Fix root-cause icon color/visibility in `src/app/shared/styles/_variables.scss` (and/or the PrimeNG theme override SCSS file) so that PrimeIcons glyphs inside rounded action buttons inherit the correct foreground CSS custom property in both `[data-theme="dark"]` and `[data-theme="light"]` contexts — depends on T009 audit findings
- [x] T011 [P] [US1] Fix icon glyph visibility for collection page action buttons in `src/app/features/collection/media-card.component.scss` — ensure `.rounded-icon-btn` or equivalent selector applies the corrected foreground color and that `overflow: hidden` does not clip the glyph; confirm at all standard breakpoints
- [x] T012 [P] [US1] Fix dark/light mode toggle (sun/moon) icon visibility in `src/app/core/layout/sidebar.component.scss` — locate the `ThemeToggleComponent` host styles and ensure the icon color resolves correctly in both themes using the same CSS custom property approach from T010
- [x] T013 [P] [US1] Audit and fix `overflow: hidden` / border-radius clipping on all rounded icon button containers site-wide — check every file in `src/app/features/` and `src/app/core/` that defines rounded button styles; adjust `line-height`, `display`, `width`/`height` sizing so glyphs are not clipped; file list: `media-card.component.scss`, `sidebar.component.scss`, any additional component SCSS flagged in T009
- [x] T014 [US1] Final icon visibility pass: run the app, navigate every page and sub-page, toggle between dark and light mode for each page, and confirm 100% of icon glyphs are visible — check mobile viewport (≤ 768 px) bottom nav bar icons specifically; fix any remaining issues found

**Checkpoint**: User Story 1 is complete — all icons are visible in both themes on all pages.

---

## Phase 4: User Story 2 — Translation Completeness & Language-Aware Scanning (Priority: P1)

**Goal**: Zero untranslated strings in EN or FR mode; dates formatted locale-correctly (DD/MM/YYYY for FR, MM/DD/YYYY for EN); media scans pass the active UI language to the TMDB backend query.

**Independent Test**: (a) Switch app to French, navigate every page, confirm zero English text remains. (b) Trigger a media scan while in French mode and verify the outgoing POST body to `POST /api/v1/admin/scan` contains `"language":"fr"`. (c) View any date field in both locales and confirm format matches.

> **Backend Dependency**: T020–T021 (scan language) require T002 to be deployed/running for full end-to-end testing. The frontend change can be coded independently.

- [x] T015 [US2] Register Angular FR locale data in `src/app/app.config.ts`: import `localeFr` from `@angular/common/locales/fr` and call `registerLocaleData(localeFr, 'fr')` in the `appConfig` providers — verify no console errors on FR locale load
- [x] T016 [P] [US2] Create `src/app/shared/pipes/locale-date.pipe.ts` as a standalone `LocaleDatePipe` (`transform(value: Date | string | null, format?: string): string`) that reads `TranslocoService.getActiveLang()` and formats using `Intl.DateTimeFormat` with the correct locale (`'fr-FR'` → `dd/MM/yyyy`, `'en-US'` → `MM/dd/yyyy`); return `'—'` for null, undefined, or invalid date inputs — export from `src/app/shared/pipes/index.ts` (create if missing)
- [x] T017 [P] [US2] Conduct a full i18n audit of all component templates and TypeScript files under `src/app/features/` and `src/app/core/`: list every hardcoded English string, every missing `transloco` pipe call, every untranslated toast title/category, every status badge label (scan status, enrichment status, watched/unwatched, media type badges) — produce a gap list used by T018 and T019
- [x] T018 [US2] Add all missing translation keys identified in T017 to `src/assets/i18n/en.json`: status badge labels, toast notification categories and messages, button labels, dialog titles, error messages, empty-state messages, ARIA labels, and any other hardcoded strings — depends on T017 gap list
- [x] T019 [US2] Add French translations for every key added in T018 to `src/assets/i18n/fr.json` — depends on T018; ensure badge and toast text reads naturally in French (e.g. `"Vu"` for `"Watched"`, `"Toujours en production"` for `"Still in Production"`)
- [x] T020 [US2] Update `src/app/features/admin/scanner/admin-scan.service.ts`: change `startScan(libraryRootIds: string[], mode: ScanMode)` signature to `startScan(libraryRootIds: string[], mode: ScanMode, language?: string): void`; include `language` in the POST body sent to `POST /api/v1/admin/scan` — depends on T002 for full integration
- [x] T021 [US2] Update `src/app/features/admin/scanner/scan-launcher.component.ts`: inject `TranslocoService`, call `translocoService.getActiveLang()` and pass the result as the `language` argument when calling `adminScanService.startScan()` — depends on T020; verify POST body includes `"language":"fr"` when UI is in French
- [x] T022 [US2] Replace all hardcoded date rendering across `src/app/features/` with `LocaleDatePipe`: update `media-detail-page.component.html`, collection page date displays, admin library list date columns, scan history dates, and any other date-displaying component templates — depends on T016; verify DD/MM/YYYY in FR and MM/DD/YYYY in EN
- [x] T023 [US2] Replace all hardcoded status badge text (scan status, enrichment status, watched/unwatched, media type) with `translocoService` pipe calls in all affected component templates under `src/app/features/` — depends on T018/T019; cover both template pipes (`| transloco`) and programmatic calls in `.ts` files
- [x] T024 [US2] Replace all hardcoded toast notification titles and category strings with Transloco key lookups in all feature service and component TypeScript files under `src/app/features/` and `src/app/core/` — depends on T018/T019; ensure EN and FR toasts display correctly when locale is switched
- [x] T025 [US2] Final i18n verification: switch app to French, walk through all pages (Collection, Search, Wishlist, Profile, Admin Scanner, Admin Library Roots, Nav menu, toast notifications, error states), confirm zero hardcoded English strings remain; switch back to English and confirm no regressions; verify date formats on all date-displaying pages in both locales

**Checkpoint**: User Story 2 is complete — full EN/FR coverage, locale-aware dates, language-aware scanning.

---

## Phase 5: User Story 3 — Admin Library Root Folder Selection (Priority: P2)

**Goal**: The "Add Library Root" dialog presents a root folder dropdown sourced from `GET /api/v1/files/locations`; admin selects a root, types a sub-path, reviews the composed full path, and saves. Falls back to manual path entry when no locations are returned.

**Independent Test**: Open the Add Library Root dialog → confirm the dropdown is populated with locations from the API → select a root (e.g. `/Disque NAS 1`), type a sub-path (`/Films`), confirm full-path preview shows `/Disque NAS 1/Films` → submit → confirm new library root appears in the list.

- [x] T026 [P] [US3] Create `src/app/shared/services/admin-files.service.ts` as an `@Injectable({ providedIn: 'root' })` service with one method: `getLocations(): Observable<ApiResponse<string[]>>` calling `GET /api/v1/files/locations` via `ApiService` or `HttpClient` — add the service to the shared module exports/barrel if applicable
- [x] T027 [US3] Update `src/app/features/admin/library-roots/add-library-root-dialog.component.ts`: inject `AdminFilesService`; on dialog open call `getLocations()` and store results in a `locations = signal<string[]>([])` signal; add `isLoadingLocations = signal(false)` and `hasNoLocations = signal(false)`; add `selectedRoot = signal<string | null>(null)` and `subPath = signal('')`; compute `composedPath = computed(() => selectedRoot() ? \`\${selectedRoot()}\${subPath()}\` : subPath())`; pass `composedPath()` as the path value on form submit — depends on T026
- [x] T028 [US3] Update `src/app/features/admin/library-roots/add-library-root-dialog.component.html`: replace the existing single path input with a conditional layout — when `hasNoLocations()` is false, show a `<p-select>` dropdown bound to `selectedRoot` (options from `locations()`) with a loading skeleton while `isLoadingLocations()`, plus a text input for the sub-path, plus a read-only full-path preview; when `hasNoLocations()` is true, show the fallback manual full-path text input with an info message — depends on T027
- [x] T029 [P] [US3] Update `src/app/features/admin/library-roots/add-library-root-dialog.component.scss` to style the dropdown, sub-path text input, composed-path preview label, and the no-locations fallback message using CSS custom properties from the design token system; ensure mobile-friendly layout at ≤ 768 px
- [x] T030 [US3] Add all new i18n keys for US3 UI strings to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: root folder dropdown placeholder (`"Select a root folder"` / `"Sélectionnez un dossier racine"`), sub-path input label, full-path preview label, no-locations fallback message, loading indicator label — depends on T028
- [x] T031 [US3] End-to-end verification for US3: open the Add Library Root dialog, confirm root folder dropdown populates from the API, select a root, type a sub-path, verify composed path preview updates reactively, submit the form and confirm the new library root appears in the list; also test the fallback: mock an empty `GET /api/v1/files/locations` response and confirm the fallback manual input and info message appear

**Checkpoint**: User Story 3 is complete — admin can compose library root paths via dropdown or manual fallback.

---

## Phase 6: User Story 4 — Wishlist Indicator on TMDB Search (Priority: P2)

**Goal**: TMDB search result cards display a wishlist indicator badge for any item already in the user's wishlist. The indicator appears immediately (reactively) when an item is added to the wishlist from the search page.

**Independent Test**: Add a media item to the wishlist → navigate to TMDB Search → search for that item → confirm the wishlist indicator badge is visible on the matching result card → add another item from the search page → confirm its card badge appears immediately without a page refresh.

- [x] T032 [P] [US4] Update `src/app/features/tmdb-search/tmdb-search-page.component.ts`: inject `WishlistService`; call `wishlistService.loadItems()` in `ngOnInit` (or constructor effect) if items are not already loaded; create a `wishlistTmdbIds = computed(() => new Set(this.wishlistService.items().map(i => i.tmdbId)))` computed signal — ensure `WishlistService` is already provided at root level
- [x] T033 [US4] Update `src/app/features/tmdb-search/tmdb-result-card.component.ts`: add an `isInWishlist = input.required<boolean>()` input signal using Angular 21's `input()` API (or `@Input()` with signal bridging); ensure `ChangeDetectionStrategy.OnPush` is set
- [x] T034 [US4] Update `src/app/features/tmdb-search/tmdb-result-card.component.html`: add a wishlist indicator element (heart/bookmark icon or badge) that renders conditionally when `isInWishlist()` is true, positioned alongside the existing "already in collection" indicator — ensure it is accessible with an `aria-label` bound to a Transloco key
- [x] T035 [P] [US4] Update `src/app/features/tmdb-search/tmdb-result-card.component.scss` to style the wishlist badge/icon: distinct color (e.g. accent/primary color), sufficient contrast in dark and light mode using CSS custom properties; add hover/focus styles consistent with the existing "in collection" badge treatment
- [x] T036 [US4] Update `src/app/features/tmdb-search/tmdb-search-page.component.html`: pass `[isInWishlist]="wishlistTmdbIds().has(result.tmdbId)"` to each `<app-tmdb-result-card>` — depends on T032 and T033; verify computed signal propagates reactively when wishlist changes
- [x] T037 [US4] Add i18n keys for the wishlist indicator to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json` (e.g. `"search.wishlistIndicator": "In your wishlist"` / `"Dans votre liste de souhaits"`); verify reactive update: from the search page, add a result to the wishlist via the existing wishlist action and confirm the badge appears immediately on that card without reloading

**Checkpoint**: User Story 4 is complete — wishlist indicators on TMDB search results are live and reactive.

---

## Phase 7: User Story 5 — TV Show Production Status & Missing Seasons (Priority: P2)

**Goal**: TV show detail pages display a production status badge ("Still in Production", "Ended", "Unknown") and visually highlight seasons missing from the user's collection compared to TMDB's total season count.

**Independent Test**: Find a TV show that is still in production and has at least one missing season → open its detail page → confirm the "Still in Production" badge is displayed near the title → confirm missing season numbers are visually highlighted in the seasons list.

> **Backend Dependency**: Requires T003 (`MediaDto` extension with `status`/`numberOfSeasons`) to be deployed for live testing.

- [x] T038 [P] [US5] Update `src/app/shared/models/media.model.ts`: add `status: string | null` and `numberOfSeasons: number | null` to the `Media` interface — these map directly to the extended `MediaDto` fields from the backend
- [x] T039 [US5] Update `src/app/features/media-detail/media-detail-page.component.ts`: add a `productionStatusLabel = computed(() => ...)` signal that maps `media().status` values: `'Returning Series'` → transloco key `'media.status.inProduction'`, `'Ended'` → `'media.status.ended'`, any other/null → `'media.status.unknown'`; expose a `isTvShow = computed(() => media().type === 'TvShow')` guard signal — depends on T038
- [x] T040 [US5] Update `src/app/features/media-detail/media-detail-page.component.html`: add a production status badge element below the show title, shown only when `isTvShow()` is true, bound to `productionStatusLabel()` via Transloco, styled with a distinct badge CSS class — depends on T039
- [x] T041 [P] [US5] Update `src/app/features/media-detail/media-detail-page.component.scss`: add status badge styles with color-coded classes (e.g. `--badge-in-production` in green/teal, `--badge-ended` in grey, `--badge-unknown` in neutral) using CSS custom properties from the design token system; ensure badge is visible in both dark and light themes
- [x] T042 [US5] Update `src/app/features/media-detail/season-list.component.ts`: compute `missingSeasonNumbers = computed(() => { const total = media().numberOfSeasons ?? 0; const owned = new Set(seasons().map(s => s.seasonNumber)); return Array.from({ length: total }, (_, i) => i + 1).filter(n => !owned.has(n)); })` where `seasons()` is the fetched season list — depends on T038; ensure the component receives `media` input (or injects Media signal from parent)
- [x] T043 [US5] Update `src/app/features/media-detail/season-list.component.html`: for each season number in `missingSeasonNumbers()`, render a visual "missing season" entry with a distinct treatment (greyed-out card, dashed border, or badge labeled with Transloco key `'media.season.missing'`) interleaved at the correct position in the seasons list — depends on T042
- [x] T044 [US5] Update `src/app/features/media-detail/season-list.component.scss` to style missing season entries (reduced opacity, dashed border, or muted color scheme) distinct from owned seasons; add i18n keys to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json` for: `media.status.inProduction`, `media.status.ended`, `media.status.unknown`, `media.season.missing`

**Checkpoint**: User Story 5 is complete — TV show detail pages show production status and missing seasons.

---

## Phase 8: User Story 6 — Enhanced Profile Page with Custom Picture (Priority: P3)

**Goal**: Profile page displays the auth provider picture by default; user can upload a custom picture (JPEG/PNG/WebP, ≤ 2 MB) to replace it; user can remove the custom picture to revert to the auth provider default; a generic avatar appears when no picture is available at all.

**Independent Test**: (a) Log in — confirm auth provider picture (Google/Okta) displays on profile page. (b) Upload a custom JPEG — confirm it replaces the default within 3 seconds. (c) Remove the custom picture — confirm reversion to auth provider picture. (d) Upload an invalid file (e.g. PDF or >2 MB JPEG) — confirm clear error message, no picture change.

> **Backend Dependency**: Requires T005–T008 (profile picture endpoints and static file serving) to be deployed for live testing.

- [x] T045 [P] [US6] Update `src/app/shared/models/user.model.ts`: add `profilePicturePath: string | null` to the `User` interface — matches the extended `UserDto.ProfilePicturePath` backend field
- [x] T046 [US6] Update `src/app/features/profile/profile.service.ts`: add `uploadProfilePicture(file: File): void` method that constructs a `FormData` with the `file` field, POSTs to `POST /api/v1/users/profile-picture` using `HttpClient`, updates the user signal with the returned `UserDto` on 200, throws/exposes an observable error on 400 (invalid file type/size); add `removeProfilePicture(): void` method that DELETEs `DELETE /api/v1/users/profile-picture`, updates the user signal with `profilePicturePath: null` on 200 — use `takeUntilDestroyed()` for subscription cleanup — depends on T045
- [x] T047 [US6] Update `src/app/features/profile/profile-page.component.ts`: inject `AuthService` to read `user$.picture` (auth0 picture URL); inject `ProfileService` for the user signal; add `effectivePictureUrl = computed(() => user().profilePicturePath ?? auth0Picture() ?? '/assets/images/avatar-placeholder.svg')` computed signal; add `isUploading = signal(false)`, `uploadError = signal<string | null>(null)`; add `onFileSelected(event: Event)` handler that reads the file, validates type (JPEG/PNG/WebP) and size (≤ 2 MB) on the frontend before calling `profileService.uploadProfilePicture(file)`, updates `isUploading` and `uploadError` accordingly — depends on T046
- [x] T048 [US6] Update `src/app/features/profile/profile-page.component.html`: display the effective profile picture using `<img [ngSrc]="effectivePictureUrl()" width="128" height="128" alt="Profile picture">`; add a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` triggered by a styled "Upload photo" button; add a loading spinner overlay conditional on `isUploading()`; add a `<p class="error">` element conditional on `uploadError()` bound to a Transloco key; add a "Remove photo" button shown only when `user().profilePicturePath` is non-null, calling `profileService.removeProfilePicture()` — depends on T047
- [x] T049 [P] [US6] Add a generic avatar placeholder image at `src/assets/images/avatar-placeholder.svg` (simple circular silhouette, works in dark and light mode via `currentColor` or neutral tones) — referenced in T047
- [x] T050 [P] [US6] Update `src/app/features/profile/profile-page.component.scss` to style the profile picture container (circular crop, fixed 128×128 px), the upload overlay button (hover state), the loading spinner, the error message, and the remove button — use CSS custom properties and SCSS mixins per the design token system; ensure mobile-responsive layout at ≤ 768 px
- [x] T051 [US6] Add i18n keys for all profile picture UI strings to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `profile.picture.upload` (`"Upload photo"` / `"Télécharger une photo"`), `profile.picture.remove` (`"Remove photo"` / `"Supprimer la photo"`), `profile.picture.uploading`, `profile.picture.errorType` (`"Only JPEG, PNG and WebP files are accepted."`), `profile.picture.errorSize` (`"File must be less than 2 MB."`), `profile.picture.alt`
- [x] T052 [US6] End-to-end verification for US6: confirm auth0 picture displays by default → upload a valid PNG → confirm display updates → upload invalid file → confirm error message → remove custom picture → confirm reversion to auth0 default → log in with an account that has no auth0 picture and confirm avatar placeholder renders

**Checkpoint**: User Story 6 is complete — profile picture upload/remove/fallback chain is fully functional.

---

## Phase 9: User Story 7 — User Info in Navigation Menu (Priority: P3)

**Goal**: The navigation sidebar shows the logged-in user's first name, last name, and profile picture (using the same `effectivePictureUrl` priority chain: custom > auth0 > generic avatar) adjacent to the logout button. On mobile, a compact layout is used.

**Independent Test**: Log in → open the app → confirm the sidebar shows the user's full name and profile picture next to the sign-out button → resize to mobile (≤ 768 px) → confirm compact layout → remove custom picture (US6) → confirm the auth provider picture appears in the nav as well.

> **Story Dependency**: Requires T045 (`user.model.ts` with `profilePicturePath`) for the profile picture priority chain. Best implemented after US6 is complete to share the avatar placeholder from T049.

- [x] T053 [US7] Update `src/app/core/layout/sidebar.component.ts`: inject `AuthService` to read `user$` (for `given_name`, `family_name`, `picture` from Auth0 ID token); inject the app user signal (or `ProfileService`) to read `profilePicturePath`; add `displayName = computed(() => \`\${user().firstName} \${user().lastName}\`.trim() || auth0User()?.name || 'User')`and`navPictureUrl = computed(() => user().profilePicturePath ?? auth0User()?.picture ?? '/assets/images/avatar-placeholder.svg')` computed signals — depends on T045 and T049
- [x] T054 [US7] Update `src/app/core/layout/sidebar.component.html`: add a user info section immediately above (or adjacent to) the existing logout button containing: a circular `<img [ngSrc]="navPictureUrl()" width="36" height="36" [alt]="displayName()">` thumbnail and a `<span>` displaying `displayName()`; wrap in a responsive container with a mobile-compact variant class — depends on T053
- [x] T055 [P] [US7] Update `src/app/core/layout/sidebar.component.scss` to style the new user info section: circular thumbnail (36×36 px), name text with overflow ellipsis, flexbox row alignment with the logout button; add a `@media (max-width: 768px)` block with a compact variant (smaller thumbnail, shorter name display or initials) — use CSS custom properties
- [x] T056 [US7] Add i18n keys for the nav user info to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `nav.userPicture.alt` (`"Your profile picture"` / `"Votre photo de profil"`), `nav.loggedInAs` (optional accessible label) — verify in both EN and FR
- [x] T057 [US7] End-to-end verification for US7: navigate all pages and confirm user info persists in the sidebar → switch locales and confirm i18n labels update → verify compact mobile layout at ≤ 768 px → confirm generic avatar shows for accounts without any picture

**Checkpoint**: User Story 7 is complete — user identity is visible in the navigation menu on all pages.

---

## Phase 10: User Story 8 — Fix Frontend Warnings (Priority: P3)

**Goal**: Zero avoidable console warnings during normal app use. Zero compilation warnings in production builds.

**Independent Test**: (a) `npm run build` completes with zero warnings in the Angular CLI output. (b) Open browser DevTools, navigate every page and trigger key interactions (scan, wishlist add, profile upload) and confirm zero warnings in the console.

- [x] T058 [US8] Audit all browser console warnings: run the app, open DevTools Console (filter: Warnings), navigate every page (Collection, Search, Wishlist, Profile, Admin Scanner, Admin Library Roots, Media Detail) and trigger the main interactions; capture and categorize every warning as: `NgOptimizedImage` missing dimensions, `ExpressionChangedAfterItHasBeenChecked`, deprecated API usage, or other — produce a fix list used by T059–T061
- [x] T059 [US8] Fix all `NgOptimizedImage` warnings across the entire `src/app/` codebase: for every `<img ngSrc>` element, add explicit `width` and `height` integer attributes matching the intrinsic display dimensions; for responsive/fluid images use the `fill` attribute with a positioned container instead — verify zero `NG02960` / `NG02955` warnings after fix — depends on T058
- [x] T060 [P] [US8] Fix all `ExpressionChangedAfterItHasBeenChecked` errors across affected components identified in T058: move any signal writes out of `ngAfterViewInit` / `ngAfterContentInit` into `afterNextRender()` or `effect()` with `allowSignalWrites: true`; use `queueMicrotask()` or `setTimeout(0)` only as a last resort — ensure `ChangeDetectionStrategy.OnPush` is consistently set on all modified components — depends on T058
- [x] T061 [P] [US8] Fix all deprecated Angular API warnings identified in T058 (e.g. deprecated `@HostListener` patterns, deprecated PrimeNG component inputs/outputs, deprecated `HttpClientModule` if still referenced, any other flagged deprecations) — update to recommended Angular 21 alternatives in all affected files under `src/app/` — depends on T058
- [x] T062 [US8] Verify production build: run `npm run build` and confirm the Angular CLI output contains zero compilation warnings (bundle budget, template errors, deprecated API warnings, etc.); if any warnings remain, fix them in the affected files — depends on T059–T061
- [x] T063 [US8] Final console warning verification: with the production-like build or dev server, navigate every major page and interaction (Collection browse, TMDB search + wishlist add, scan trigger, media detail TV show, profile picture upload + remove, admin library root dialog), confirm zero warnings in the browser console — depends on T062

**Checkpoint**: User Story 8 is complete — zero warnings in console and zero compilation warnings.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final type-check, lint, integration validation, and quickstart verification pass across all changes.

- [x] T064 [P] Run `npx tsc --noEmit` from the workspace root and fix any TypeScript strict-mode type errors introduced by new signal types, model interface additions (`status`, `numberOfSeasons`, `profilePicturePath`), or new pipe/service public APIs
- [x] T065 [P] Run `npm run lint` from the workspace root and fix any ESLint/Angular-ESLint rule violations across all modified files; ensure no `@typescript-eslint/no-explicit-any` suppressions were introduced
- [x] T066 Run the full quickstart.md verification checklist in `specs/006-app-enhancements/quickstart.md` end-to-end: confirm every item on the 11-point checklist passes; document any item that requires the backend API to be deployed and note the backend task dependency (T002–T008)

---

## Phase 12: Enrichment Language Pass-Through (Gap — US2 Extension)

**Goal**: When enriching media, TMDB metadata is fetched in the user's active UI language — mirroring the language-aware scanning already implemented in T020–T021. The enrichment confirmation dialog also reflects the active language so the admin knows which locale will be used.

**Independent Test**: (a) Switch the app to French, open the Admin Enrichment page, and trigger an enrichment run — verify the outgoing `POST /api/v1/admin/enrichment/start` body contains `"language":"fr"`. (b) Switch to English and repeat — verify `"language":"en"` is sent. (c) Confirm TMDB metadata fields (title, overview, genre names) returned after an FR enrichment are in French.

> **Backend Dependency**: T067–T068 (backend language propagation) must be deployed for full end-to-end testing. T069–T071 (frontend) can be coded independently and verified by inspecting the outgoing network request.

- [x] T067 Add `StartEnrichmentRequest` record to `../MediaHandler.API/MediaHandler.API/Contracts/Admin/ScanRequests.cs` with `string? Language = null`; extend `StartEnrichmentCommand` in `../MediaHandler.API/MediaHandler.Application/Features/Dashboard/Commands/StartEnrichment/StartEnrichmentCommand.cs` to add `string? Language = null`; update `AdminEnrichmentController.StartEnrichment()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminEnrichmentController.cs` to accept `[FromBody] StartEnrichmentRequest? request = null` and pass `request?.Language` to `new StartEnrichmentCommand(request?.Language)`; update `StartEnrichmentCommandHandler` to forward `request.Language` to `coordinator.StartAsync(run.Id, request.Language, cancellationToken)` — verify with `dotnet build` and confirm the request body is accepted without breaking existing callers that send no body
- [x] T068 Update `IEnrichmentCoordinator.StartAsync()` signature in `../MediaHandler.API/MediaHandler.Application/Common/Interfaces/IEnrichmentCoordinator.cs` to `Task StartAsync(Guid enrichmentRunId, string? language = null, CancellationToken ct = default)`; update `EnrichmentCoordinator.StartAsync()` and `ExecuteEnrichmentAsync()` in `../MediaHandler.API/MediaHandler.Infrastructure/Services/EnrichmentCoordinator.cs` to receive and thread `language` through; replace both hardcoded `"en-US"` locale strings in `EnrichMediaFieldsAsync()` (line 270) and `UpsertTvSeasonsAsync()` (line 343) with a resolved locale derived from `language` (map `"fr"` → `"fr-FR"`, `"en"` → `"en-US"`, fallback null/unknown → `"en-US"`) — depends on T067; verify with `dotnet build` and confirm TMDB calls use the correct locale when language is `"fr"`
- [x] T069 [P] Update `src/app/features/admin/enrichment/admin-enrichment.service.ts`: change `startEnrichment()` signature to `startEnrichment(language?: string): void`; replace the `this.api.post<EnrichmentRun>('admin/enrichment/start', null)` call with `this.api.post<EnrichmentRun>('admin/enrichment/start', { language })` so the language is included in the POST request body — depends on T067 for full integration; verify the network payload in DevTools shows `{"language":"fr"}` when called with `"fr"`
- [x] T070 Update `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`: add `TranslocoService` import from `@jsverse/transloco`; inject `private readonly translocoService = inject(TranslocoService)`; in the `accept` callback of `startEnrichment(t)`, read `const language = this.translocoService.getActiveLang()` and pass it to `this.enrichmentService.startEnrichment(language)`; update the confirmation `message` to use `t('admin.enrichment.confirmMessageWithLanguage', { language: t('admin.enrichment.language.' + this.translocoService.getActiveLang()) })` so the dialog displays the target language — depends on T069 and T071; verify POST body includes `"language":"fr"` when UI is in French
- [x] T071 [P] Add enrichment language i18n keys to `src/assets/i18n/en.json` under `admin.enrichment`: `"confirmMessageWithLanguage": "Are you sure you want to start a batch TMDB enrichment scan? Metadata will be fetched in {{language}}."`, `"language": { "en": "English", "fr": "French" }`; add matching French translations to `src/assets/i18n/fr.json`: `"confirmMessageWithLanguage": "Êtes-vous sûr de vouloir lancer un enrichissement TMDB en lot ? Les métadonnées seront récupérées en {{language}}."`, `"language": { "en": "anglais", "fr": "français" }` — these keys are consumed by T070; verify the confirmation dialog renders the active language name correctly in both EN and FR

**Checkpoint**: Enrichment language pass-through is complete — TMDB metadata is fetched in the user's active UI language during enrichment, mirroring the scan language feature from Phase 4.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS US2 (scan language), US5, US6, US7** for live-API integration testing
- **US1 (Phase 3)**: Depends only on Phase 1 — can start in parallel with Phase 2 backend work
- **US2 (Phase 4)**: i18n audit/translation tasks (T015–T019, T022–T025) can start after Phase 1; scan language tasks (T020–T021) require T002 for full testing
- **US3 (Phase 5)**: Depends only on Phase 1 — uses existing `GET /api/v1/files/locations` endpoint
- **US4 (Phase 6)**: Depends only on Phase 1 — pure frontend signal work
- **US5 (Phase 7)**: T038 can start after Phase 1; T039–T044 require T003 (backend MediaDto) for live testing
- **US6 (Phase 8)**: T045–T051 require T005–T008 (backend profile picture endpoints) for live testing
- **US7 (Phase 9)**: Requires T045 (user model) and T049 (avatar placeholder); best started after US6 is complete
- **US8 (Phase 10)**: Can start after all user stories are implemented (some warnings may be introduced by earlier tasks)
- **Polish (Phase 11)**: Depends on all user story phases being complete
- **Enrichment Language (Phase 12)**: T067–T068 (backend propagation) can run in parallel with Phase 2 backend work; T069–T071 (frontend) depend on T020 pattern and can start immediately; full integration requires T067–T068 deployed

### User Story Dependencies

| Story                      | Priority | Depends On                             | Can Parallelize With        |
| -------------------------- | -------- | -------------------------------------- | --------------------------- |
| US1 — Icon Fixes           | P1       | Phase 1 only                           | Phase 2, US2 frontend tasks |
| US2 — i18n + Scan Language | P1       | Phase 1; T002 for scan language        | US1, US3, Phase 2           |
| US3 — Admin Root Folder    | P2       | Phase 1 only                           | US1, US2, US4, US5          |
| US4 — Wishlist Indicator   | P2       | Phase 1 only                           | US1, US2, US3, US5          |
| US5 — TV Show Status       | P2       | T038 after Phase 1; T003 for live test | US1, US2, US3, US4          |
| US6 — Profile Picture      | P3       | T005–T008 (backend endpoints)          | US7 model prep (T045)       |
| US7 — Nav User Info        | P3       | T045 (user model), T049 (avatar)       | Starts after US6            |
| US8 — Warning Fixes        | P3       | All other stories implemented          | —                           |

### Within Each User Story

- Model/type changes first (e.g. T038, T045)
- Service changes before component changes (e.g. T046 before T047)
- Component TypeScript before template before styles
- i18n keys added before template references (e.g. T018/T019 before T023/T024)
- Verification task always last within a story

---

## Parallel Execution Examples

### Phase 2 (Backend) — Parallel opportunities

```
Can run simultaneously:
  T002 — Extend StartScanRequest/Command (scan language)
  T003 — Extend MediaDto (TV show fields)
  T004 — Add ProfilePicturePath to User entity + migration

Then sequentially:
  T005 — depends on T004 (UserDto extends User)
  T006 — depends on T005 (upload endpoint returns UserDto)
  T007 — depends on T006 (delete endpoint same controller)
  T008 — depends on T006 (static file serving for uploads)
```

### Phase 3 (US1) — Parallel opportunities

```
Sequential: T009 (audit) → T010 (root SCSS fix)
Parallel after T010:
  T011 — media-card.component.scss
  T012 — sidebar.component.scss (theme toggle)
  T013 — all other component SCSS files
Sequential: T014 (final verification pass)
```

### Phase 4 (US2) — Parallel opportunities

```
Parallel (independent starting points):
  T015 — app.config.ts locale registration
  T016 — LocaleDatePipe creation
  T017 — i18n audit (produces gap list)

Sequential after T017:
  T018 — add EN keys → T019 — add FR keys
  T022 — replace date rendering (depends T016)
  T023 — replace status badge text (depends T018/T019)
  T024 — replace toast strings (depends T018/T019)
  T020 → T021 — scan language chain

Sequential: T025 (verification pass)
```

### Phase 7 (US5) — Parallel opportunities

```
Parallel:
  T038 — media.model.ts
  T041 — media-detail-page.component.scss (badge styles)

Sequential after T038:
  T039 → T040 — productionStatusLabel signal + template
  T042 → T043 — missingSeasons computation + template
  T044 — season-list.component.scss + i18n keys
```

### Phase 12 (Enrichment Language) — Parallel opportunities

```
Parallel (separate repos/files):
  T067 — Backend: StartEnrichmentRequest + Command + Controller body
  T069 — Frontend: AdminEnrichmentService.startEnrichment(language?)
  T071 — i18n: confirmation message keys (en.json + fr.json)

Sequential:
  T068 — depends on T067 (IEnrichmentCoordinator signature change)
  T070 — depends on T069 and T071 (component wires service + i18n keys)
```

---

## Implementation Strategy

### MVP (User Story 1 Only — Immediate Value)

1. Complete Phase 1: Setup
2. Complete Phase 3: US1 (Icon Fixes — pure CSS, zero backend dependency)
3. **STOP AND VALIDATE**: Every icon is visible in dark and light mode across all pages
4. Ship / demo

### Incremental Delivery (Recommended)

| Sprint | Phases                                      | Deliverable                                   |
| ------ | ------------------------------------------- | --------------------------------------------- |
| 1      | Phase 1 + Phase 2 (backend) + Phase 3 (US1) | Icon fixes live; backend API changes deployed |
| 2      | Phase 4 (US2)                               | Full EN/FR coverage + language-aware scanning |
| 3      | Phase 5 + Phase 6 (US3 + US4)               | Admin root dropdown + wishlist indicators     |
| 4      | Phase 7 (US5)                               | TV show production status + missing seasons   |
| 5      | Phase 8 + Phase 9 (US6 + US7)               | Profile picture upload + nav user info        |
| 6      | Phase 10 + Phase 11 (US8 + Polish)          | Zero warnings + final verification            |

### Parallel Team Strategy (2+ developers)

```
Developer A (Frontend):  Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 7 (US5)
Developer B (Frontend):  Phase 6 (US4) → Phase 8 (US6) → Phase 9 (US7) → Phase 10 (US8)
Developer C (Backend):   Phase 2 entire (T002–T008) → assist Phase 11 (Polish)
```

---

## Notes

- `[P]` tasks target different files and have no blocking dependencies on incomplete tasks in the same phase
- `[US#]` labels enable traceability from task → user story → functional requirement
- All backend tasks (Phase 2) are in the companion `MediaHandler.API` solution — coordinate deployments
- Frontend tasks needing live-API testing have explicit **Backend Dependency** callouts; they can be coded and unit-tested offline but require the backend for integration verification
- Commit granularity: one logical task or natural file grouping per commit; push after each phase checkpoint
- All modified and new Angular components MUST use `ChangeDetectionStrategy.OnPush` and signal-first state management
- No new npm dependencies — all changes use existing Angular 21, PrimeNG 21, Transloco 8, Auth0 Angular 2 APIs
- Profile picture file size limit: 2 MB; accepted formats: JPEG, PNG, WebP (validate both on frontend and backend)

---

## Phase 13: Foundational Backend — Sort/Filter & New Endpoints (Unblocks US-9, US-11, US-12, US-14)

**Purpose**: Backend-only changes that MUST be shipped before US-9 frontend sort/filter, US-11 live counters, US-12 batch assign, and US-14 completeness badge can be fully tested against the live API.

> **Note**: `PagedResult<T>` already exists at `../MediaHandler.API/MediaHandler.Application/Common/Models/PagedResult.cs`. All six admin list endpoints already implement `page`/`pageSize` pagination. These tasks extend them with `sortField`/`sortOrder` and column-specific filter parameters. `GET /api/v1/media/stats` already exists but lacks `incompleteTvShowCount`.

- [x] T072 [P] Add `string? sortField` and `string? sortOrder` ("asc"/"desc") parameters to `GetUsersQuery` in `../MediaHandler.API/MediaHandler.Application/Features/Admin/Queries/GetUsers/GetUsersQueryHandler.cs`; update `AdminController.GetUsers()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminController.cs` to accept `[FromQuery] string? sortField = null` and `[FromQuery] string? sortOrder = "asc"` and forward them to the query; apply a `sortField` switch on the EF Core `IQueryable` to order by `DisplayName`, `Email`, `Role`, or `IsActive`, with `sortOrder` controlling ascending/descending direction — verify with `dotnet build`
- [x] T073 [P] Add `string? sortField`, `string? sortOrder`, and `string? fileName` text filter parameters to `ListReviewItemsQuery` in `../MediaHandler.API/MediaHandler.Application/Features/Review/Queries/ListReviewItems/ListReviewItemsQuery.cs`; update `AdminReviewController.ListReviewItems()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminReviewController.cs` to accept and forward the new parameters; apply case-insensitive `Contains` on `ReviewItem.FileName` when `fileName` is provided; apply sort switch on `FileName`, `Status`, `CreatedAt` — verify with `dotnet build`
- [x] T074 [P] Add `string? sortField` and `string? sortOrder` parameters to `ListScanHistoryQuery` in `../MediaHandler.API/MediaHandler.Application/Features/Scan/Queries/ListScanHistory/ListScanHistoryQuery.cs`; update `AdminScanController.ListHistory()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminScanController.cs` to accept and forward them; apply sort switch on `StartedAt`, `Status`, `Mode` in the EF Core query — verify with `dotnet build`
- [x] T075 [P] Add `string? sortField`, `string? sortOrder`, and `string? fileName` text filter parameters to `ListScanDecisionsQuery` in `../MediaHandler.API/MediaHandler.Application/Features/Dashboard/Queries/ListScanDecisions/ListScanDecisionsQuery.cs`; update the scan decisions action in `../MediaHandler.API/MediaHandler.API/Controllers/AdminScanDecisionsController.cs` to accept and forward them; apply case-insensitive `Contains` on `FileName` and sort switch on `FileName`, `Status`, `ScannedAt` — verify with `dotnet build`
- [x] T076 [P] Add `string? sortField` and `string? sortOrder` parameters to `ListEnrichmentHistoryQuery` in `../MediaHandler.API/MediaHandler.Application/Features/Dashboard/Queries/ListEnrichmentHistory/ListEnrichmentHistoryQuery.cs`; update `AdminEnrichmentController.ListHistory()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminEnrichmentController.cs` to accept and forward them; apply sort switch on `StartedAt`, `Status` — verify with `dotnet build`
- [x] T077 [P] Add `string? sortField`, `string? sortOrder`, and `string? path` text filter parameters to `ListLibraryRootsQuery` in `../MediaHandler.API/MediaHandler.Application/Features/LibraryRoots/Queries/ListLibraryRoots/ListLibraryRootsQuery.cs`; update `AdminLibraryRootsController.List()` in `../MediaHandler.API/MediaHandler.API/Controllers/AdminLibraryRootsController.cs` to accept and forward them; apply case-insensitive `Contains` on `Path` when provided; add sort switch on `Path`, `CreatedAt` — verify with `dotnet build`
- [x] T078 Update `../MediaHandler.API/MediaHandler.Infrastructure/Services/ScanRunCoordinator.cs`: in the main file processing loop (`RunScanAsync` or equivalent), increment `scanRun.TotalDiscovered++` for every file discovered; increment `scanRun.Added++`, `scanRun.Updated++`, or `scanRun.NeedsReview++` immediately after each file outcome is classified; flush to the database every 10 processed files using `if (processedCount % 10 == 0) { await context.SaveChangesAsync(CancellationToken.None); }` so the `GET /api/v1/admin/scan/active` endpoint reports live counts during the scan — verify `dotnet build` and run a test scan to confirm counters are > 0 before scan completion
- [x] T079 Create `BatchAssignReviewItemsCommand` and its handler in `../MediaHandler.API/MediaHandler.Application/Features/Review/Commands/BatchAssignReviewItems/BatchAssignReviewItemsCommand.cs`: define command record `BatchAssignReviewItemsCommand(Guid[] ReviewItemIds, Guid TargetMediaId) : IRequest<Result<BatchAssignReviewItemsResponse>>`; handler iterates each ID, resolves the `ReviewItem` by setting `AssignedMediaId = TargetMediaId` and marking `Status = Resolved` (mirroring the existing `ResolveReviewItemCommand` logic), catches per-item exceptions; define `BatchAssignItemResult(Guid ReviewItemId, bool Success, string? ErrorMessage)` and `BatchAssignReviewItemsResponse(IReadOnlyList<BatchAssignItemResult> Results)` in `../MediaHandler.API/MediaHandler.API/Contracts/Admin/ReviewRequests.cs` — verify with `dotnet build`
- [x] T080 Add `POST /api/v1/admin/review-items/batch-assign` endpoint to `../MediaHandler.API/MediaHandler.API/Controllers/AdminReviewController.cs`: accept `[FromBody] BatchAssignReviewItemsRequest` (record with `Guid[] ReviewItemIds`, `Guid TargetMediaId`); validate array is non-empty; dispatch `BatchAssignReviewItemsCommand` via MediatR; return `200 OK ApiResponse<BatchAssignReviewItemsResponse>`; return `400 Bad Request` for invalid input; return `403 Forbidden` for non-admin callers — depends on T079; verify with `dotnet build` and a test POST confirming per-item success/failure results in the response
- [x] T081 Extend `MediaStatsDto` in `../MediaHandler.API/MediaHandler.Application/Features/Media/DTOs/MediaDto.cs`: add `int IncompleteTvShowCount` field; update `GetMediaStatsQueryHandler` in `../MediaHandler.API/MediaHandler.Application/Features/Media/Queries/GetMediaStats/GetMediaStatsQueryHandler.cs` to compute `IncompleteTvShowCount` as the count of TV shows where `m.NumberOfSeasons.HasValue && ownedSeasonCount < m.NumberOfSeasons.Value` (join `Media` with grouped `TvSeasons` count); update the `MediaStatsDto` constructor call to include the new field — verify `dotnet build` and confirm `GET /api/v1/media/stats` includes `incompleteTvShowCount`
- [x] T082 Add `int? OwnedSeasonCount` field to `MediaListItemDto` in `../MediaHandler.API/MediaHandler.Application/Features/Media/DTOs/MediaDto.cs`; update `GetMediaListQueryHandler` in `../MediaHandler.API/MediaHandler.Application/Features/Media/Queries/GetMediaList/GetMediaListQueryHandler.cs` to project the count of `TvSeason` records per TV show into `OwnedSeasonCount` (null for films) — verify `dotnet build` and confirm `GET /api/v1/media` list response includes `ownedSeasonCount` for TV shows
      **Checkpoint**: Backend for US-9 (sort/filter), US-11 (live counters), US-12 (batch assign), and US-14 (incompleteness data) is complete — all US-9–US-14 frontend work can proceed.

---

## Phase 14: User Story 9 — Frontend Pagination, Filtering & Sorting (Priority: P1)

**Goal**: Every admin data table (Users, Review Items, Scan Decisions, Scan History, Enrichment History, Library Roots) supports sortable column headers (ascending/descending toggle) and inline column filters (text `contains` for string columns, dropdown for enum/status columns). Sort, filter, and pagination state are preserved.
**Independent Test**: Navigate to any admin data table; click a column header to sort ascending, click again for descending; type in a text column filter and confirm rows narrow; select an enum dropdown filter and confirm only matching rows appear; navigate to page 2 while a filter is active and confirm the filter persists.

> **Backend Dependency**: Sort/filter params require T072–T077 to be deployed for full server-side filtering.

- [x] T083 [P] [US9] Update `src/app/features/admin/users/admin-user.service.ts`: extend `getUsers(page, pageSize, search?)` to add `sortField?: string` and `sortOrder?: 'asc' | 'desc'` parameters; append `sortField` and `sortOrder` as `HttpParams` on the `GET /api/v1/admin/users` request — depends on T072; verify `npx tsc --noEmit`
- [x] T084 [US9] Update `src/app/features/admin/users/admin-users-page.component.ts`: extend `onLazyLoad(event: TableLazyLoadEvent)` to extract `event.sortField as string | undefined` and convert `event.sortOrder` (`1` → `'asc'`, `-1` → `'desc'`) and pass to `userService.getUsers()`; update `src/app/features/admin/users/admin-users-page.component.html` to add `[pSortableColumn]="'email'"` on the Email header, `[pSortableColumn]="'displayName'"` on the Name header, `[pSortableColumn]="'role'"` on the Role header, and `<p-sortIcon>` inside each — depends on T083; verify sort arrows render and clicking a header sorts the table
- [x] T085 [P] [US9] Update `src/app/features/admin/review/admin-review.service.ts`: extend `getReviewItems()` to accept `sortField?: string`, `sortOrder?: 'asc' | 'desc'`, and `fileName?: string` parameters and append them as `HttpParams` on `GET /api/v1/admin/review-items` — depends on T073; verify `npx tsc --noEmit`
- [x] T086 [US9] Update `src/app/features/admin/review/admin-review-page.component.ts`: extend `onLazyLoad` to extract `sortField`, `sortOrder`, and the `fileName` text filter value from `event.filters['fileName']?.value`; pass all to `adminReviewService.getReviewItems()`; update `src/app/features/admin/review/admin-review-page.component.html` to add `[pSortableColumn]` on `fileName` and `status` headers plus `<p-columnFilter type="text" field="fileName" [showMenu]="false">` under the file name column — depends on T085
- [x] T087 [P] [US9] Update `src/app/features/admin/scanner/admin-scan.service.ts`: extend `getScanHistory()` to accept `sortField?` and `sortOrder?` and append to `GET /api/v1/admin/scan/history` — depends on T074; also update `src/app/features/admin/scan-results/admin-scan-decision.service.ts` to accept `sortField?`, `sortOrder?`, and `fileName?` parameters and append to `GET /api/v1/admin/scan/decisions` — depends on T075; verify `npx tsc --noEmit` on both files
- [x] T088 [US9] Update `src/app/features/admin/scanner/scan-history-table.component.ts`: extend `onLazyLoad` to extract `sortField`/`sortOrder` from `TableLazyLoadEvent` and pass to `adminScanService.getScanHistory()`; add `[pSortableColumn]="'startedAt'"`, `[pSortableColumn]="'status'"`, `[pSortableColumn]="'mode'"` to column headers in `scan-history-table.component.html`; update `src/app/features/admin/scan-results/admin-scan-results-page.component.ts` to extract and pass `sortField`/`sortOrder`/`fileName` from `onLazyLoad` to `adminScanDecisionService`; add `[pSortableColumn]` on `fileName` and `status` columns plus `<p-columnFilter type="text" field="fileName">` in the scan-results table template — depends on T087
- [x] T089 [P] [US9] Update `src/app/features/admin/enrichment/admin-enrichment.service.ts`: extend the enrichment history fetch method to accept `sortField?`/`sortOrder?` and append to `GET /api/v1/admin/enrichment/history` — depends on T076; update `src/app/features/admin/enrichment/admin-enrichment-page.component.ts` to extend its `onLazyLoad` to extract and pass `sortField`/`sortOrder`; add `[pSortableColumn]="'startedAt'"` and `[pSortableColumn]="'status'"` to enrichment history table column headers
- [x] T090 [P] [US9] Update `src/app/features/admin/library-roots/admin-library-root.service.ts`: extend `getLibraryRoots()` to accept `sortField?`, `sortOrder?`, and `path?` filter params and append to `GET /api/v1/admin/library-roots` — depends on T077; update `src/app/features/admin/library-roots/admin-library-roots-page.component.ts` to extend `onLazyLoad` to pass sort + path filter; add `[pSortableColumn]="'path'"` to the path column header and `<p-columnFilter type="text" field="path" [showMenu]="false">` in `admin-library-roots-page.component.html`
- [x] T091 [P] [US9] Add i18n keys for sort/filter UI to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `table.sortAscending` ("Sort ascending" / "Trier par ordre croissant"), `table.sortDescending` ("Sort descending" / "Trier par ordre décroissant"), `table.clearFilter` ("Clear filter" / "Effacer le filtre"), `table.filterPlaceholder` ("Filter..." / "Filtrer..."), `table.noResults` ("No results found" / "Aucun résultat trouvé"); add enum filter dropdown labels for review `status` values, scan `mode` values, and enrichment `status` values — verify strings appear in the column filter UI in both locales
- [x] T092 [US9] End-to-end verification for US-9: navigate to each admin table page (Users, Review Items, Scan Decisions, Scan History, Enrichment History, Library Roots); click a column header to confirm ascending sort then click again for descending; type a value in a text filter column and confirm rows narrow; navigate to page 2 while filter is active and confirm filter/sort persist; clear the filter and confirm the full list returns
      **Checkpoint**: User Story 9 is complete — all admin data tables support server-side sort, column filters, and paginated navigation.

---

## Phase 15: User Story 10 — Scan Results: Stay in Place After Assignment (Priority: P1)

**Goal**: After assigning a file on the scan results page, the table stays on the same pagination page and scroll position. The assigned row updates in-place via signal. Active filters remain active.
**Independent Test**: Navigate to scan results page, apply a filter, go to page 3, scroll down, assign a file — confirm the page remains on page 3 at the same scroll position with the filter still active and only the assigned row's status updated.

> **Story Dependency**: Requires T087–T088 (US-9 scan-decisions pagination/sort) to be complete first.

- [x] T093 [US10] Update `src/app/features/admin/scan-results/admin-scan-results-page.component.ts`: add `private savedScrollY = 0` property; capture it with `this.savedScrollY = window.scrollY` in the assignment action's pre-submission handler; in the assignment success callback, call `this.items.update(list => list.map(row => row.id === updated.id ? { ...row, ...updated } : row))` to patch only the affected row in-place via signal update (no full reload); after the in-place patch, call `window.scrollTo({ top: this.savedScrollY, behavior: 'instant' })`; keep `tableQuery()` `page` unchanged; if the now-assigned row is excluded by the current status filter, trigger a soft reload of the current page by re-setting `tableQuery` with the preserved page number; auto-decrement page by 1 if the current page becomes empty — verify `npx tsc --noEmit`
- [x] T094 [US10] Update `src/app/features/admin/scan-results/scan-decision-table.component.ts` (or the assignment dialog component): emit an `(itemAssigned)` output carrying the complete updated `ScanDecision` object after a successful assignment API call; update `src/app/features/admin/scan-results/admin-scan-results-page.component.html` to bind `(itemAssigned)="onItemAssigned($event)"` and implement `onItemAssigned(updated)` to call the in-place signal update and scroll restore from T093 — depends on T093
- [x] T095 [US10] End-to-end verification for US-10: apply a filter, navigate to page 3, scroll down, assign a file — confirm page stays on 3, scroll restores, filter remains active, only the assigned row updates; assign the last item on a page — confirm graceful adjustment stays on same page or moves to the previous page if now empty
      **Checkpoint**: User Story 10 is complete — scan results page preserves position and state after every assignment.

---

## Phase 16: User Story 11 — Scanner: Real-Time Counter Incrementation (Priority: P2)

**Goal**: Scan progress counters ("total discovered", "added", "updated", "needs review") increment at each 4-second polling interval during an active scan rather than remaining at 0 until completion.
**Independent Test**: Start a scan on a library with >10 files; watch the `scan-status` counters — confirm at least one counter is > 0 within the first two polling cycles (~8 seconds).

> **Backend Dependency**: T078 (incremental counter flush in `ScanRunCoordinator`) is the primary fix. The frontend counter binding (`scan.counts.*`) and 4-second polling loop already work correctly.

- [x] T096 [US11] Implement incremental counter flushing in `../MediaHandler.API/MediaHandler.Infrastructure/Services/ScanRunCoordinator.cs`: in the per-file processing loop, increment `scanRun.TotalDiscovered++` for each discovered file; increment `scanRun.Added++`, `scanRun.Updated++`, or `scanRun.NeedsReview++` after each file outcome is determined; flush to DB every 10 files via `if (processedCount % 10 == 0) { await context.SaveChangesAsync(CancellationToken.None); }` — verify `dotnet build`; run a test scan on a library with 20+ files and confirm `GET /api/v1/admin/scan/active` returns non-zero `counts` before the scan finishes
- [x] T097 [US11] Verify `src/app/shared/models/admin-scan.model.ts` `ScanCounts` interface fields (`totalDiscovered`, `added`, `updated`, `needsReview`) match the JSON property names returned by `GET /api/v1/admin/scan/active`; fix any camelCase/PascalCase mismatches by adjusting the frontend model; confirm `src/app/features/admin/scanner/scan-status.component.html` binds to `scan.counts.totalDiscovered`, `scan.counts.added`, `scan.counts.updated`, `scan.counts.needsReview`; run a live scan and verify all four counters update within the first two 4-second polling intervals (~8 seconds)
      **Checkpoint**: User Story 11 is complete — scanner counters increment in real time during active scans.

---

## Phase 17: User Story 12 — Review Item: Multi-Select for Batch Assignment (Priority: P2)

**Goal**: Each review item row has a checkbox; a "Select All" header checkbox selects all rows on the current page; a "Batch Assign" toolbar button opens a media search dialog that assigns all selected items in one operation; a per-item success/failure summary is shown after the batch completes.
**Independent Test**: Select 3 rows via checkboxes — confirm "Batch Assign" button appears in the toolbar; ensure the button is disabled when no items are selected; click "Batch Assign", select a media item, confirm — verify all 3 items show as assigned and a result summary toast appears.

> **Backend Dependency**: Requires T079–T080 (`POST /api/v1/admin/review-items/batch-assign`) to be deployed for full integration.

- [x] T098 [P] [US12] Create `src/app/shared/models/batch-assign.model.ts`: export `interface BatchAssignRequest { reviewItemIds: string[]; targetMediaId: string }`, `interface BatchAssignItemResult { reviewItemId: string; success: boolean; errorMessage?: string }`, and `interface BatchAssignResult { results: BatchAssignItemResult[] }` — verify `npx tsc --noEmit`
- [x] T099 [P] [US12] Update `src/app/features/admin/review/admin-review.service.ts`: add `batchAssign(request: BatchAssignRequest): Observable<ApiResponse<BatchAssignResult>>` method that POSTs `request` to `POST /api/v1/admin/review-items/batch-assign` via `ApiService` or `HttpClient`; use `takeUntilDestroyed()` for subscription cleanup — depends on T080 (backend) and T098 (model); verify `npx tsc --noEmit`
- [x] T100 [US12] Update `src/app/features/admin/review/admin-review-page.component.ts`: add `selectedItems = signal<ReviewItem[]>([])`, `isAnySelected = computed(() => this.selectedItems().length > 0)`, `isBatchDialogVisible = signal(false)`; add `onSelectionChange(items: ReviewItem[])` handler; add `onSelectAll(checked: boolean, allItems: ReviewItem[])` for the header checkbox; add `openBatchAssign()` that sets `isBatchDialogVisible.set(true)`; add `onBatchConfirmed(targetMediaId: string)` that calls `adminReviewService.batchAssign()` and shows a translated toast summary with per-item result counts, then clears selection — depends on T099
- [x] T101 [US12] Create `src/app/features/admin/review/batch-assign-dialog.component.ts` as standalone `@Component({ changeDetection: ChangeDetectionStrategy.OnPush })`: inputs `visible = input<boolean>(false)`, `selectedCount = input<number>(0)`; outputs `confirmed = output<string>()`, `dismissed = output<void>()`; state `searchQuery = signal('')`, `searchResults = signal<{ id: string; title: string; type: string }[]>([])`, `selectedMedia = signal<{ id: string; title: string } | null>(null)`, `isSearching = signal(false)`; debounce `searchQuery` 300 ms then call `GET /api/v1/media?title={query}&pageSize=10` via `ApiService`; `confirm()` emits `selectedMedia()!.id` — depends on T098
- [x] T102 [US12] Create `src/app/features/admin/review/batch-assign-dialog.component.html`: `<p-dialog [visible]="visible()" (onHide)="dismissed.emit()">`; include a text input bound to `searchQuery`; show `searchResults()` as a scrollable list with single-select `<p-listbox>`; show "{{selectedCount()}} items → {{selectedMedia()?.title ?? '...'}}" summary; "Confirm" `<p-button>` disabled when `selectedMedia()` is null; "Cancel" emits `dismissed` — depends on T101
- [x] T103 [P] [US12] Create `src/app/features/admin/review/batch-assign-dialog.component.scss`: scrollable results list (max-height: 300px, overflow-y: auto); selected row highlight; confirm/cancel button row (flex, right-aligned); search input full width — use CSS custom properties from the design token system
- [x] T104 [US12] Update `src/app/features/admin/review/admin-review-page.component.html`: add `<p-checkbox>` in the first column of each row bound to selection; add "Select All" `<p-checkbox>` in the table header; add `@if (isAnySelected()) { <div class="batch-toolbar"> }` above the `<p-table>` with an items-selected count badge + "Batch Assign" `<p-button>`; add `<app-batch-assign-dialog [visible]="isBatchDialogVisible()" [selectedCount]="selectedItems().length" (confirmed)="onBatchConfirmed($event)" (dismissed)="isBatchDialogVisible.set(false)">` at the bottom; add `BatchAssignDialogComponent` to the page component imports — depends on T100–T102
- [x] T105 [P] [US12] Update `src/app/features/admin/review/admin-review-page.component.scss` to style the `.batch-toolbar` (flexbox row, background using `--surface-b` token, padding, border-radius); constrain the checkbox column to 40px max to prevent layout shift
- [x] T106 [US12] Add i18n keys for batch assign to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `admin.review.batchAssign` ("Batch Assign" / "Assignation groupée"), `admin.review.selectAll` ("Select all" / "Tout sélectionner"), `admin.review.selectedCount` ("{{count}} item(s) selected" / "{{count}} élément(s) sélectionné(s)"), `admin.review.batchAssignTitle` ("Assign to media" / "Assigner au média"), `admin.review.searchMedia` ("Search for a film or TV show..." / "Rechercher un film ou une série..."), `admin.review.batchSuccess` ("{{count}} item(s) assigned successfully" / "{{count}} élément(s) assigné(s) avec succès"), `admin.review.batchPartialFail` ("{{success}} succeeded, {{failed}} failed" / "{{success}} réussi(s), {{failed}} échoué(s)") — depends on T104
- [x] T107 [US12] End-to-end verification for US-12: navigate to review items page; confirm each row has a checkbox; select 3 rows — confirm "Batch Assign" toolbar appears; deselect all — confirm toolbar hides; click "Batch Assign", search for a media item, confirm — verify all 3 items show assigned status and a result toast shows counts; test "Select All" header checkbox selects all visible rows
      **Checkpoint**: User Story 12 is complete — multi-select batch assignment is fully functional on the review items page.

---

## Phase 18: User Story 13 — TMDB Enrichment: Detailed Process View (Priority: P2)

**Goal**: While enrichment is running, the enrichment page displays a live detail panel showing each media item's title, folder path, and enrichment status (Pending / In Progress / Completed / Failed). A progress indicator shows "X of Y items enriched". Failed items show an error message. Falls back gracefully to the existing progress bar if the details endpoint is unavailable.
**Independent Test**: Start an enrichment run with multiple items; open the enrichment page; confirm the detail panel shows items with live status; wait one poll cycle (4s) and confirm a status transitions from InProgress → Completed; confirm seasons/episodes counts appear for completed TV shows; stop the API and confirm fallback to minimal progress bar without errors.

> **Backend Note**: `GET /api/v1/admin/enrichment/{runId}/details` already exists. The task is to poll it during an active run and display results in a new frontend component.

- [x] T108 [P] [US13] Update `src/app/shared/models/enrichment.model.ts`: add `type EnrichmentItemStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed'`; add `interface EnrichmentItemDetail { mediaId: string; title: string; folderPath: string; status: EnrichmentItemStatus; errorMessage?: string; seasonsEnriched?: number; episodesEnriched?: number }` and `interface EnrichmentRunDetails { runId: string; totalCount: number; processedCount: number; items: EnrichmentItemDetail[] }` — verify `npx tsc --noEmit`
- [x] T109 [US13] Update `src/app/features/admin/enrichment/admin-enrichment.service.ts`: add `runDetails = signal<EnrichmentRunDetails | null>(null)` ; add `getRunDetails(runId: string): Observable<ApiResponse<EnrichmentRunDetails>>` calling `GET /api/v1/admin/enrichment/{runId}/details`; in the existing active-enrichment polling loop, at each tick call `getRunDetails(activeRun.runId)` and on success call `runDetails.set(response.data)`; on HTTP error or 404, silently keep `runDetails` as null (graceful degradation); stop polling `runDetails` when enrichment completes — depends on T108; use `takeUntilDestroyed()` for the subscription
- [x] T110 [US13] Create `src/app/features/admin/enrichment/enrichment-detail-panel.component.ts` as standalone `@Component({ changeDetection: ChangeDetectionStrategy.OnPush })`: input `details = input<EnrichmentRunDetails | null>(null)`; computed `progressPercent = computed(() => (details()?.totalCount ?? 0) > 0 ? Math.round(details()!.processedCount / details()!.totalCount * 100) : 0)` — depends on T108
- [x] T111 [US13] Create `src/app/features/admin/enrichment/enrichment-detail-panel.component.html`: show `<p-progressBar [value]="progressPercent()">` and a translated "processedCount of totalCount items enriched" label; render a scrollable `<ul>` of `details()?.items ?? []` — each item: status icon (`pi-clock` Pending, `pi pi-spin pi-spinner` InProgress, `pi-check-circle` Completed, `pi-times-circle` Failed), media `title` in bold, `folderPath` in small muted text; for Completed TV shows show seasons/episodes count via Transloco; for Failed items show `errorMessage` in danger color; when `details()` is null render nothing (fallback to parent progress bar) — depends on T110
- [x] T112 [P] [US13] Create `src/app/features/admin/enrichment/enrichment-detail-panel.component.scss`: scrollable item list (max-height: 360px, overflow-y: auto); status icon color utilities (`var(--green-500)` Completed, `var(--orange-400)` InProgress, `var(--red-400)` Failed, `var(--surface-400)` Pending); folder path truncated with ellipsis; item row padding and separator line — use CSS custom properties
- [x] T113 [US13] Update `src/app/features/admin/enrichment/admin-enrichment-page.component.ts`: add `EnrichmentDetailPanelComponent` to the `imports` array; expose `runDetails = this.enrichmentService.runDetails` as a component property — depends on T109 and T110; update `src/app/features/admin/enrichment/admin-enrichment-page.component.html` to add `<app-enrichment-detail-panel [details]="runDetails()">` inside the "enrichment running" section (below or replacing the existing current-item text); the panel renders nothing when `runDetails()` is null so the existing progress bar remains as fallback
- [x] T114 [P] [US13] Add i18n keys for the enrichment detail panel to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `admin.enrichment.detail.progress` ("{{processed}} of {{total}} items enriched" / "{{processed}} sur {{total}} éléments traités"), `admin.enrichment.detail.status.Pending` ("Pending" / "En attente"), `admin.enrichment.detail.status.InProgress` ("In Progress" / "En cours"), `admin.enrichment.detail.status.Completed` ("Completed" / "Terminé"), `admin.enrichment.detail.status.Failed` ("Failed" / "Échoué"), `admin.enrichment.detail.seasonsEnriched` ("{{n}} season(s)" / "{{n}} saison(s)"), `admin.enrichment.detail.episodesEnriched` ("{{n}} episode(s)" / "{{n}} épisode(s)")
- [x] T115 [US13] End-to-end verification for US-13: start an enrichment run with ≥3 media items; open the enrichment page; confirm the detail panel appears with progress bar and item list; wait one polling cycle and confirm an item transitions to Completed with seasons/episodes count; confirm a failed item shows error message in red; stop the API — confirm fallback to minimal progress bar without console errors
      **Checkpoint**: User Story 13 is complete — enrichment runs display a live per-item detail panel with progress and status updates.

---

## Phase 19: User Story 14 — Collection Page: Totals by Type and Completeness (Priority: P2)

**Goal**: The collection stats bar shows an incomplete TV shows count (warning-styled) alongside the existing `totalTvShows`/`totalFilms` stats. Each TV show media card shows an incompleteness badge with a tooltip when `ownedSeasonCount < numberOfSeasons`.
**Independent Test**: View the collection page; confirm the stats bar shows an incomplete TV shows stat when applicable; find a TV show card with missing seasons and confirm the incompleteness badge appears; hover it to see the missing season count; confirm no badge on films or complete TV shows.

> **Backend Dependency**: Requires T081 (`incompleteTvShowCount` in stats DTO) and T082 (`ownedSeasonCount` in media list DTO) for accurate live data.
> **Note**: The collection stats bar already displays `totalTvShows` and `totalFilms` correctly (via the existing `CollectionStatsComponent`). These tasks add the `incompleteTvShowCount` stat item and per-card incompleteness badge.

- [x] T116 [P] [US14] Update `CollectionStats` interface in `src/app/core/api/api-response.model.ts`: add `incompleteTvShowCount: number` field — maps to the new `IncompleteTvShowCount` from T081; also update `src/app/shared/models/media.model.ts` `Media` interface to add `ownedSeasonCount: number | null` — maps to `OwnedSeasonCount` from T082 — verify `npx tsc --noEmit`
- [x] T117 [US14] Update `src/app/features/collection/collection-stats.component.html`: add a new stats bar item rendered `@if (stats()!.incompleteTvShowCount > 0)` showing `stats()!.incompleteTvShowCount` with Transloco key `'collection.stats.incompleteTvShows'` and CSS class `stats-bar__item--warning` (warning color) — depends on T116; verify the new stat item appears when `incompleteTvShowCount > 0` and is absent when 0
- [x] T118 [US14] Update `src/app/features/collection/media-card.component.ts`: add `isIncomplete = computed(() => this.media().type === MediaType.TvShow && this.media().numberOfSeasons != null && (this.media().ownedSeasonCount ?? 0) < this.media().numberOfSeasons!)` and `missingSeasonsCount = computed(() => this.isIncomplete() ? this.media().numberOfSeasons! - (this.media().ownedSeasonCount ?? 0) : 0)` computed signals — depends on T116; verify `npx tsc --noEmit`
- [x] T119 [US14] Update `src/app/features/collection/media-card.component.html`: add `@if (isIncomplete()) { <span class="media-card__incomplete-badge" [pTooltip]="t('media.incomplete.tooltip', { count: missingSeasonsCount() })" tooltipPosition="top" [attr.aria-label]="t('media.incomplete.label')"><i class="pi pi-exclamation-circle"></i></span> }` as an overlay badge on the TV show poster — depends on T118
- [x] T120 [P] [US14] Update `src/app/features/collection/collection-stats.component.scss` to add `.stats-bar__item--warning { color: var(--yellow-500); }` (or whichever warning token exists); update `src/app/features/collection/media-card.component.scss` to style `.media-card__incomplete-badge` as an absolute-positioned top-right overlay with warning-color icon and slight background — use CSS custom properties
- [x] T121 [P] [US14] Add i18n keys to `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `collection.stats.incompleteTvShows` ("{{count}} incomplete show(s)" / "{{count}} série(s) incomplète(s)"), `media.incomplete.label` ("Incomplete TV show" / "Série incomplète"), `media.incomplete.tooltip` ("Missing {{count}} season(s)" / "{{count}} saison(s) manquante(s)") — depends on T119; verify tooltip renders the correct missing season count in both locales
- [x] T122 [US14] End-to-end verification for US-14: navigate to the collection page; confirm stats bar shows `totalTvShows` and `totalFilms` (already present); confirm `incompleteTvShowCount` stat item appears in warning color when applicable; find a TV show with `ownedSeasonCount < numberOfSeasons` and confirm the incompleteness badge is visible on its card; hover the badge and confirm the missing season count tooltip shows; confirm no badge on films or complete TV shows
      **Checkpoint**: User Story 14 is complete — collection page shows TV/film breakdown plus per-card incompleteness indicators.

---

## Phase 20: User Story 15 — File Location Quick Access (Priority: P3)

**Goal**: File paths on the media detail page are already displayed via `MediaFilesComponent` with per-file clipboard copy buttons. The remaining gaps are: (a) `ClipboardService` toast messages use raw i18n key strings instead of translated text, and (b) when clipboard access is denied, there is no fallback for manual copying.
**Independent Test**: Click a file copy button on the media detail page — confirm the success toast shows translated text (not a raw key); block clipboard permission in DevTools and click copy — confirm a selectable fallback textarea appears with the path; view a media item with no files — confirm "no files" message appears, no copy buttons shown.

> **Note**: `MediaFilesComponent` is already fully integrated in `media-detail-page.component.html` showing all file paths with copy buttons. `ClipboardService` already emits toast messages but passes raw key strings instead of translated text.

- [x] T123 [US15] Fix `src/app/core/services/clipboard.service.ts`: inject `TranslocoService` via `inject(TranslocoService)`; replace `summary: 'common.pathCopied'` with `summary: this.translocoService.translate('common.pathCopied')` and `summary: 'common.copyFailed'` with `summary: this.translocoService.translate('common.copyFailed')` so toast messages show translated strings — verify `npx tsc --noEmit` and confirm the success toast shows "Path copied!" in EN and the translated text in FR
- [x] T124 [US15] Update `src/app/features/media-detail/media-files.component.ts`: add `fallbackPaths = signal<Record<string, boolean>>({})` to track which paths are showing the fallback textarea; in `copyPath(path)`, on clipboard rejection additionally call `this.fallbackPaths.update(m => ({ ...m, [path]: true }))`; add `clearFallback(path: string)` that removes the entry; update `src/app/features/media-detail/media-files.component.html` to add `@if (fallbackPaths()[file.filePath]) { <textarea readonly [value]="file.filePath" class="media-files__fallback-textarea" [attr.aria-label]="'media.files.copyFallback' | transloco"></textarea><p-button icon="pi pi-times" size="small" variant="text" (onClick)="clearFallback(file.filePath)"> }` below each file's copy button — depends on T123; verify `npx tsc --noEmit`
- [x] T125 [P] [US15] Ensure all required i18n keys are present in `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`: `common.pathCopied` ("Path copied!" / "Chemin copié !"), `common.copyFailed` ("Copy failed" / "Échec de la copie"), `media.files.copyFallback` ("Clipboard access denied — copy the path manually:" / "Accès au presse-papiers refusé — copiez le chemin manuellement :") — add any that are missing; verify both EN and FR toast messages appear translated
- [x] T126 [US15] End-to-end verification for US-15: navigate to a media detail page with associated files; click a copy button — confirm the success toast shows translated text (e.g. "Path copied!") not a raw key string; block clipboard permission in DevTools → click copy — confirm an error toast AND a fallback textarea appear; confirm the textarea can be dismissed; navigate to a media item with no files — confirm "no files" message appears and no copy buttons or fallback textareas are shown
      **Checkpoint**: User Story 15 is complete — file location clipboard copy shows translated feedback toasts and provides a fallback textarea for manual copying when clipboard access is denied.

---

## Phase 13–20: Additional Dependencies & Execution Order

### New Phase Dependencies

- **Phase 13 (Backend Foundational)**: Depends on Phase 1 only — can run in parallel with all frontend work; **BLOCKS US-9 sort/filter, US-11 live counters, US-12 batch assign, US-14 completeness** for live-API testing
- **US-9 Frontend (Phase 14)**: Can start after Phase 1; full server-side testing requires T072–T077; existing pagination infrastructure already in place
- **US-10 (Phase 15)**: Requires US-9 scan-decisions pagination (T087–T088) to be complete first
- **US-11 (Phase 16)**: T096 (backend) can start with Phase 13; T097 (frontend verify) can run immediately — frontend counter binding already correct
- **US-12 (Phase 17)**: Frontend (T098–T107) can start after Phase 1; batch-assign calls require T079–T080 for integration
- **US-13 (Phase 18)**: Pure frontend change — can start and deploy independently; backend details endpoint already exists
- **US-14 (Phase 19)**: T116 (models) can start after Phase 1; stats bar TV/film counts already working; incompleteness requires T081–T082 (backend) for accurate data
- **US-15 (Phase 20)**: Pure frontend fix — fully independent of all other stories

### New User Story Dependencies

| Story                           | Priority | Depends On                             | Can Parallelize With             |
| ------------------------------- | -------- | -------------------------------------- | -------------------------------- |
| US-9 — Table Sort/Filter        | P1       | Phase 13 backend for live testing      | US-10, US-11, US-12, US-15       |
| US-10 — Scan Results Position   | P1       | US-9 scan-decisions (T087–T088)        | US-11, US-12, US-13, US-14       |
| US-11 — Real-Time Counters      | P2       | T078 (backend counter flush)           | US-9, US-12, US-13, US-14, US-15 |
| US-12 — Batch Assignment        | P2       | T079–T080 (backend endpoint)           | US-9, US-11, US-13, US-14, US-15 |
| US-13 — Enrichment Detail       | P2       | Phase 1 only (backend endpoint exists) | All other stories                |
| US-14 — Collection Completeness | P2       | T081–T082 (backend DTO fields)         | US-9, US-11, US-12, US-13, US-15 |
| US-15 — File Location           | P3       | Phase 1 only                           | All other stories                |

### Parallel Execution Examples (Phases 13–20)

**Phase 13 (Backend) — Parallel opportunities**

```
Can run simultaneously (all target separate query/controller files):
  T072 — GetUsersQuery sort params
  T073 — ListReviewItemsQuery sort + fileName filter
  T074 — ListScanHistoryQuery sort params
  T075 — ListScanDecisionsQuery sort + fileName filter
  T076 — ListEnrichmentHistoryQuery sort params
  T077 — ListLibraryRootsQuery sort + path filter
  T078 — ScanRunCoordinator incremental counter flush
  T079 — BatchAssignReviewItemsCommand + handler
  T081 — MediaStatsDto incompleteTvShowCount
  T082 — MediaListItemDto ownedSeasonCount
Sequential:
  T080 — depends on T079 (endpoint dispatches the new command)
```

**Phase 14 (US-9 Frontend) — Parallel opportunities**

```
Can run simultaneously (separate service files):
  T083 — admin-user.service.ts
  T085 — admin-review.service.ts
  T087 — admin-scan.service.ts + admin-scan-decision.service.ts
  T089 — admin-enrichment.service.ts
  T090 — admin-library-root.service.ts
  T091 — i18n keys (en.json + fr.json)
Then sequentially (each component depends on its service):
  T084 — users page TS + template (after T083)
  T086 — review page TS + template (after T085)
  T088 — scan-history + scan-results TS + templates (after T087)
Sequential at end:
  T092 — verification (after all component updates)
```

**Phase 17 (US-12) — Parallel opportunities**

```
Can start simultaneously:
  T098 — batch-assign.model.ts
  T103 — batch-assign-dialog.component.scss
Sequential:
  T099 — after T098 (service uses model)
  T100 — after T099 (component wires service)
  T101 → T102 — dialog .ts then .html
  T104 — after T100–T102 (page template wires dialog)
  T105 — after T104 (page SCSS follows layout)
  T106 — after T104 (i18n keys referenced in template)
  T107 — verification last
```

**Phase 18 (US-13) — Parallel opportunities**

```
Can start simultaneously after T108:
  T109 — service polling update
  T112 — enrichment-detail-panel.component.scss
Sequential after T108:
  T110 → T111 — panel .ts then .html
  T113 — page component wires panel (after T109 + T110)
  T114 — i18n keys (can run alongside T110–T113)
  T115 — verification last
```

---

## Incremental Delivery (Sprints 7–12)

| Sprint | Phases                                | Deliverable                                             |
| ------ | ------------------------------------- | ------------------------------------------------------- |
| 7      | Phase 13 (backend) + Phase 16 (US-11) | Sort/filter backend ready; scan counters increment live |
| 8      | Phase 14 (US-9 frontend)              | All admin tables sortable + filterable                  |
| 9      | Phase 15 (US-10)                      | Scan results position retained after assignment         |
| 10     | Phase 17 (US-12)                      | Batch review item assignment                            |
| 11     | Phase 18 (US-13) + Phase 20 (US-15)   | Enrichment detail panel; file location quick access     |
| 12     | Phase 19 (US-14)                      | Collection completeness stats + per-card badges         |
