# Technical Design: Kodi DB Import — Admin UI (Frontend)

**Spec**: `specs/008-kodi-db-import/spec.md` (validated; US6 per-upload overrides **deferred**, outcome rows with `mediaId` navigate to media detail, unmatched prefixes offer pre-filled "create mapping").
**Backend contract (fixed)**: `MediaHandler.API/specs/008-kodi-db-import/plan.md` §1.8/§1.10. Zero backend changes.
**Patterns reused 1:1**: `features/admin/scanner` (launch + active-run polling + paged history), `features/admin/scan-results` (paged/filterable item list), `features/admin/library-roots` (CRUD list + dialog + confirmed delete).

---

## 1. Summary

Add a new admin feature folder `features/admin/kodi-import/` with two lazy-routed pages: the main **Kodi Import** page (upload launcher, active-run panel with 4 s polling, paged run history, path-mapping CRUD section) and a **Run Report** page (`/admin/kodi-import/:runId`) showing the run header, all 15 counters, unmatched prefixes with a pre-filled create-mapping action, and a paged/filterable item-outcome table. State lives in two `providedIn: 'root'` signal services (`AdminKodiImportService`, `AdminKodiPathMappingService`) mirroring the scanner/library-roots services; a new `upload()` method on `ApiService` handles the multipart POST (fixing the profile-service precedent of injecting `HttpClient` in feature code). Upload rejections, 409, 404 and 422 are surfaced as inline code-specific translated messages by extending the error interceptor's silent-rule mechanism to match URL substrings.

---

## 2. Changes by area

### 2.1 Core

**`src/app/core/api/api.service.ts`** (modify) — add multipart support so feature code never touches `HttpClient`:

```typescript
upload<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
  return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, formData);
}
```

**`src/app/core/api/error.interceptor.ts`** (modify) — extend `SILENT_ERRORS` rules with an optional `urlIncludes` matcher (keep `urlSuffix` for the existing `/auth/me` entry), and add one rule:

```typescript
const SILENT_ERRORS: Array<{ urlSuffix?: string; urlIncludes?: string; statuses: number[] }> = [
  { urlSuffix: '/auth/me', statuses: [404] },
  // Kodi Import surfaces all of these inline (upload errors, 409, run-not-found, duplicate mapping).
  { urlIncludes: '/admin/kodi-import', statuses: [400, 404, 409, 422] },
];
```

Match logic: a rule is silent when `statuses` includes the error status AND (`urlSuffix` matches via `endsWith` OR `urlIncludes` matches via `includes`). This covers `PUT/DELETE …/path-mappings/{id}` (which `endsWith` cannot). All other statuses (401/403/500/network) keep the global translated toast.

### 2.2 Shared

**`src/app/shared/models/enums.ts`** (modify) — append string-valued enums mirroring the backend JSON:

```typescript
export enum KodiImportMode {
  Import = 'Import',
  Preview = 'Preview',
}
export enum ImportRunStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
}
export enum KodiItemKind {
  Movie = 'Movie',
  TvShow = 'TvShow',
  Episode = 'Episode',
  MusicVideo = 'MusicVideo',
}
export enum ImportItemStatus {
  Created = 'Created',
  Reused = 'Reused',
  Unchanged = 'Unchanged',
  NeedsReview = 'NeedsReview',
  RequiresIdentityLookup = 'RequiresIdentityLookup',
  IdentityLookupFailed = 'IdentityLookupFailed',
  Conflict = 'Conflict',
  SkippedMusicVideo = 'SkippedMusicVideo',
  NoLongerInKodi = 'NoLongerInKodi',
}
export enum ImportLinkStatus {
  Linked = 'Linked',
  AlreadyLinked = 'AlreadyLinked',
  PartiallyLinked = 'PartiallyLinked',
  UnmatchedPath = 'UnmatchedPath',
  NoScannedFile = 'NoScannedFile',
  UnsupportedLocation = 'UnsupportedLocation',
  Conflict = 'Conflict',
}
```

(`MediaType` already exists — reused for `mediaKind`.)

**`src/app/shared/models/kodi-import.model.ts`** (new) — mirror of backend DTOs:

```typescript
export interface ImportCounts {
  totalItems: number;
  moviesCreated: number;
  showsCreated: number;
  episodesCreated: number;
  itemsReused: number;
  itemsUnchanged: number;
  filesLinked: number;
  unmatchedPaths: number;
  noScannedFiles: number;
  unsupportedLocations: number;
  conflicts: number;
  noLongerInKodi: number;
  needsReview: number;
  identityLookupFailures: number;
  skippedMusicVideos: number;
}
export interface ImportRun {
  id: string;
  mode: KodiImportMode;
  status: ImportRunStatus;
  sourceFileName: string;
  schemaVersion: number;
  startedAt: string;
  finishedAt: string | null;
  failureReason: string | null;
  counts: ImportCounts;
}
export interface ImportRunDetail extends ImportRun {
  unmatchedPrefixes: string[];
}
export interface ImportItemOutcome {
  id: string;
  itemKind: KodiItemKind;
  kodiItemId: number;
  title: string;
  mediaKind: MediaType | null;
  outcome: ImportItemStatus;
  linkOutcome: ImportLinkStatus | null;
  linkedFileCount: number;
  reason: string | null;
  kodiPathPrefix: string | null;
  mediaId: string | null;
}
export interface KodiPathMapping {
  id: string;
  kodiPrefix: string;
  nasPrefix: string;
  sortOrder: number;
}
```

### 2.3 Feature: `src/app/features/admin/kodi-import/` (new folder)

All components: standalone, `OnPush`, separate `.html`/`.scss`, `inject()`, signal inputs/outputs, `TranslocoModule` + per-component PrimeNG imports, `LocaleDatePipe` for timestamps (same as scanner).

#### `admin-kodi-import.service.ts` — `AdminKodiImportService` (`providedIn: 'root'`)

Mirrors `AdminScanService` structure (interval(4000) + `switchMap` + `stopPolling$` Subject + `takeUntilDestroyed`).

Signals:

- `activeRun = signal<ImportRun | null>(null)`
- `history = signal<ImportRun[]>([])`, `historyMeta = signal({ page: 1, pageSize: 20, total: 0 })`, `historyLoading = signal(false)`, `historyError = signal(false)` (inline retry state)
- `uploading = signal(false)`
- `uploadErrorCode = signal<string | null>(null)`, `uploadErrorMessage = signal<string | null>(null)` (server `errors[0].message`, used as interpolation detail for e.g. detected version / size limit)
- `pollingError = signal(false)` — recoverable warning; polling continues, cleared on next success
- `report = signal<ImportRunDetail | null>(null)`, `reportLoading = signal(false)`, `reportNotFound = signal(false)`, `reportError = signal(false)`
- `items = signal<ImportItemOutcome[]>([])`, `itemsMeta = signal({ page: 1, pageSize: 50, total: 0 })`, `itemsLoading = signal(false)`, `itemsError = signal(false)`
- Computed: `isRunActive = computed(() => activeRun() is Pending|Running)`

Methods:

- `uploadDatabase(file: File, mode: KodiImportMode): void` — builds `FormData` with `file` and `mode` (`mode.toLowerCase()` → `"import"|"preview"` per API contract), calls `api.upload<ImportRun>('admin/kodi-import', formData)`. On 202: clear upload error, set `activeRun`, begin polling. On error: read `err.error?.errors?.[0]?.code ?? 'UNKNOWN'` and `.message`, set `uploadErrorCode`/`uploadErrorMessage`, `uploading.set(false)`. Never double-submits (guarded by `uploading`).
- `clearUploadError(): void`
- `getActiveRun(): void` — `GET admin/kodi-import/active`; sets `activeRun`, begins polling if Pending/Running (page-reload recovery, FR-009).
- `getHistory(page, pageSize): void` — `GET admin/kodi-import` with params; sets history + meta; on error sets `historyError` (keeps current list).
- `getRunDetail(id): void` — `GET admin/kodi-import/{id}`; sets `report`; 404 → `reportNotFound.set(true)`; other error → `reportError.set(true)`.
- `getItems(runId, outcome?, kind?, page, pageSize): void` — `GET admin/kodi-import/{id}/items` (only non-undefined params sent); stores current filter/page for refresh; error → `itemsError`.
- `beginReportPolling(runId): void` / report polling stops on terminal status — used by the report page for live updates of a still-running run; on terminal transition also refreshes items page 1 and history.
- `private beginPolling(): void` — 4 s interval on `GET admin/kodi-import/active`; on `null` or terminal status: stop polling, clear `pollingError`, refresh history at current page. On poll error: `pollingError.set(true)` (interval keeps running; `catchError(() => of(null))` inside the pipe so the stream survives).

Constants: `TERMINAL_STATES = [Completed, Failed]`, `ACTIVE_STATES = [Pending, Running]`, `API_URL = 'admin/kodi-import'`.

#### `admin-kodi-path-mapping.service.ts` — `AdminKodiPathMappingService` (`providedIn: 'root'`)

Mirrors `AdminLibraryRootService`.

- Signals: `mappings = signal<KodiPathMapping[]>([])`, `loading`, `saving = signal(false)`, `saveErrorCode = signal<string | null>(null)` (`'DUPLICATE_MAPPING' | 'VALIDATION_ERROR' | 'UNKNOWN'`).
- `loadMappings(): void` — `GET admin/kodi-import/path-mappings` (unpaged, already ordered by `sortOrder`).
- `create(kodiPrefix, nasPrefix, sortOrder?): void` — POST body `{ kodiPrefix, nasPrefix, sortOrder? }`; on success refresh list in place + success toast (via `MessageService` in component, per library-roots pattern); on 422 set `saveErrorCode` (dialog stays open, inline message).
- `update(id, kodiPrefix, nasPrefix, sortOrder): void` — PUT; same error handling.
- `remove(id): void` — DELETE; refresh list.
- `clearSaveError(): void`.

#### `admin-kodi-import-page.component.ts` — `AdminKodiImportPageComponent`

Selector `app-admin-kodi-import-page`. Composes the four sections in one column (spacing via PrimeFlex):

1. `<app-kodi-import-launcher>` — always rendered; internally disabled while `isRunActive()` or `uploading()`.
2. `<app-kodi-import-status>` — active-run panel (idle empty state when no active run).
3. `<app-kodi-import-history-table>`.
4. `<app-kodi-import-mappings>`.

`ngOnInit`: `service.getActiveRun()` and `service.getHistory(1, 20)`. Route `data` not needed (parent `/admin` already carries the animation key — same as other admin children).

#### `kodi-import-launcher.component.ts` — `KodiImportLauncherComponent`

- PrimeNG `FileUploadModule` (basic mode, `accept=".db"`, single file, no auto upload) + `SelectModule` for mode + `ButtonModule` + `MessageModule`.
- Signals: `selectedFile = signal<File | null>(null)`, `selectedMode = signal<KodiImportMode>(KodiImportMode.Import)`.
- `invalidName = computed(() => file && !/^MyVideos\d+\.db$/i.test(file.name))` — non-blocking warning (`p-message` warn) per FR-004; server stays authoritative.
- Mode options: Import (default) / Preview, each with a short explanation line (`admin.kodiImport.modes.Import` / `.Preview` + `modeHintImport` / `modeHintPreview`); rebuilt on `langChanges$` per established pattern.
- Launch button: disabled when `!selectedFile() || uploading() || isRunActive()`; busy (`loading` icon) while `uploading()` (FR-003, US1-AC6).
- Inline error rendering below the form from `uploadErrorCode()`:
  - `INVALID_FILE_NAME` → `errors.invalidFileName`
  - `UNSUPPORTED_VERSION` → `errors.unsupportedVersion` (detail = server message naming detected version + supported set)
  - `UPLOAD_TOO_LARGE` → `errors.uploadTooLarge` (detail = server message with the limit; UI never hardcodes a number)
  - `INVALID_KODI_DB` → `errors.invalidKodiDb` (guidance: close Kodi before copying)
  - `VALIDATION_ERROR` → `errors.validation` (+ server message)
  - `IMPORT_IN_PROGRESS` (409) → `errors.importInProgress` + a "View active run" button that scrolls to/emits to the status panel — since the status panel is on the same page, the button calls `service.getActiveRun()` and anchors to `#active-run` (FR-006, US2-AC4). Also re-fetch active run so the panel is populated.
  - fallback `UNKNOWN` → `errors.unknown` + server message.
- On success the service sets `activeRun`; the status panel appears automatically (FR-007).

#### `kodi-import-status.component.ts` — `KodiImportStatusComponent`

Mirror of `ScanStatusComponent`. Reads `activeRun`, `pollingError` from the service.

- Shows: mode tag ("Preview" visually distinct — `warn` severity badge on the mode tag), status tag (`Pending`=secondary, `Running`=info, `Completed`=success, `Failed`=danger), source file name, schema version, started/finished via `LocaleDatePipe`, failure reason (`p-message` danger) when Failed, and live counters (headline subset: totalItems, created sum, filesLinked, conflicts, needsReview; spinner while Pending/Running).
- "View report" button → `router.navigate(['/admin/kodi-import', run.id])` (visible for any non-null run, incl. running ones).
- `pollingError()` → recoverable warning `p-message` (`statusPollingError`) that clears itself on the next successful poll (US2-AC7).
- Idle state (no active run): `statusIdle` message.

#### `kodi-import-history-table.component.ts` — `KodiImportHistoryTableComponent`

Mirror of `ScanHistoryTableComponent` (`p-table` lazy, `TableLazyLoadEvent` → page math identical to scanner).

- Columns: mode (tag; Preview gets a distinct `warn` badge — US3-AC5), status tag, source file name, started/finished (`LocaleDatePipe`), headline counters: Created (`moviesCreated + showsCreated + episodesCreated`), Files Linked, Conflicts, Needs Review; actions: "View report" (terminal runs only) → `/admin/kodi-import/{id}`.
- Default page size 20, `rowsPerPageOptions: [10, 20, 50]`; loading indicator via `[loading]`; empty state `historyEmpty` (US3-AC4); `historyError` inline message with Retry button calling `getHistory` at current page.

#### `kodi-import-mappings.component.ts` — `KodiImportMappingsComponent`

Mirror of the library-roots page list section (no paging — list is small and unpaged).

- `p-table` (non-lazy) of `mappings()`: columns sortOrder, kodiPrefix, nasPrefix, actions (Edit, Delete). Empty state `mappingsEmpty` explaining unmatched-path consequences (US5-AC6).
- "Add mapping" button → `@ViewChild` dialog `open()`; Edit → `openForEdit(mapping)`; Delete → `ConfirmationService.confirm` (translated header/message) then `mappingService.remove(id)` + success toast (US5-AC5).
- `providers: [ConfirmationService]`, imports `ConfirmDialogModule`.
- Hosts `<app-kodi-mapping-dialog>`.

#### `kodi-mapping-dialog.component.ts` — `KodiMappingDialogComponent`

Mirror of `AddLibraryRootDialogComponent` (`open()` / `openForEdit()` / `closed` output, `DialogModule` + `InputTextModule` + `InputNumberModule` + `ButtonModule` + `FormsModule`).

- Fields: Kodi prefix (text, required), NAS prefix (text, required, must start with `/`), sort order (number, optional on create — backend defaults to last; required-displayed on edit).
- Client validation (FR-017, US5-AC4): non-empty prefixes; NAS prefix starts with `/`; field-level messages block submit.
- `openWithPrefix(kodiPrefix: string)` — create mode with the Kodi prefix pre-filled and read-only-not (editable); used by the report page (FR-018).
- 422 `DUPLICATE_MAPPING` → inline `p-message` from `mappingService.saveErrorCode()` (`mappingsDialog.duplicate`), dialog stays open, list unchanged (US5-AC3).
- Emits `saved` output so hosts can react (report page may refresh nothing; main page list refreshes via service).

#### `admin-kodi-import-report-page.component.ts` — `AdminKodiImportReportPageComponent`

Route `/admin/kodi-import/:runId`. Sections:

1. **Header**: back link to `/admin/kodi-import`, mode tag (Preview runs labeled `reportPreviewBanner` — projected outcomes, nothing persisted — incl. a hint that `RequiresIdentityLookup` means a real import would resolve these against the provider, US4-AC9), status tag, source file, schema version, started/finished, failure reason when Failed.
2. **Counters grid**: all 15 `ImportCounts` fields as labeled stat cards (`admin.kodiImport.counts.*`), including zeroed counters for empty libraries.
3. **Unmatched prefixes**: list of `report().unmatchedPrefixes`, each with a "Create mapping" button → opens hosted `<app-kodi-mapping-dialog>` via `openWithPrefix(prefix)`. Hidden when empty.
4. **Needs-review hint**: when `counts.needsReview > 0`, an info `p-message` with a link to `/admin/review` (`needsReviewLink`, FR-014/US4-AC7).
5. `<app-kodi-import-items-table [runId]="id">`.

Lifecycle: on init read `runId` from route params, `service.getRunDetail(runId)`, then `service.beginReportPolling(runId)` if status is Pending/Running (edge case: report of a live run keeps refreshing; stops on terminal and refreshes items). 404 → `reportNotFound()` translated empty state with a "Back to history" link (US4-AC8); other load failure → inline error + Retry (FR-015).

#### `kodi-import-items-table.component.ts` — `KodiImportItemsTableComponent`

Mirror of the flat (non-grouped) mode of `ScanDecisionTableComponent`.

- Input: `runId = input.required<string>()`; loads via `service.getItems(runId, outcome, kind, page, pageSize)` in `ngOnInit` and on filter/lazy-load changes (page resets to 1 on filter change — US4-AC4).
- Filters: two `p-select`s — outcome (all 9 `ImportItemStatus` values, translated) and item kind (all 4 `KodiItemKind` values), plus "All" (`common.all`). Options rebuilt on `langChanges$`.
- Columns (US4-AC3): title (rendered as a `RouterLink` to `/media/{mediaId}` when `mediaId` present, plain text otherwise — per user decision), item kind tag, media kind (`Film`/`TvShow` tag or `—`), outcome tag, link outcome tag or `—`, linked file count, reason (or `—` for success rows).
- Severity maps: outcome — Created=success, Reused=info, Unchanged=secondary, NeedsReview=warn, RequiresIdentityLookup=info, IdentityLookupFailed=danger, Conflict=danger, SkippedMusicVideo=secondary, NoLongerInKodi=warn; link — Linked=success, AlreadyLinked=info, PartiallyLinked=warn, UnmatchedPath/NoScannedFile/UnsupportedLocation=warn, Conflict=danger.
- `NeedsReview` rows additionally show a small link/icon to `/admin/review`.
- Lazy `p-table`, default page size 50, `rowsPerPageOptions: [25, 50, 100]` (mirrors scan results), filter-aware totals from `meta`; filtered-empty state `itemsEmptyFiltered`, never-filtered empty state `itemsEmpty`; `itemsError` inline + Retry.

### 2.4 Routing & navigation

**`src/app/features/admin/admin.routes.ts`** (modify) — add two children (same `loadComponent` style, no guards — parent `/admin` already has `authGuard + adminGuard`):

```typescript
{ path: 'kodi-import', loadComponent: () =>
    import('./kodi-import/admin-kodi-import-page.component').then(m => m.AdminKodiImportPageComponent) },
{ path: 'kodi-import/:runId', loadComponent: () =>
    import('./kodi-import/admin-kodi-import-report-page.component').then(m => m.AdminKodiImportReportPageComponent) },
```

**`src/app/features/admin/admin-layout.component.ts`** (modify) — add tab after Scanner:

```typescript
{ labelKey: 'admin.nav.kodiImport', route: '/admin/kodi-import', value: 'kodi-import' },
```

The existing `updateActiveTabFromUrl` (segment index 1) keeps the tab highlighted on `/admin/kodi-import/:runId` with no change.

---

## 3. API contract

All paths relative to `environment.apiBaseUrl` (no leading slash); envelope `ApiResponse<T>`; paged endpoints carry `meta` (`PaginationMeta.totalCount`). Admin-only; tokens via `authInterceptor`; 401/403 via global toast.

| Call           | Method / path                                                     | Request                                                        | Response                                  | Error surfacing                                                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Upload & start | `POST admin/kodi-import` (multipart via new `ApiService.upload`)  | `FormData`: `file` (required), `mode`: `"import"`\|`"preview"` | 202 `ApiResponse<ImportRun>`              | **Inline** in launcher: 400 `VALIDATION_ERROR` / `INVALID_FILE_NAME` / `UNSUPPORTED_VERSION` / `UPLOAD_TOO_LARGE` / `INVALID_KODI_DB`; 409 `IMPORT_IN_PROGRESS` (dedicated message + view-active-run action). Silenced from global toast via new interceptor rule. |
| History        | `GET admin/kodi-import?page=&pageSize=`                           | —                                                              | `ApiResponse<ImportRun[]>` + meta         | Inline `historyError` + retry (400 silenced); network/500 keep global toast.                                                                                                                                                                                       |
| Active run     | `GET admin/kodi-import/active`                                    | —                                                              | `ApiResponse<ImportRun \| null>`          | Poll failures → `pollingError` inline warning, polling continues; no toast change.                                                                                                                                                                                 |
| Run detail     | `GET admin/kodi-import/{id}`                                      | —                                                              | `ApiResponse<ImportRunDetail>`            | 404 → translated not-found state (silenced); other → inline error + retry.                                                                                                                                                                                         |
| Run items      | `GET admin/kodi-import/{id}/items?outcome=&kind=&page=&pageSize=` | query params omitted when undefined                            | `ApiResponse<ImportItemOutcome[]>` + meta | 404/400 → inline `itemsError` + retry (silenced).                                                                                                                                                                                                                  |
| List mappings  | `GET admin/kodi-import/path-mappings`                             | —                                                              | `ApiResponse<KodiPathMapping[]>`          | Global toast (no special handling needed).                                                                                                                                                                                                                         |
| Create mapping | `POST admin/kodi-import/path-mappings`                            | `{ kodiPrefix, nasPrefix, sortOrder? }`                        | `ApiResponse<KodiPathMapping>`            | 422 `DUPLICATE_MAPPING` → inline in dialog (silenced); 400 → inline dialog message.                                                                                                                                                                                |
| Update mapping | `PUT admin/kodi-import/path-mappings/{id}`                        | `{ kodiPrefix, nasPrefix, sortOrder }`                         | `ApiResponse<KodiPathMapping>`            | 422/404/400 → inline in dialog (silenced).                                                                                                                                                                                                                         |
| Delete mapping | `DELETE admin/kodi-import/path-mappings/{id}`                     | —                                                              | `ApiResponse<object>`                     | 404 → global toast acceptable (row removed on refresh).                                                                                                                                                                                                            |

Upload `mode` values are lowercase (`KodiImportMode.Import.toLowerCase()`), matching the API contract; enum values in query params (`outcome`, `kind`) are the PascalCase strings used by the JSON enums.

---

## 4. i18n keys (add to BOTH `src/assets/i18n/en.json` and `fr.json`)

Under `admin.nav`: `kodiImport`: "Kodi Import" / "Import Kodi".

New `admin.kodiImport` subtree:

```
title, backToHistory
launcher: title, chooseFile, fileHint, modeLabel, launch, launching,
          invalidNameWarning, modes: { Import, Preview },
          modeHintImport, modeHintPreview
errors: invalidFileName, unsupportedVersion, uploadTooLarge, invalidKodiDb,
        validation, importInProgress, viewActiveRun, unknown
status: title, idle, mode, sourceFile, schemaVersion, startedAt, finishedAt,
        statusLabel, failureReason, viewReport, pollingError
runStatus: { Pending, Running, Completed, Failed }
modes: { Import, Preview }            // reused for tags/badges
history: title, empty, loadError, retry, viewReport,
         columns: { mode, status, file, startedAt, finishedAt, created, filesLinked,
                    conflicts, needsReview, actions }
counts: { totalItems, moviesCreated, showsCreated, episodesCreated, itemsReused,
          itemsUnchanged, filesLinked, unmatchedPaths, noScannedFiles,
          unsupportedLocations, conflicts, noLongerInKodi, needsReview,
          identityLookupFailures, skippedMusicVideos }
mappings: title, add, empty, saved, updated, removed,
          removeTitle, removeConfirm,
          columns: { sortOrder, kodiPrefix, nasPrefix, actions }
mappingsDialog: { createTitle, editTitle, kodiPrefixLabel, kodiPrefixPlaceholder,
                  nasPrefixLabel, nasPrefixPlaceholder, nasPrefixHint,
                  sortOrderLabel, required, nasPrefixMustStartWithSlash,
                  duplicate, submit, cancel }
report: previewBanner, requiresIdentityLookupHint, countersTitle,
        unmatchedPrefixesTitle, createMapping, needsReviewHint, needsReviewLink,
        notFound, loadError, retry
items: title, filterOutcome, filterKind, empty, emptyFiltered, loadError, retry,
       reviewLink,
       columns: { title, itemKind, mediaKind, outcome, linkOutcome, linkedFiles, reason }
outcomes: { Created, Reused, Unchanged, NeedsReview, RequiresIdentityLookup,
            IdentityLookupFailed, Conflict, SkippedMusicVideo, NoLongerInKodi }
linkOutcomes: { Linked, AlreadyLinked, PartiallyLinked, UnmatchedPath, NoScannedFile,
                UnsupportedLocation, Conflict }
itemKinds: { Movie, TvShow, Episode, MusicVideo }
mediaKinds: { Film, TvShow }
```

French translations supplied for every key (e.g. `outcomes.RequiresIdentityLookup`: "Identification provider requise", `errors.invalidKodiDb`: "…fermez Kodi avant de copier le fichier…", `report.previewBanner`: "Prévisualisation — résultats projetés, rien n'a été enregistré."). Enum-keyed subtrees use the exact PascalCase enum string as key, mirroring `admin.scanner.status.*`.

---

## 5. Test plan (Vitest)

Pattern per AGENTS.md: service tests with `provideHttpClientTesting` + `HttpTestingController` (`expectOne(`${base}/…`)`, assert method/URL/params, `req.flush({ data })`, `httpMock.verify()` in `afterEach`); component tests with real imports + `TranslocoTestingModule` + `provideRouter([])` + `provideNoopAnimations()` + `NO_ERRORS_SCHEMA`, inputs via `componentRef.setInput`, `vi.stubGlobal` where needed, `vi.useFakeTimers()` for polling.

**`admin-kodi-import.service.spec.ts`** (covers US1, US2):

- `uploadDatabase` posts FormData to `POST {base}/admin/kodi-import` containing `file` and lowercase `mode`; on 202 sets `activeRun` and starts polling (AC1.3, FR-007).
- Error mapping: flush 400 with each code (`INVALID_FILE_NAME`, `UNSUPPORTED_VERSION`, `UPLOAD_TOO_LARGE`, `INVALID_KODI_DB`, `VALIDATION_ERROR`) → `uploadErrorCode`/`uploadErrorMessage` set, `uploading` false (AC1.5, FR-005); 409 → `IMPORT_IN_PROGRESS` code (FR-006).
- `getActiveRun` with a Running run starts polling; with `null` data leaves idle state (AC2.1, AC2.3, FR-009).
- Polling (fake timers): after 4 s a second `GET …/active` fires; when the flushed run is `Completed`, no further requests fire and history is re-fetched (AC2.2, FR-008/FR-010); a flushed error response sets `pollingError` and the next interval still fires (AC2.7).
- `getHistory` sends `page`/`pageSize`, maps `meta.totalCount` into `historyMeta` (AC3.2); error sets `historyError`.
- `getRunDetail` 404 → `reportNotFound` true (AC4.8); success sets `report` incl. `unmatchedPrefixes`.
- `getItems` omits undefined `outcome`/`kind` params, includes them when set, maps meta (AC4.4).

**`admin-kodi-path-mapping.service.spec.ts`** (covers US5):

- `loadMappings` GETs `admin/kodi-import/path-mappings` and sets signal in order.
- `create` POSTs `{ kodiPrefix, nasPrefix, sortOrder }`; on success refreshes list; 422 `DUPLICATE_MAPPING` sets `saveErrorCode` and leaves list unchanged (AC5.3).
- `update` PUTs to `…/{id}`; `remove` DELETEs and refreshes (AC5.5).

**`kodi-import-launcher.component.spec.ts`**:

- Launch disabled with no file; enabled after `(onSelect)`; busy/disabled while `uploading()` (AC1.1, AC1.6).
- `invalidName` warning shown for `database.db`, absent for `MyVideos121.db`, and launch still possible (AC1.2).
- Each `uploadErrorCode` renders its specific inline message; 409 renders the "view active run" action (AC1.5, SC-003).

**`kodi-import-status.component.spec.ts`**:

- Renders mode/status tags, file name, schema version; Preview run shows distinct badge (AC1.4); Failed run shows `failureReason` (AC2.5); idle when null (AC2.3); `pollingError` renders recoverable warning (AC2.7).

**`kodi-import-history-table.component.spec.ts`**:

- `onLazyLoad` computes page/pageSize like scanner (AC3.2); rows show headline counters and Preview badge (AC3.1, AC3.5); "View report" navigates to `/admin/kodi-import/{id}` (AC3.3); empty state (AC3.4).

**`kodi-import-mappings.component.spec.ts` / `kodi-mapping-dialog.component.spec.ts`**:

- List renders in sortOrder with edit/delete actions (AC5.1); delete asks confirmation before calling service (AC5.5); dialog blocks submit on empty prefix / NAS prefix without `/` with field-level message (AC5.4); `openWithPrefix` pre-fills the Kodi prefix (AC5.8, FR-018); duplicate error renders inline and dialog stays open (AC5.3).

**`admin-kodi-import-report-page.component.spec.ts` / `kodi-import-items-table.component.spec.ts`**:

- Report renders all 15 counter labels/values (AC4.1, SC-004); unmatched prefixes listed, "create mapping" opens the dialog pre-filled (AC4.2, SC-005); preview banner + identity-lookup hint on preview runs (AC4.9); not-found state with back link on 404 (AC4.8); needs-review hint links to `/admin/review` (AC4.7).
- Items table: filter selects emit `getItems` with `outcome`/`kind` and reset to page 1 (AC4.4); title renders as link to `/media/{mediaId}` when `mediaId` present, plain text otherwise (AC4.5); reason shown for non-success rows (AC4.3, SC-004); filtered-empty state (AC4.6).

**`error.interceptor` regression**: extend existing expectations — 409/400/422/404 on URLs containing `/admin/kodi-import` produce no toast; other URLs still toast.

Fixtures: `makeImportRun(overrides?)`, `makeImportRunDetail`, `makeImportItemOutcome`, `makePathMapping` factories (pattern: `makeMedia()`).

---

## 6. Risks and decisions

1. **`ApiService.upload` vs profile precedent**: `ProfileService` injects `HttpClient` directly for multipart — an AGENTS.md violation. The design adds `upload()` to `ApiService` instead; the profile service is **not** refactored (out of scope, no drive-by refactoring).
2. **Interceptor change**: adding `urlIncludes` to the silent-rule shape is a small core edit; it silences 400/404/409/422 for **all** `/admin/kodi-import*` URLs, so every feature load path must (and does, per design) set an inline error state. Global toast still covers 401/403/500/network failures.
3. **409 "view active run"** is an on-page anchor + `getActiveRun()` refresh rather than a route navigation, because the active-run panel lives on the same page — validate this UX read of FR-006.
4. **Polling error resilience**: the poll stream uses `catchError(() => of(null))` so a transient failure shows a warning without killing the interval (spec AC2.7); counters/elapsed simply resume on recovery.
5. **Report of a running run** polls `GET {id}` at the same 4 s cadence and refreshes items once on terminal transition — minimal approach; validate acceptable vs. redirecting to the active-run panel.
6. **Mapping dialog is hosted by both pages** (main page mappings section + report page for the pre-fill shortcut) — same instance pattern (`@ViewChild`), no shared state beyond the root service.
7. **US6 overrides UI deferred** per user decision: the launcher sends only `file` + `mode`; the backend's optional `overrides` form field is simply never sent.
8. No blocking open questions remain.
