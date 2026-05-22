# Tasks: Media File Linking & Missing Content Detection

**Input**: Design documents from `specs/007-media-file-linking/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api-contracts.md ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Tests are included per the project constitution (≥80% statement coverage mandatory)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the new domain column and shared types that all user stories depend on.

- [ ] T001 Add `RootFolder string?` property to `MediaHandler.Domain/Entities/Media.cs`
- [ ] T002 Map `root_folder` column in `MediaHandler.Infrastructure/Persistence/Configurations/MediaConfiguration.cs`
- [ ] T003 Generate and apply EF Core migration `AddMediaRootFolder` in `MediaHandler.Infrastructure/Persistence/Migrations/`
- [ ] T004 [P] Add `RootFolder string?` field to `MediaHandler.Application/Features/Media/DTOs/MediaDto.cs` record
- [ ] T005 [P] Add `SeasonCompletenessDto` record to `MediaHandler.Application/Features/Media/DTOs/SeasonCompletenessDto.cs`
- [ ] T006 [P] Add `UnlinkedFileDto` record to `MediaHandler.Application/Features/Files/Queries/GetUnlinkedFiles/UnlinkedFileDto.cs`
- [x] T007 [P] Update `src/app/shared/models/media.model.ts` — add `rootFolder: string | null` to `Media` interface and add `SeasonCompleteness` + `UnlinkedFile` interfaces
- [x] T008 [P] Create `AdminMediaFileLinkService` skeleton (signals + method stubs) in `src/app/core/services/admin-media-file-link.service.ts`

**Checkpoint**: Domain column exists in DB; all DTOs and frontend interfaces defined; service skeleton ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend handlers and controller structure that all user-story phases depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Create `AdminMediaFilesController.cs` skeleton with `[ApiController]`, `[Route("api/v1/admin/media")]`, `[Authorize(Policy = "AdminOnly")]` and `[EnableRateLimiting("fixed")]` in `MediaHandler.API/Controllers/AdminMediaFilesController.cs`
- [ ] T010 [P] Update `MediaHandler.Application/Features/Media/Queries/GetMediaById/GetMediaByIdQueryHandler.cs` to compute `effectiveRootFolder` (stored override ?? common parent of linked file paths) and populate `MediaDto.RootFolder`

**Checkpoint**: Foundation ready; all user story phases can start.

---

## Phase 3: User Story 1 — Media File Linking from Detail Page (Priority: P1) 🎯 MVP

**Goal**: Admin can link unlinked `MediaFile` records to a `Media` item from its detail page and unlink existing files.

**Independent Test**: Navigate to a TV show detail page as admin. Confirm "Unlink" button visible per file. Open link picker dialog, select an unlinked file, link it, verify it appears in the list. Unlink it, verify it disappears. As non-admin user, verify no link/unlink controls appear.

### Backend — US1

- [ ] T011 [P] [US1] Create `GetUnlinkedFilesQueryHandler.cs` that returns paginated `MediaFile` where `MediaId IS NULL` in `MediaHandler.Application/Features/Files/Queries/GetUnlinkedFiles/GetUnlinkedFilesQueryHandler.cs`
- [ ] T012 [P] [US1] Create `LinkMediaFileCommandHandler.cs` — set `MediaFile.MediaId = mediaId`; return `FILE_ALREADY_LINKED` 422 if file is already linked to another media in `MediaHandler.Application/Features/Media/Commands/LinkMediaFile/LinkMediaFileCommandHandler.cs`
- [ ] T013 [P] [US1] Create `UnlinkMediaFileCommandHandler.cs` — set `MediaFile.MediaId = null`; return 404 if file not found or not linked to this media in `MediaHandler.Application/Features/Media/Commands/UnlinkMediaFile/UnlinkMediaFileCommandHandler.cs`
- [ ] T014 [US1] Add three endpoints to `AdminMediaFilesController.cs`: `GET /admin/media/unlinked-files` (paginated), `PUT /admin/media/{mediaId}/files/{fileId}/link`, `DELETE /admin/media/{mediaId}/files/{fileId}/link` per `contracts/api-contracts.md`

### Frontend — US1

- [x] T015 [US1] Implement `getUnlinkedFiles(page, pageSize)`, `linkFile(mediaId, fileId)`, `unlinkFile(mediaId, fileId)` in `src/app/core/services/admin-media-file-link.service.ts`
- [x] T016 [P] [US1] Create `FileLinkPickerDialogComponent` with `p-dialog` + paginated `p-table` of unlinked files, "Link" button per row, `visible` input signal in `src/app/features/media-detail/file-link-picker-dialog.component.ts` + `.html` + `.scss`
- [x] T017 [US1] Update `MediaDetailService` — add `linkFile(mediaId, fileId)` and `unlinkFile(mediaId, fileId)` methods that call `AdminMediaFileLinkService` then refresh `loadMedia()` in `src/app/features/media-detail/media-detail.service.ts`
- [x] T018 [US1] Update `MediaFilesComponent` — add "Unlink" button per file (visible only when `isAdmin` signal is true) and "Link File" button that emits event to open picker dialog in `src/app/features/media-detail/media-files.component.ts` + `.html`
- [x] T019 [US1] Update `MediaDetailPageComponent` — inject `AuthService`, add `isAdmin` computed signal, add `FileLinkPickerDialogComponent`, wire open/close link picker dialog and link/unlink actions in `src/app/features/media-detail/media-detail-page.component.ts`

### Tests — US1

- [x] T020 [P] [US1] Write unit tests for `AdminMediaFileLinkService.linkFile()`, `unlinkFile()`, `getUnlinkedFiles()` in `src/app/core/services/admin-media-file-link.service.spec.ts`
- [x] T021 [P] [US1] Write unit tests for `FileLinkPickerDialogComponent` — renders file list, emits link event on button click, shows empty state in `src/app/features/media-detail/file-link-picker-dialog.component.spec.ts`
- [ ] T022 [P] [US1] Write xUnit tests for `GetUnlinkedFilesQueryHandler`, `LinkMediaFileCommandHandler`, `UnlinkMediaFileCommandHandler` in `MediaHandler.Tests/Features/Media/FileLinkCommandHandlerTests.cs`

**Checkpoint**: US1 fully functional and testable — admin can link/unlink files from the detail page.

---

## Phase 4: User Story 2 — Root Folder Association & File Explorer Access (Priority: P1)

**Goal**: Each media detail page shows the root folder path (auto-derived or manually set) with a copy-to-clipboard action and an inline edit for admin users.

**Independent Test**: View a film and a TV show as admin. Confirm root folder auto-derived from linked files' common parent. Click "Open in explorer" → path copied to clipboard (toast shown). Block clipboard → fallback text field appears. Edit root folder, save, reload → persists. Clear override → auto-derived path returns.

### Backend — US2

- [ ] T023 [US2] Create `UpdateMediaRootFolderCommandHandler.cs` — sets/clears `Media.RootFolder`; saves via EF Core in `MediaHandler.Application/Features/Media/Commands/UpdateMediaRootFolder/UpdateMediaRootFolderCommandHandler.cs`
- [ ] T024 [US2] Add `PATCH /admin/media/{mediaId}/root-folder` endpoint to `AdminMediaFilesController.cs` per `contracts/api-contracts.md`

### Frontend — US2

- [x] T025 [US2] Implement `updateRootFolder(mediaId, rootFolder)` in `src/app/core/services/admin-media-file-link.service.ts`
- [x] T026 [P] [US2] Create `RootFolderComponent` — displays effective root folder, "Open in explorer" clipboard button with `ClipboardService` fallback textarea, inline edit input + save button (admin-only) in `src/app/features/media-detail/root-folder.component.ts` + `.html` + `.scss`
- [x] T027 [US2] Update `MediaDetailService` — add `updateRootFolder(mediaId, path)` method that calls `AdminMediaFileLinkService.updateRootFolder()` then refreshes `loadMedia()` in `src/app/features/media-detail/media-detail.service.ts`
- [x] T028 [US2] Update `MediaDetailPageComponent` — add `<app-root-folder>` after the media header, pass `media()?.rootFolder` and `mediaId()`, wire save action in `src/app/features/media-detail/media-detail-page.component.ts`

### Tests — US2

- [x] T029 [P] [US2] Write unit tests for `RootFolderComponent` — displays path, emits copy action, shows edit input for admin, shows empty state when null in `src/app/features/media-detail/root-folder.component.spec.ts`
- [ ] T030 [P] [US2] Write xUnit tests for `UpdateMediaRootFolderCommandHandler` — sets path, clears path (null input), returns 404 for unknown media in `MediaHandler.Tests/Features/Media/UpdateMediaRootFolderCommandHandlerTests.cs`

**Checkpoint**: US2 fully functional — root folder displayed and editable in detail page.

---

## Phase 5: User Story 3 — Missing Episodes & Seasons Detection (Priority: P1)

**Goal**: TV show detail pages display a "Completeness" section listing owned vs. expected episodes per season (season 1+), with specific missing episode numbers listed.

**Independent Test**: View a TV show with 3 seasons on TMDB, only 2 seasons of files linked. Confirm season 0 absent. Confirm seasons 1–2 show owned count. Confirm season 3 shows "0 / N episodes". Confirm a fully owned season shows ✅ complete badge. View a film — no completeness section present.

### Backend — US3

- [ ] T031 [US3] Create `GetMediaCompletenessQueryHandler.cs` — queries `TvSeasons` + `TvEpisodes` + `EpisodeFileLinks` for the given `mediaId`, excludes `SeasonNumber == 0` and seasons named "Specials", returns `IReadOnlyList<SeasonCompletenessDto>` per `data-model.md` derivation logic in `MediaHandler.Application/Features/Media/Queries/GetMediaCompleteness/GetMediaCompletenessQueryHandler.cs`
- [ ] T032 [US3] Add `GET /media/{id}/completeness` endpoint to `MediaController.cs` — returns 400 for Film type, 200 with completeness list for TvShow, empty array if no TvSeason data in `MediaHandler.API/Controllers/MediaController.cs`

### Frontend — US3

- [x] T033 [P] [US3] Create `SeasonCompletenessComponent` — displays completeness list for TV shows, season rows with owned/total counts, missing episode numbers, complete badge, "Metadata not available" empty state in `src/app/features/media-detail/season-completeness.component.ts` + `.html` + `.scss`
- [x] T034 [US3] Update `MediaDetailService` — add `completeness = signal<SeasonCompleteness[]>([])`, `completenessLoading`, `completenessError` signals and `loadCompleteness(mediaId)` method (called from `loadMedia()` when type is TvShow) in `src/app/features/media-detail/media-detail.service.ts`
- [x] T035 [US3] Update `MediaDetailPageComponent` — add `<app-season-completeness>` below the season list (TV shows only), pass `completeness()` and `completenessLoading()` signals in `src/app/features/media-detail/media-detail-page.component.ts`

### Tests — US3

- [ ] T036 [P] [US3] Write xUnit tests for `GetMediaCompletenessQueryHandler` — season 0 excluded, specials excluded, missing episodes correctly computed, empty list when no TvSeasons, 400 for Film in `MediaHandler.Tests/Features/Media/GetMediaCompletenessQueryHandlerTests.cs`
- [x] T037 [P] [US3] Write unit tests for `SeasonCompletenessComponent` — renders seasons, shows complete badge, lists missing episode numbers, shows empty state, hidden for films in `src/app/features/media-detail/season-completeness.component.spec.ts`

**Checkpoint**: US3 fully functional — completeness panel visible on all enriched TV show detail pages.

---

## Phase 6: User Story 4 — Parent-Folder Filter Label Clarification (Priority: P2)

**Goal**: The "Assigned" filter label on the parent folders page is renamed to "TMDB Assigned (Pending Import)" to unambiguously signal that selected entries are awaiting collection import.

**Independent Test**: Navigate to Admin → Parent Folders. Open the status filter dropdown. Confirm "TMDB Assigned (Pending Import)" appears (EN) and "TMDB assigné (import en attente)" (FR). Select it — only folders with `status=Assigned` (not `InCollection`) are shown.

- [x] T038 [P] [US4] Update `src/assets/i18n/en.json` — change `admin.parentFolders.statusAssigned` from `"Assigned"` to `"TMDB Assigned (Pending Import)"`
- [x] T039 [P] [US4] Update `src/assets/i18n/fr.json` — change `admin.parentFolders.statusAssigned` from `"Assigné"` to `"TMDB assigné (import en attente)"`

**Checkpoint**: US4 complete — filter label clarified, no backend or logic change needed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: i18n completeness, bundle validation, and end-to-end quickstart verification.

- [x] T040 [P] Add all new `mediaDetail.*` i18n keys (file linking section, root folder section, completeness section labels) to `src/assets/i18n/en.json`
- [x] T041 [P] Add all new `mediaDetail.*` i18n keys (French translations) to `src/assets/i18n/fr.json`
- [x] T042 [P] Run `ng build --configuration production` and confirm bundle sizes stay within `angular.json` budget limits (initial ≤500 kB warning / 1 MB error)
- [ ] T043 Run the full quickstart.md verification checklist for all 4 user stories — confirm all checkboxes pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001–T003 must complete sequentially (domain → config → migration). T004–T008 can run in parallel after T001.
- **Phase 2 (Foundational)**: Depends on Phase 1. T009–T010 can run in parallel after Phase 1.
- **Phase 3 (US1)**: Depends on Phase 2 completion. Backend tasks T011–T014 and frontend tasks T015–T019 can largely run in parallel across back/front.
- **Phase 4 (US2)**: Depends on Phase 2 (and T009 for controller). T023–T024 depend on T009.
- **Phase 5 (US3)**: Depends on Phase 2. Independent from US1 and US2.
- **Phase 6 (US4)**: Fully independent — can start any time after Phase 1.
- **Phase 7 (Polish)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2, US3, US4.
- **US2 (P1)**: After Phase 2 — depends on T009 (controller skeleton). Can run in parallel with US1.
- **US3 (P1)**: After Phase 2 — fully independent of US1 and US2.
- **US4 (P2)**: After Phase 1 — fully independent, only i18n files touched.

### Within Each User Story

- Backend commands/queries (marked [P]) → controller endpoint → frontend service → component → page integration
- Tests can be written in parallel with implementation (same user story, different files)

---

## Parallel Example: US1 Backend

```
Parallel (different files, no dependencies on each other):
  T011 — GetUnlinkedFilesQueryHandler.cs
  T012 — LinkMediaFileCommandHandler.cs
  T013 — UnlinkMediaFileCommandHandler.cs

Then (depends on all three):
  T014 — AdminMediaFilesController.cs endpoints
```

## Parallel Example: US3

```
Parallel (backend + frontend simultaneously):
  T031 — GetMediaCompletenessQueryHandler.cs
  T033 — SeasonCompletenessComponent (frontend)

Then sequentially:
  T032 — MediaController completeness endpoint  (depends on T031)
  T034 — MediaDetailService.loadCompleteness()  (depends on T033 interface)
  T035 — MediaDetailPageComponent integration   (depends on T033, T034)
```

---

## Implementation Strategy

### MVP First (US1 Only — File Linking)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1)
4. **STOP and VALIDATE**: Admin can link/unlink files from detail page
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → File linking from detail page ✅
3. Phase 4 (US2) → Root folder display + clipboard ✅
4. Phase 5 (US3) → Season completeness panel ✅
5. Phase 6 (US4) → Filter label clarification ✅ (can be done any time)
6. Phase 7 → Polish + validation ✅

### Parallel Team Strategy

With two developers after Phase 2 completes:

- **Dev A**: US1 (T011→T022) — file linking
- **Dev B**: US3 (T031→T037) — completeness (fully independent)
- **Dev A or B**: US2 (T023→T030) after US1 backend controller exists
- US4 (T038–T039) can be done by either dev at any point

---

## Notes

- All new Angular components: `ChangeDetectionStrategy.OnPush` mandatory (constitution)
- All new Angular components: standalone, no NgModules (constitution)
- State management: `signal()` only; no `BehaviorSubject` (constitution)
- Streams: `toSignal()` or `takeUntilDestroyed(destroyRef)` — no manual `unsubscribe()` (constitution)
- No new third-party npm packages — PrimeNG dialog/table already bundled
- EF migration (T003) must be applied before any backend endpoint test
- Backend xUnit tests (T022, T030, T036) are companion changes in `MediaHandler.API` repo
