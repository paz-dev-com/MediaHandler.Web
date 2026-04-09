# Tasks: Scan & Import

**Input**: Design documents from `/specs/003-scan-and-import/`  
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/api-contract.md, research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Add manually if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New model interfaces and i18n keys needed by all user stories

- [x] T001 Add `ScanAndImportNasResult` and `AutoImportResult` interfaces to `src/app/shared/models/scan.model.ts` — see `specs/003-scan-and-import/data-model.md` for field definitions. Keep existing `ScanNasResult` unchanged. `ScanAndImportNasResult` has: `newFiles`, `existingFiles`, `totalScanned`, `foldersFound`, `matched`, `skipped`, `failed`, `errors: string[]`. `AutoImportResult` has: `totalUnlinked`, `matched`, `skipped`, `failed`, `errors: string[]`.
- [x] T002 [P] Add new `nasScanner.scanAndImport.*`, `nasScanner.autoImport.*`, and `nasScanner.locations.selectTooltip` i18n keys to `src/assets/i18n/en.json` — keys: `scanAndImport.button` ("Scan & Import"), `scanAndImport.loading` ("Scanning & Importing..."), `scanAndImport.error` ("Scan & Import failed. Please try again."), `scanAndImport.results.title` ("Import Results"), `scanAndImport.results.matched` ("Matched"), `scanAndImport.results.skipped` ("Skipped"), `scanAndImport.results.failed` ("Failed"), `scanAndImport.errors.title` ("Error Details"), `autoImport.title` ("Auto Import"), `autoImport.description` ("Retry TMDB matching for all previously scanned but unlinked media files."), `autoImport.button` ("Auto Import"), `autoImport.loading` ("Importing..."), `autoImport.error` ("Auto Import failed. Please try again."), `autoImport.results.title` ("Auto Import Results"), `autoImport.results.totalUnlinked` ("Total Unlinked"), `autoImport.results.matched` ("Matched"), `autoImport.results.skipped` ("Skipped"), `autoImport.results.failed` ("Failed"), `autoImport.errors.title` ("Error Details"), `locations.selectTooltip` ("Click to select this location")
- [x] T003 [P] Add new `nasScanner.scanAndImport.*`, `nasScanner.autoImport.*`, and `nasScanner.locations.selectTooltip` i18n keys to `src/assets/i18n/fr.json` — French translations: `scanAndImport.button` ("Scanner et importer"), `scanAndImport.loading` ("Scan et importation en cours..."), `scanAndImport.error` ("Le scan et l'importation ont échoué. Veuillez réessayer."), `scanAndImport.results.title` ("Résultats de l'importation"), `scanAndImport.results.matched` ("Correspondants"), `scanAndImport.results.skipped` ("Ignorés"), `scanAndImport.results.failed` ("Échoués"), `scanAndImport.errors.title` ("Détails des erreurs"), `autoImport.title` ("Importation automatique"), `autoImport.description` ("Réessayer la correspondance TMDB pour tous les fichiers médias non liés précédemment scannés."), `autoImport.button` ("Importation automatique"), `autoImport.loading` ("Importation en cours..."), `autoImport.error` ("L'importation automatique a échoué. Veuillez réessayer."), `autoImport.results.title` ("Résultats de l'importation automatique"), `autoImport.results.totalUnlinked` ("Total non liés"), `autoImport.results.matched` ("Correspondants"), `autoImport.results.skipped` ("Ignorés"), `autoImport.results.failed` ("Échoués"), `autoImport.errors.title` ("Détails des erreurs"), `locations.selectTooltip` ("Cliquer pour sélectionner cet emplacement")

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor existing service and page component to support multiple operation types. MUST be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Refactor `NasScannerService` signals in `src/app/features/nas-scanner/nas-scanner.service.ts` — rename `scanning` signal to `loading`, rename `result` signal to `scanResult`, add `scanAndImportResult = signal<ScanAndImportNasResult | null>(null)` and `autoImportResult = signal<AutoImportResult | null>(null)` signals, inject `TranslocoService` from `@jsverse/transloco`. Update existing `scan()` method to use `this.loading` instead of `this.scanning` and `this.scanResult` instead of `this.result`. Add imports for new model types and `TranslocoService`.
- [x] T005 Update `NasScannerPageComponent` template and class to use renamed signals in `src/app/features/nas-scanner/nas-scanner-page.component.html` and `src/app/features/nas-scanner/nas-scanner-page.component.ts` — replace all `service.scanning()` with `service.loading()`, replace all `service.result()` with `service.scanResult()`. Template references: `[disabled]="service.loading()"`, `[loading]="service.loading()"`, `@if (service.loading())`, `@if (service.scanResult(); as result)`, `@else if (!service.loading() && !service.error())`.

**Checkpoint**: Page works exactly as before with renamed signals — no new features yet, scan still triggers from location buttons.

---

## Phase 3: User Story 1 — Adjusted NAS Scanner Location Selection (Priority: P1) 🎯 MVP

**Goal**: Location buttons populate the base path input field instead of auto-triggering a scan. Admin has full control over when to scan by clicking the "Scan" button explicitly.

**Independent Test**: Navigate to NAS Scanner page → click a location button → verify path appears in input WITHOUT any scan being triggered → append a subfolder → click "Scan" → verify scan fires with the full path.

### Implementation for User Story 1

- [x] T006 [US1] Decouple location button from auto-scanning in `src/app/features/nas-scanner/nas-scanner-page.component.ts` — rename `scanLocation(path)` to `selectLocation(path)`, change implementation to only set `this.basePath.set(path)` (remove the `this.service.scan(path)` call)
- [x] T007 [US1] Update template location buttons in `src/app/features/nas-scanner/nas-scanner-page.component.html` — change `(onClick)="scanLocation(loc)"` to `(onClick)="selectLocation(loc)"`, change tooltip from `'nasScanner.locations.tooltip'` to `'nasScanner.locations.selectTooltip'` to reflect new behavior ("Click to select this location" instead of "Click to scan this location")

**Checkpoint**: Location buttons populate path input only. Admin must explicitly click "Scan" to trigger a scan. "Scan All" button continues to work as before (clears path, triggers scan).

---

## Phase 4: User Story 2 — Scan & Import Combined Action (Priority: P1)

**Goal**: Admin can trigger a "Scan & Import" action that scans NAS files and automatically matches them against TMDB in one step. Results display both scan statistics (stat cards) and import statistics (collapsible accordion, collapsed by default) with a collapsible error list.

**Independent Test**: Select a NAS location → optionally append a subfolder → click "Scan & Import" → verify scan stat cards appear + collapsible import results accordion appears below (collapsed by default) → expand accordion → verify matched/skipped/failed stats are shown → if errors exist, expand error list and verify error messages are visible.

### Implementation for User Story 2

- [x] T008 [US2] Add `scanAndImport(basePath?)` method to `NasScannerService` in `src/app/features/nas-scanner/nas-scanner.service.ts` — method sets `error` to null, sets `loading` to true, reads active language via `this.transloco.getActiveLang()`, calls `this.api.post<ScanAndImportNasResult>('files/scan-and-import', {}, { language, ...(basePath ? { basePath } : {}) })`, on success sets `scanAndImportResult` signal, on error sets `error` to `'nasScanner.scanAndImport.error'`, uses `finalize()` to set `loading` to false. See `specs/003-scan-and-import/contracts/api-contract.md` for endpoint contract.
- [x] T009 [P] [US2] Create `ImportResultsComponent` (standalone, OnPush) in `src/app/features/nas-scanner/import-results.component.ts` — uses PrimeNG `Accordion` (`p-accordion` with `[multiple]="true"`, `p-accordion-panel`, `p-accordion-header`, `p-accordion-content`). Signal inputs: `matched: input.required<number>()`, `skipped: input.required<number>()`, `failed: input.required<number>()`, `errors: input.required<string[]>()`, `totalUnlinked: input<number | null>(null)` (optional, shown only for auto-import), `titleKey: input<string>('nasScanner.scanAndImport.results.title')` (i18n key for accordion header). Renders: (1) An accordion panel with import statistics as key-value pairs (matched, skipped, failed, and optionally totalUnlinked), (2) A nested accordion panel for errors only visible when `errors().length > 0` with each error as a list item. Import `Accordion` from `primeng/accordion`, `TranslocoModule` from `@jsverse/transloco`. Panels collapsed by default (do not set `value` binding). See `specs/003-scan-and-import/research.md` sections 1 and 5 for Accordion usage details.
- [x] T010 [US2] Add `triggerScanAndImport()` method and import `ImportResultsComponent` in `src/app/features/nas-scanner/nas-scanner-page.component.ts` — add method `triggerScanAndImport()` that calls `this.service.scanAndImport(this.basePath() || undefined)`, add `ImportResultsComponent` to component `imports` array
- [x] T011 [US2] Update template to add "Scan & Import" button and display combined results in `src/app/features/nas-scanner/nas-scanner-page.component.html` — (1) Add a "Scan & Import" `p-button` next to the existing "Scan" button inside the `__form-row` div, with `icon="pi pi-download"`, `[disabled]="service.loading()"`, `[loading]="service.loading()"`, label from `'nasScanner.scanAndImport.button'` / `'nasScanner.scanAndImport.loading'` transloco keys, `(onClick)="triggerScanAndImport()"`. (2) In the results section, add a block for scanAndImportResult: `@if (service.scanAndImportResult(); as result)` that renders `<app-scan-results [result]="result" />` (structurally compatible with ScanNasResult) followed by `<app-import-results [matched]="result.matched" [skipped]="result.skipped" [failed]="result.failed" [errors]="result.errors" />`. (3) Update the empty state condition to also check `!service.scanAndImportResult()`.

**Checkpoint**: Admin can click "Scan & Import", see scan stat cards + collapsed import accordion. Expanding the accordion shows matched/skipped/failed stats and, if errors exist, a nested expandable error list.

---

## Phase 5: User Story 3 — Auto Import Unlinked Files (Priority: P2)

**Goal**: Admin can trigger an "Auto Import" action (no path required) that retries TMDB matching for all previously scanned but unlinked media files. Results are displayed in a collapsible accordion showing totalUnlinked, matched, skipped, failed, and errors.

**Independent Test**: Click "Auto Import" button (no path needed) → verify the API is called without a basePath → verify import results accordion appears showing totalUnlinked, matched, skipped, failed → if errors exist, expand error list.

### Implementation for User Story 3

- [x] T012 [US3] Add `autoImport()` method to `NasScannerService` in `src/app/features/nas-scanner/nas-scanner.service.ts` — method sets `error` to null, sets `loading` to true, reads active language via `this.transloco.getActiveLang()`, calls `this.api.post<AutoImportResult>('files/auto-import', {}, { language })`, on success sets `autoImportResult` signal, on error sets `error` to `'nasScanner.autoImport.error'`, uses `finalize()` to set `loading` to false. See `specs/003-scan-and-import/contracts/api-contract.md` for endpoint contract.
- [x] T013 [US3] Add `triggerAutoImport()` method to `NasScannerPageComponent` in `src/app/features/nas-scanner/nas-scanner-page.component.ts` — add method `triggerAutoImport()` that calls `this.service.autoImport()`
- [x] T014 [US3] Update template to add visually separated auto-import section in `src/app/features/nas-scanner/nas-scanner-page.component.html` — (1) Below the existing results section, add a new section `<div class="nas-scanner-page__auto-import">` with: a heading using `'nasScanner.autoImport.title'` transloco key, a description paragraph using `'nasScanner.autoImport.description'` transloco key, an "Auto Import" `p-button` with `icon="pi pi-sync"`, `[disabled]="service.loading()"`, `[loading]="service.loading()"`, label from `'nasScanner.autoImport.button'` / `'nasScanner.autoImport.loading'` transloco keys, `(onClick)="triggerAutoImport()"`. (2) Below the button, add auto-import results: `@if (service.autoImportResult(); as result)` rendering `<app-import-results [matched]="result.matched" [skipped]="result.skipped" [failed]="result.failed" [errors]="result.errors" [totalUnlinked]="result.totalUnlinked" [titleKey]="'nasScanner.autoImport.results.title'" />`. (3) Update the empty state condition to also check `!service.autoImportResult()`.
- [x] T015 [P] [US3] Add auto-import section styles in `src/app/features/nas-scanner/nas-scanner-page.component.scss` — add `&__auto-import` block with: `margin-top: 2.5rem`, `padding-top: 2rem`, `border-top: 1px solid var(--surface-200)` for visual separation from path-dependent actions. Add heading and description styles consistent with the existing `__header` pattern.

**Checkpoint**: Admin can click "Auto Import" in a visually distinct section. Results show totalUnlinked, matched, skipped, failed in a collapsible accordion with expandable error details.

---

## Phase 6: User Story 4 — Bilingual Support for New UI Elements (Priority: P3)

**Goal**: All new buttons, labels, result displays, and error messages appear correctly in both English and French.

**Independent Test**: Switch language to French → navigate to NAS Scanner page → verify: "Scanner et importer" button, "Importation automatique" button and section, all import result labels, error details heading — all appear in French with no untranslated key placeholders visible.

### Verification for User Story 4

- [x] T016 [US4] Verify English translations are complete — check `src/assets/i18n/en.json` contains all `nasScanner.scanAndImport.*`, `nasScanner.autoImport.*`, and `nasScanner.locations.selectTooltip` keys referenced in templates. No `nasScanner.*.key` raw strings should appear in the rendered UI. Cross-reference all transloco pipe usages in `nas-scanner-page.component.html` and `import-results.component.ts` against `en.json` keys.
- [x] T017 [US4] Verify French translations are complete — check `src/assets/i18n/fr.json` contains all matching keys from `en.json`. Switch application language to French and verify all new UI elements display French text. Cross-reference all transloco pipe usages against `fr.json` keys.

**Checkpoint**: All new UI text renders correctly in both English and French with zero untranslated keys.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case validation and cross-cutting behavior verification

- [x] T018 Verify loading state disables all buttons and input during any operation (FR-009, FR-010) — confirm that `[disabled]="service.loading()"` is applied to: all location buttons, "Scan" button, "Scan & Import" button, "Auto Import" button, and the base path input field. Confirm `p-progress-spinner` is shown during loading.
- [x] T019 Verify previous results remain visible during loading, replaced only on new completion (FR-015) — confirm that each operation method in `NasScannerService` only clears its own result signal (not other operations' results). Previous results from other operation types stay visible. Previous results from the same operation type remain visible during loading and are replaced on success.
- [x] T020 Verify "Scan All" button still functions correctly (FR-014) — confirm the "Scan All" button clears basePath and calls `triggerScan()`, triggering a full scan without a base path. No regression from the location button decoupling.
- [x] T021 Verify multiple location button clicks replace path in input field — confirm each `selectLocation(loc)` call replaces the previous `basePath` value. Only the last clicked location's path should be in the input when the admin clicks "Scan" or "Scan & Import".

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (model interfaces) from Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (T004, T005 — renamed signals in service + template)
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion. T009 (ImportResultsComponent) can start after T001 (needs model types only). T008 depends on T004 (service refactored). T010–T011 depend on T008 + T009.
- **User Story 3 (Phase 5)**: Depends on T009 (ImportResultsComponent from US2, reused). T012 depends on T004 (service refactored). T013–T014 depend on T012.
- **User Story 4 (Phase 6)**: Depends on US1, US2, US3 being complete (all transloco keys must be in use)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Setup (T001–T003) ─┐
                    ├── Foundational (T004–T005) ─┬── US1 (T006–T007) ──────────────────┐
                    │                              │                                      │
                    │                              ├── US2 (T008–T011) ──┐                │
                    │                              │                     ├── US4 (T016–T017) ── Polish (T018–T021)
                    │                              └── US3 (T012–T015) ──┘                │
                    │                                                                      │
                    └── T009 can start after T001 (only needs model interfaces) ───────────┘
```

- **US1 (P1)**: Independent after Foundational. No dependency on US2 or US3.
- **US2 (P1)**: Independent after Foundational. Creates ImportResultsComponent (T009) that US3 reuses.
- **US3 (P2)**: Depends on T009 from US2 (ImportResultsComponent). Can start T012 (service method) in parallel with US2 work.
- **US4 (P3)**: Verification only — depends on US1+US2+US3 being complete.

### Within Each User Story

- Service method before page component integration (service provides signals consumed by template)
- Component class changes before template changes (template references component properties)
- Styles can be done in parallel with other file changes

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel (different files, no dependencies)
- **Phase 2**: T004 before T005 (T005 depends on renamed signals from T004)
- **Phase 3**: T006 and T007 must be sequential (T007 references renamed method from T006)
- **Phase 4**: T009 (ImportResultsComponent) can be built in parallel with T008 (service method) — only needs model interfaces from T001. T010 and T011 depend on T008 + T009.
- **Phase 5**: T015 (styles) can run in parallel with T012/T013 (different files). T014 depends on T012 + T013.
- **Phase 7**: T018, T019, T020, T021 can all run in parallel (independent verification checks)

---

## Parallel Example: Phase 1

```bash
# All setup tasks can run in parallel:
Task T001: Add model interfaces           → src/app/shared/models/scan.model.ts
Task T002: Add English i18n keys           → src/assets/i18n/en.json
Task T003: Add French i18n keys            → src/assets/i18n/fr.json
```

## Parallel Example: Phase 4 (US2)

```bash
# T008 and T009 can run in parallel (different files):
Task T008: Add scanAndImport() to service  → src/app/features/nas-scanner/nas-scanner.service.ts
Task T009: Create ImportResultsComponent   → src/app/features/nas-scanner/import-results.component.ts

# Then T010 and T011 run sequentially after both complete:
Task T010: Wire triggerScanAndImport()     → src/app/features/nas-scanner/nas-scanner-page.component.ts
Task T011: Update template with button     → src/app/features/nas-scanner/nas-scanner-page.component.html
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (models, i18n keys)
2. Complete Phase 2: Foundational (signal refactor + template update)
3. Complete Phase 3: User Story 1 (location buttons populate path only)
4. **STOP and VALIDATE**: Click location button → path appears in input → no scan triggered → click "Scan" → scan fires with correct path
5. The page works end-to-end with the decoupled location selection, even without Scan & Import or Auto Import

### Incremental Delivery

1. Complete Setup + Foundational → Signals refactored, i18n ready
2. Add User Story 1 → Location buttons populate path → Deploy/Demo (MVP!)
3. Add User Story 2 → Scan & Import combined action → Deploy/Demo
4. Add User Story 3 → Auto Import for unlinked files → Deploy/Demo
5. Verify User Story 4 → Bilingual completeness → Deploy/Demo
6. Polish → Edge cases, loading states, regression checks

### i18n Keys Reference

**English** (`en.json` → add inside existing `nasScanner` object):

```json
{
  "nasScanner": {
    "locations": {
      "selectTooltip": "Click to select this location"
    },
    "scanAndImport": {
      "button": "Scan & Import",
      "loading": "Scanning & Importing...",
      "error": "Scan & Import failed. Please try again.",
      "results": {
        "title": "Import Results",
        "matched": "Matched",
        "skipped": "Skipped",
        "failed": "Failed"
      },
      "errors": {
        "title": "Error Details"
      }
    },
    "autoImport": {
      "title": "Auto Import",
      "description": "Retry TMDB matching for all previously scanned but unlinked media files.",
      "button": "Auto Import",
      "loading": "Importing...",
      "error": "Auto Import failed. Please try again.",
      "results": {
        "title": "Auto Import Results",
        "totalUnlinked": "Total Unlinked",
        "matched": "Matched",
        "skipped": "Skipped",
        "failed": "Failed"
      },
      "errors": {
        "title": "Error Details"
      }
    }
  }
}
```

**French** (`fr.json` → add inside existing `nasScanner` object):

```json
{
  "nasScanner": {
    "locations": {
      "selectTooltip": "Cliquer pour sélectionner cet emplacement"
    },
    "scanAndImport": {
      "button": "Scanner et importer",
      "loading": "Scan et importation en cours...",
      "error": "Le scan et l'importation ont échoué. Veuillez réessayer.",
      "results": {
        "title": "Résultats de l'importation",
        "matched": "Correspondants",
        "skipped": "Ignorés",
        "failed": "Échoués"
      },
      "errors": {
        "title": "Détails des erreurs"
      }
    },
    "autoImport": {
      "title": "Importation automatique",
      "description": "Réessayer la correspondance TMDB pour tous les fichiers médias non liés précédemment scannés.",
      "button": "Importation automatique",
      "loading": "Importation en cours...",
      "error": "L'importation automatique a échoué. Veuillez réessayer.",
      "results": {
        "title": "Résultats de l'importation automatique",
        "totalUnlinked": "Total non liés",
        "matched": "Correspondants",
        "skipped": "Ignorés",
        "failed": "Échoués"
      },
      "errors": {
        "title": "Détails des erreurs"
      }
    }
  }
}
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The backend endpoints `POST /api/v1/files/scan-and-import` and `POST /api/v1/files/auto-import` are assumed to be deployed — no backend work needed
- No new routes or pages — all changes enhance the existing NAS Scanner page (`/nas-scanner`)
- No new dependencies — PrimeNG Accordion, Transloco, and all other packages are already installed
- `ScanResultsComponent` is reused without modification (TypeScript structural typing: `ScanAndImportNasResult` is compatible with `ScanNasResult` input)
- `ImportResultsComponent` is reused for both Scan & Import and Auto Import results (different input bindings)
