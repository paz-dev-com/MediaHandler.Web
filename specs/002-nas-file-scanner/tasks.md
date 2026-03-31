# Tasks: NAS File Scanner

**Input**: Design documents from `/specs/002-nas-file-scanner/`  
**Prerequisites**: plan.md (required), spec.md (required), contracts/api-contract.md

**Tests**: Required per constitution Principle II (Testing Standards).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: New feature module scaffolding and shared prerequisites

- [x] T001 Create `ScanNasResult` model interface in `src/app/shared/models/scan.model.ts`
- [x] T002 [P] Create admin route guard `adminGuard` in `src/app/core/auth/admin.guard.ts` that checks `AuthService.user()?.role === 'Admin'` and redirects non-admin users to `/`
- [x] T003 [P] Add `nasScanner.*` i18n keys to `src/assets/i18n/en.json`
- [x] T004 [P] Add `nasScanner.*` i18n keys to `src/assets/i18n/fr.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Route and navigation wiring that MUST be complete before page components can work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create lazy-loaded route configuration in `src/app/features/nas-scanner/nas-scanner.routes.ts`
- [x] T006 Register `/nas-scanner` lazy route with `authGuard` and `adminGuard` in `src/app/app.routes.ts`
- [x] T007 Add NAS Scanner nav item (admin-only, conditional on `AuthService.user()?.role`) in `src/app/core/layout/sidebar.component.ts`

**Checkpoint**: Route accessible, sidebar link visible for admins, page shell loads

---

## Phase 3: User Story 1 — Trigger NAS File Scan (Priority: P1) 🎯 MVP

**Goal**: Admin can navigate to the NAS Scanner page, optionally enter a base path, click "Scan", and trigger the backend `POST /api/v1/files/scan` endpoint. A loading indicator shows during the scan, and errors are displayed if the call fails.

**Independent Test**: Navigate to `/nas-scanner` as an admin, click "Scan", verify the API is called and the loading state appears/disappears correctly. Verify error handling by testing with an invalid base path or while the API is down.

### Implementation for User Story 1

- [x] T008 [US1] Create `NasScannerService` with `scan(basePath?)` method, `scanning` signal, `result` signal, and `error` signal in `src/app/features/nas-scanner/nas-scanner.service.ts`
- [x] T009 [US1] Create `NasScannerPageComponent` shell (standalone, OnPush) with scan form (optional base path `InputText` + "Scan" `Button`) in `src/app/features/nas-scanner/nas-scanner-page.component.ts`
- [x] T010 [P] [US1] Create `NasScannerPageComponent` template with form layout, loading indicator (`ProgressSpinner`), and error display in `src/app/features/nas-scanner/nas-scanner-page.component.html`
- [x] T011 [P] [US1] Create `NasScannerPageComponent` styles (page layout, form spacing, responsive) in `src/app/features/nas-scanner/nas-scanner-page.component.scss`
- [x] T012 [US1] Wire `NasScannerPageComponent` to `NasScannerService`: call `scan()` on button click, bind `scanning` signal to disable button + show spinner, bind `error` signal to display error message

### Tests for User Story 1

- [x] T012a [P] [US1] Unit test for `NasScannerService`: verify `scan()` calls API, `scanning` signal toggles, `result` signal updates on success, `error` signal updates on failure in `src/app/features/nas-scanner/nas-scanner.service.spec.ts`
- [x] T012b [P] [US1] Component test for `NasScannerPageComponent`: verify button click triggers scan, button disabled during scan, loading spinner shown, error message displayed on failure in `src/app/features/nas-scanner/nas-scanner-page.component.spec.ts`

**Checkpoint**: Admin can trigger a scan and see loading/error states. Results display is handled in US2.

---

## Phase 4: User Story 2 — Scan Results Display (Priority: P2)

**Goal**: After a successful scan, display clear result cards showing new files found, existing files, and total scanned count. Show an informational empty state when no scan has been run yet.

**Independent Test**: Run a scan and verify the results panel shows 3 stat cards with correct values. Refresh the page and verify the empty state is shown.

### Implementation for User Story 2

- [x] T013 [P] [US2] Create `ScanResultsComponent` (standalone, OnPush) that takes `ScanNasResult` as input and displays 3 stat cards (new files, existing files, total scanned) using PrimeNG `Card` in `src/app/features/nas-scanner/scan-results.component.ts`
- [x] T014 [US2] Integrate `ScanResultsComponent` into `NasScannerPageComponent` template: show results when `service.result()` is non-null, show empty state when null in `src/app/features/nas-scanner/nas-scanner-page.component.html`

### Tests for User Story 2

- [x] T014a [P] [US2] Component test for `ScanResultsComponent`: verify 3 stat cards render with correct values, empty state shown when no result in `src/app/features/nas-scanner/scan-results.component.spec.ts`

**Checkpoint**: Full scan workflow works end-to-end — trigger scan, see loading, see results

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Refinements that affect the overall experience

- [x] T015 [P] Unit test for `adminGuard`: verify admin users pass, non-admin users are redirected to `/` in `src/app/core/auth/admin.guard.spec.ts`
- [x] T016 [P] Verify sidebar NAS Scanner link is hidden for non-admin users
- [x] T017 Verify bilingual support: switch language to French and confirm all `nasScanner.*` keys render correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (model) and T002 (admin guard) from Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (routes + sidebar wired)
- **User Story 2 (Phase 4)**: Depends on US1 (T008 service must exist to provide `result` signal)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories. Tests (T012a, T012b) can run in parallel after T008–T012 are complete.
- **User Story 2 (P2)**: Depends on US1 service (T008) being complete for the `result` signal — but the component (T013) can be built in parallel. Test (T014a) can run in parallel after T013.

### Within Each User Story

- Service before page component (service provides signals consumed by template)
- Component class before template and styles (template references component properties)
- Integration/wiring last

### Parallel Opportunities

- T002, T003, T004 can all run in parallel (different files, no dependencies)
- T010, T011 can run in parallel with each other (template + styles)
- T013 (ScanResultsComponent) can be built in parallel with US1 implementation since it only needs the `ScanNasResult` interface from T001
- T012a, T012b, T014a test tasks can all run in parallel once their respective implementation tasks are complete
- T015 (admin guard test) can run in parallel with T016, T017

---

## Parallel Example: Phase 1

```bash
# All setup tasks can run in parallel:
Task T001: Create ScanNasResult model       → src/app/shared/models/scan.model.ts
Task T002: Create adminGuard                → src/app/core/auth/admin.guard.ts
Task T003: Add English i18n keys            → src/assets/i18n/en.json
Task T004: Add French i18n keys             → src/assets/i18n/fr.json
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (model, guard, i18n)
2. Complete Phase 2: Foundational (route + sidebar)
3. Complete Phase 3: User Story 1 (scan trigger + loading/error)
4. **STOP and VALIDATE**: Test scan trigger independently
5. The scan works end-to-end even without results display (response logged in console)

### Incremental Delivery

1. Complete Setup + Foundational → Navigation and routing ready
2. Add User Story 1 → Admin can trigger scans → Deploy/Demo (MVP!)
3. Add User Story 2 → Results displayed clearly → Deploy/Demo
4. Polish → Guard/i18n verification

### i18n Keys Reference

**English** (`en.json` → `nasScanner`):

```json
{
  "nasScanner": {
    "title": "NAS Scanner",
    "description": "Scan your NAS to discover new media files.",
    "basePath": "Base Path",
    "basePathPlaceholder": "Leave empty to scan all configured paths...",
    "scan": "Scan",
    "scanning": "Scanning...",
    "results": {
      "title": "Scan Results",
      "newFiles": "New Files",
      "existingFiles": "Existing Files",
      "totalScanned": "Total Scanned"
    },
    "empty": "No scan has been run yet. Click \"Scan\" to discover files on your NAS.",
    "error": "Scan failed. Please try again.",
    "forbidden": "You do not have permission to scan NAS files."
  }
}
```

**French** (`fr.json` → `nasScanner`):

```json
{
  "nasScanner": {
    "title": "Scanner NAS",
    "description": "Scannez votre NAS pour découvrir de nouveaux fichiers médias.",
    "basePath": "Chemin de base",
    "basePathPlaceholder": "Laissez vide pour scanner tous les chemins configurés...",
    "scan": "Scanner",
    "scanning": "Scan en cours...",
    "results": {
      "title": "Résultats du scan",
      "newFiles": "Nouveaux fichiers",
      "existingFiles": "Fichiers existants",
      "totalScanned": "Total scanné"
    },
    "empty": "Aucun scan n'a encore été lancé. Cliquez sur \"Scanner\" pour découvrir les fichiers sur votre NAS.",
    "error": "Le scan a échoué. Veuillez réessayer.",
    "forbidden": "Vous n'avez pas la permission de scanner les fichiers NAS."
  }
}
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The backend `POST /api/v1/files/scan` endpoint already exists — no backend work needed
