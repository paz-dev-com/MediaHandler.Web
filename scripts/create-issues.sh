#!/usr/bin/env bash
# Creates GitHub issues for feature 003-scan-and-import
# All 21 tasks from specs/003-scan-and-import/tasks.md
set -euo pipefail

REPO="paz-dev-com/MediaHandler.Web"
BRANCH="003-scan-and-import"
TMPDIR_ISSUES=$(mktemp -d)
trap 'rm -rf "$TMPDIR_ISSUES"' EXIT

echo "Creating GitHub issues for feature 003-scan-and-import..."
echo "Repo: $REPO"
echo ""

new_issue() {
  local title="$1"
  local labels="$2"
  local body_file="$3"
  local url
  url=$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --body-file "$body_file")
  local num
  num=$(echo "$url" | grep -oE '[0-9]+$')
  echo "#$num → $title"
  echo "$num"
}

# ─────────────────────────────────────────────────────────
# PHASE 1 — Setup
# ─────────────────────────────────────────────────────────
echo "=== Phase 1: Setup ==="

cat > "$TMPDIR_ISSUES/t001.md" << 'EOF'
## Overview
Add new TypeScript interfaces `ScanAndImportNasResult` and `AutoImportResult` to `src/app/shared/models/scan.model.ts`.
The existing `ScanNasResult` interface must remain **unchanged**.

## Interfaces to add

```typescript
export interface ScanAndImportNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
  foldersFound: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface AutoImportResult {
  totalUnlinked: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}
```

## Acceptance Criteria
- [ ] `ScanAndImportNasResult` interface added with all 8 fields
- [ ] `AutoImportResult` interface added with all 5 fields
- [ ] Existing `ScanNasResult` left unchanged
- [ ] Both new interfaces exported from the file

## References
- `specs/003-scan-and-import/data-model.md`

## Context
Feature branch: `003-scan-and-import` | Phase 1 — can start immediately, no dependencies.
EOF
T001_NUM=$(new_issue "[T001] Add ScanAndImportNasResult and AutoImportResult interfaces" "feature,data-model,phase-1-setup,nas-scanner" "$TMPDIR_ISSUES/t001.md")

cat > "$TMPDIR_ISSUES/t002.md" << 'EOF'
## Overview
Add new Transloco i18n keys to `src/assets/i18n/en.json` inside the existing `nasScanner` object.

## Keys to add

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

## Acceptance Criteria
- [ ] All keys listed above added inside `nasScanner` in `en.json`
- [ ] JSON remains valid (no syntax errors)
- [ ] No duplicate keys introduced

## Context
Feature branch: `003-scan-and-import` | Phase 1 — can run in parallel with T003.
EOF
T002_NUM=$(new_issue "[T002] Add English i18n keys for scan-and-import (en.json)" "feature,i18n,phase-1-setup,nas-scanner" "$TMPDIR_ISSUES/t002.md")

cat > "$TMPDIR_ISSUES/t003.md" << 'EOF'
## Overview
Add French translations to `src/assets/i18n/fr.json`, mirroring all keys added in T002 (`en.json`).

## Keys to add inside `nasScanner`

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

## Acceptance Criteria
- [ ] All FR keys present — exact mirror of `en.json` additions
- [ ] JSON remains valid

## Context
Feature branch: `003-scan-and-import` | Phase 1 — can run in parallel with T002.
EOF
T003_NUM=$(new_issue "[T003] Add French i18n keys for scan-and-import (fr.json)" "feature,i18n,phase-1-setup,nas-scanner" "$TMPDIR_ISSUES/t003.md")

# ─────────────────────────────────────────────────────────
# PHASE 2 — Foundational (blocking)
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 2: Foundational (blocking) ==="

cat > "$TMPDIR_ISSUES/t004.md" << EOF
## Overview
Refactor \`src/app/features/nas-scanner/nas-scanner.service.ts\` to support multiple operation types (scan, scan-and-import, auto-import).

## Changes required
- Rename signal \`scanning\` → \`loading\`
- Rename signal \`result\` → \`scanResult\`
- Add \`scanAndImportResult = signal<ScanAndImportNasResult | null>(null)\`
- Add \`autoImportResult = signal<AutoImportResult | null>(null)\`
- Inject \`TranslocoService\` from \`@jsverse/transloco\`
- Update existing \`scan()\` method to use \`this.loading\` and \`this.scanResult\`
- Add imports for new model types

## Acceptance Criteria
- [ ] \`loading\` signal replaces \`scanning\`
- [ ] \`scanResult\` signal replaces \`result\`
- [ ] \`scanAndImportResult\` signal added
- [ ] \`autoImportResult\` signal added
- [ ] \`TranslocoService\` injected
- [ ] \`scan()\` method updated — no regression
- [ ] Page works exactly as before (scan still works)

## ⚠️ BLOCKS all US1, US2, US3 work
This task must be completed before any user story implementation can begin.

## Dependencies
- #$T001_NUM (T001) — model interfaces must exist first

## Context
Feature branch: \`003-scan-and-import\` | Phase 2 — must complete before T005.
EOF
T004_NUM=$(new_issue "[T004] Refactor NasScannerService — rename signals, add new result signals, inject TranslocoService" "feature,angular,phase-2-foundational,nas-scanner" "$TMPDIR_ISSUES/t004.md")

cat > "$TMPDIR_ISSUES/t005.md" << EOF
## Overview
Update \`NasScannerPageComponent\` (both \`.ts\` and \`.html\`) to use the renamed signals from T004.

**Files:**
- \`src/app/features/nas-scanner/nas-scanner-page.component.ts\`
- \`src/app/features/nas-scanner/nas-scanner-page.component.html\`

## Changes required
- Replace all \`service.scanning()\` → \`service.loading()\`
- Replace all \`service.result()\` → \`service.scanResult()\`

**Template references to update:**
- \`[disabled]="service.loading()"\`
- \`[loading]="service.loading()"\`
- \`@if (service.loading())\`
- \`@if (service.scanResult(); as result)\`
- \`@else if (!service.loading() && !service.error())\`

## Acceptance Criteria
- [ ] No remaining references to \`service.scanning()\` or \`service.result()\`
- [ ] Page compiles without errors
- [ ] Scan functionality works exactly as before

## ✅ Checkpoint
After this task: page works exactly as before with renamed signals. No new features yet.

## Dependencies
- #$T004_NUM (T004) — renamed signals must exist in service first

## Context
Feature branch: \`003-scan-and-import\` | Phase 2.
EOF
T005_NUM=$(new_issue "[T005] Update NasScannerPageComponent to use renamed signals (loading, scanResult)" "feature,angular,phase-2-foundational,nas-scanner" "$TMPDIR_ISSUES/t005.md")

# ─────────────────────────────────────────────────────────
# PHASE 3 — User Story 1 (MVP)
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 3: User Story 1 — Location Selection (MVP) ==="

cat > "$TMPDIR_ISSUES/t006.md" << EOF
## Overview
Decouple NAS location buttons from auto-triggering a scan.
Currently, clicking a location button calls \`scanLocation(path)\` which immediately fires a scan.
This must change so clicking a location **only populates the base path input** — no scan is triggered.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.ts\`

## Changes required
- Rename method \`scanLocation(path: string)\` → \`selectLocation(path: string)\`
- Change implementation to **only** \`this.basePath.set(path)\` (remove the \`this.service.scan(path)\` call)

## Acceptance Criteria
- [ ] Method \`scanLocation\` renamed to \`selectLocation\`
- [ ] \`selectLocation\` only sets the base path signal, does NOT call the scan service
- [ ] No TypeScript errors

## Independent Test
Navigate to NAS Scanner page → click a location button → verify path appears in input WITHOUT any scan being triggered.

## Dependencies
- #$T004_NUM (T004) — foundational refactor must be complete
- #$T005_NUM (T005) — template must use renamed signals

## Context
Feature branch: \`003-scan-and-import\` | Phase 3 — US1 (P1) 🎯 MVP
EOF
T006_NUM=$(new_issue "[T006][US1] Decouple location buttons from auto-scanning — rename scanLocation() to selectLocation()" "feature,angular,phase-3-us1,nas-scanner" "$TMPDIR_ISSUES/t006.md")

cat > "$TMPDIR_ISSUES/t007.md" << EOF
## Overview
Update the NAS Scanner page template to reflect the new location button behavior (select path, don't scan).

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.html\`

## Changes required
- Change \`(onClick)="scanLocation(loc)"\` → \`(onClick)="selectLocation(loc)"\`
- Change tooltip binding from \`'nasScanner.locations.tooltip'\` → \`'nasScanner.locations.selectTooltip'\`
  (new tooltip text: "Click to select this location" instead of "Click to scan this location")

## Acceptance Criteria
- [ ] All location buttons use \`selectLocation(loc)\`
- [ ] Tooltip uses the new \`selectTooltip\` i18n key
- [ ] "Scan All" button (clears path, triggers scan) continues to work as before
- [ ] Admin must click "Scan" explicitly to trigger a scan after selecting a location

## ✅ Checkpoint
After this task: location buttons populate path input only. "Scan All" button still works. Admin controls when to scan.

## Dependencies
- #$T006_NUM (T006) — \`selectLocation()\` method must exist in component class first

## Context
Feature branch: \`003-scan-and-import\` | Phase 3 — US1 (P1)
EOF
T007_NUM=$(new_issue "[T007][US1] Update template — location buttons use selectLocation(), update tooltip key" "feature,angular,phase-3-us1,nas-scanner" "$TMPDIR_ISSUES/t007.md")

# ─────────────────────────────────────────────────────────
# PHASE 4 — User Story 2 — Scan & Import
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 4: User Story 2 — Scan & Import ==="

cat > "$TMPDIR_ISSUES/t008.md" << EOF
## Overview
Add a \`scanAndImport(basePath?)\` method to \`NasScannerService\` that calls the new \`POST /api/v1/files/scan-and-import\` endpoint.

**File:** \`src/app/features/nas-scanner/nas-scanner.service.ts\`

## Implementation details
\`\`\`typescript
scanAndImport(basePath?: string): void {
  this.error.set(null);
  this.loading.set(true);
  const language = this.transloco.getActiveLang();
  this.api
    .post<ScanAndImportNasResult>(
      'files/scan-and-import',
      {},
      { language, ...(basePath ? { basePath } : {}) }
    )
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe({
      next: (response) => this.scanAndImportResult.set(response.data),
      error: () => this.error.set('nasScanner.scanAndImport.error'),
    });
}
\`\`\`

## Acceptance Criteria
- [ ] Method \`scanAndImport(basePath?)\` added to service
- [ ] Uses \`this.transloco.getActiveLang()\` for language parameter
- [ ] Calls \`files/scan-and-import\` endpoint with correct query params
- [ ] Sets \`scanAndImportResult\` signal on success
- [ ] Sets \`error\` signal on failure with correct i18n key
- [ ] Uses \`finalize()\` to reset \`loading\` signal

## References
- \`specs/003-scan-and-import/contracts/api-contract.md\`

## Dependencies
- #$T004_NUM (T004) — refactored service with \`loading\` signal and \`TranslocoService\` injection
- #$T001_NUM (T001) — \`ScanAndImportNasResult\` interface

## Context
Feature branch: \`003-scan-and-import\` | Phase 4 — US2 (P1). Can run in parallel with T009.
EOF
T008_NUM=$(new_issue "[T008][US2] Add scanAndImport() method to NasScannerService" "feature,angular,api-integration,phase-4-us2,nas-scanner" "$TMPDIR_ISSUES/t008.md")

cat > "$TMPDIR_ISSUES/t009.md" << EOF
## Overview
Create a new standalone \`ImportResultsComponent\` that displays import statistics in a collapsible PrimeNG Accordion, with a nested collapsible error list.

**File:** \`src/app/features/nas-scanner/import-results.component.ts\`

## Component specification
- Standalone, OnPush, no template file (inline template)
- Imports: \`AccordionModule\` from \`primeng/accordion\`, \`TranslocoModule\`

**Signal inputs:**
\`\`\`typescript
matched = input.required<number>();
skipped = input.required<number>();
failed = input.required<number>();
errors = input.required<string[]>();
totalUnlinked = input<number | null>(null); // optional, shown only for auto-import
titleKey = input<string>('nasScanner.scanAndImport.results.title');
\`\`\`

**Template structure:**
1. A \`p-accordion\` panel (collapsed by default) with header from \`titleKey\` input showing import stats (matched, skipped, failed, and \`totalUnlinked\` if non-null)
2. A second \`p-accordion\` panel for errors — only visible when \`errors().length > 0\`, listing each error as a \`<li>\`

Use \`[multiple]="true"\` on \`p-accordion\`. Do NOT set \`value\` binding (panels start collapsed).

## Acceptance Criteria
- [ ] Component created with all signal inputs
- [ ] Import stats accordion panel — collapsed by default
- [ ] Error list accordion panel — only shown when errors.length > 0, collapsed by default
- [ ] \`totalUnlinked\` row only rendered when input is non-null
- [ ] All text uses \`transloco\` pipe with keys from \`nasScanner.scanAndImport.results.*\` / \`nasScanner.autoImport.results.*\`
- [ ] Component compiles with no errors

## References
- \`specs/003-scan-and-import/research.md\` — sections 1 and 5 for PrimeNG Accordion usage

## Dependencies
- #$T001_NUM (T001) — \`ScanAndImportNasResult\` and \`AutoImportResult\` interfaces

## Context
Feature branch: \`003-scan-and-import\` | Phase 4 — US2 (P1). Can run in parallel with T008.
EOF
T009_NUM=$(new_issue "[T009][US2] Create ImportResultsComponent — collapsible accordion for import stats and errors" "feature,angular,phase-4-us2,nas-scanner" "$TMPDIR_ISSUES/t009.md")

cat > "$TMPDIR_ISSUES/t010.md" << EOF
## Overview
Wire up the \`triggerScanAndImport()\` method in \`NasScannerPageComponent\` and add \`ImportResultsComponent\` to imports.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.ts\`

## Changes required
1. Add \`triggerScanAndImport()\` method:
\`\`\`typescript
triggerScanAndImport(): void {
  this.service.scanAndImport(this.basePath() || undefined);
}
\`\`\`
2. Add \`ImportResultsComponent\` to the component's \`imports\` array

## Acceptance Criteria
- [ ] \`triggerScanAndImport()\` method added
- [ ] \`ImportResultsComponent\` imported and listed in component \`imports\`
- [ ] No TypeScript errors

## Dependencies
- #$T008_NUM (T008) — \`scanAndImport()\` must exist in service
- #$T009_NUM (T009) — \`ImportResultsComponent\` must exist

## Context
Feature branch: \`003-scan-and-import\` | Phase 4 — US2. Must complete before T011.
EOF
T010_NUM=$(new_issue "[T010][US2] Add triggerScanAndImport() to NasScannerPageComponent and import ImportResultsComponent" "feature,angular,phase-4-us2,nas-scanner" "$TMPDIR_ISSUES/t010.md")

cat > "$TMPDIR_ISSUES/t011.md" << EOF
## Overview
Update the NAS Scanner page template to add the "Scan & Import" button and display combined results.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.html\`

## Changes required

### 1. Add "Scan & Import" button
Inside the \`__form-row\` div, next to the existing "Scan" button:
\`\`\`html
<p-button
  [label]="service.loading()
    ? ('nasScanner.scanAndImport.loading' | transloco)
    : ('nasScanner.scanAndImport.button' | transloco)"
  icon="pi pi-download"
  [disabled]="service.loading()"
  [loading]="service.loading()"
  (onClick)="triggerScanAndImport()"
/>
\`\`\`

### 2. Add scanAndImportResult display in the results section
\`\`\`html
@if (service.scanAndImportResult(); as result) {
  <app-scan-results [result]="result" />
  <app-import-results
    [matched]="result.matched"
    [skipped]="result.skipped"
    [failed]="result.failed"
    [errors]="result.errors"
  />
}
\`\`\`

### 3. Update empty state condition
Add \`&& !service.scanAndImportResult()\` to the empty state \`@else if\` condition.

## Acceptance Criteria
- [ ] "Scan & Import" button visible next to "Scan" button
- [ ] Button disabled and loading during any operation
- [ ] Scan stat cards + import accordion displayed after scan-and-import completes
- [ ] Empty state only shows when no results at all

## ✅ Checkpoint
Admin can click "Scan & Import" → see scan stat cards + collapsed import accordion → expand accordion → see matched/skipped/failed → expand errors if any.

## Dependencies
- #$T010_NUM (T010) — \`triggerScanAndImport()\` and \`ImportResultsComponent\` must be wired in class

## Context
Feature branch: \`003-scan-and-import\` | Phase 4 — US2 (P1).
EOF
T011_NUM=$(new_issue "[T011][US2] Update template — add Scan & Import button and combined results display" "feature,angular,phase-4-us2,nas-scanner" "$TMPDIR_ISSUES/t011.md")

# ─────────────────────────────────────────────────────────
# PHASE 5 — User Story 3 — Auto Import
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 5: User Story 3 — Auto Import ==="

cat > "$TMPDIR_ISSUES/t012.md" << EOF
## Overview
Add an \`autoImport()\` method to \`NasScannerService\` that calls the new \`POST /api/v1/files/auto-import\` endpoint.
No base path is required — this retries TMDB matching for all existing unlinked \`MediaFile\` records.

**File:** \`src/app/features/nas-scanner/nas-scanner.service.ts\`

## Implementation details
\`\`\`typescript
autoImport(): void {
  this.error.set(null);
  this.loading.set(true);
  const language = this.transloco.getActiveLang();
  this.api
    .post<AutoImportResult>('files/auto-import', {}, { language })
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe({
      next: (response) => this.autoImportResult.set(response.data),
      error: () => this.error.set('nasScanner.autoImport.error'),
    });
}
\`\`\`

## Acceptance Criteria
- [ ] Method \`autoImport()\` added to service
- [ ] Uses \`this.transloco.getActiveLang()\` for language parameter
- [ ] Calls \`files/auto-import\` endpoint — NO basePath param
- [ ] Sets \`autoImportResult\` signal on success
- [ ] Sets \`error\` signal on failure with correct i18n key
- [ ] Uses \`finalize()\` to reset \`loading\` signal

## References
- \`specs/003-scan-and-import/contracts/api-contract.md\`

## Dependencies
- #$T004_NUM (T004) — refactored service with \`loading\` signal and \`TranslocoService\`
- #$T001_NUM (T001) — \`AutoImportResult\` interface

## Context
Feature branch: \`003-scan-and-import\` | Phase 5 — US3 (P2).
EOF
T012_NUM=$(new_issue "[T012][US3] Add autoImport() method to NasScannerService" "feature,angular,api-integration,phase-5-us3,nas-scanner" "$TMPDIR_ISSUES/t012.md")

cat > "$TMPDIR_ISSUES/t013.md" << EOF
## Overview
Add \`triggerAutoImport()\` method to \`NasScannerPageComponent\`.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.ts\`

## Changes required
\`\`\`typescript
triggerAutoImport(): void {
  this.service.autoImport();
}
\`\`\`

## Acceptance Criteria
- [ ] \`triggerAutoImport()\` method added
- [ ] Calls \`this.service.autoImport()\`
- [ ] No TypeScript errors

## Dependencies
- #$T012_NUM (T012) — \`autoImport()\` must exist in service

## Context
Feature branch: \`003-scan-and-import\` | Phase 5 — US3. Must complete before T014.
EOF
T013_NUM=$(new_issue "[T013][US3] Add triggerAutoImport() method to NasScannerPageComponent" "feature,angular,phase-5-us3,nas-scanner" "$TMPDIR_ISSUES/t013.md")

cat > "$TMPDIR_ISSUES/t014.md" << EOF
## Overview
Update the NAS Scanner page template to add a visually separated "Auto Import" section below the main results area.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.html\`

## Changes required

### 1. Add the auto-import section below the results div
\`\`\`html
<div class="nas-scanner-page__auto-import">
  <h2>{{ 'nasScanner.autoImport.title' | transloco }}</h2>
  <p class="text-color-secondary">{{ 'nasScanner.autoImport.description' | transloco }}</p>

  <p-button
    [label]="service.loading()
      ? ('nasScanner.autoImport.loading' | transloco)
      : ('nasScanner.autoImport.button' | transloco)"
    icon="pi pi-sync"
    [disabled]="service.loading()"
    [loading]="service.loading()"
    (onClick)="triggerAutoImport()"
  />

  @if (service.autoImportResult(); as result) {
    <app-import-results
      [matched]="result.matched"
      [skipped]="result.skipped"
      [failed]="result.failed"
      [errors]="result.errors"
      [totalUnlinked]="result.totalUnlinked"
      [titleKey]="'nasScanner.autoImport.results.title'"
    />
  }
</div>
\`\`\`

### 2. Update empty state condition
Add \`&& !service.autoImportResult()\` to the empty state condition.

## Acceptance Criteria
- [ ] "Auto Import" section visible in a separate visual area below main results
- [ ] Section has title and description text (i18n keys)
- [ ] "Auto Import" button disabled during any loading operation
- [ ] Auto-import results accordion displayed after completion
- [ ] Empty state condition updated

## ✅ Checkpoint
Admin can click "Auto Import" in a visually distinct section → results show totalUnlinked, matched, skipped, failed in a collapsible accordion.

## Dependencies
- #$T013_NUM (T013) — \`triggerAutoImport()\` method must exist
- #$T009_NUM (T009) — \`ImportResultsComponent\` must exist

## Context
Feature branch: \`003-scan-and-import\` | Phase 5 — US3 (P2).
EOF
T014_NUM=$(new_issue "[T014][US3] Update template — add visually separated Auto Import section with results" "feature,angular,phase-5-us3,nas-scanner" "$TMPDIR_ISSUES/t014.md")

cat > "$TMPDIR_ISSUES/t015.md" << EOF
## Overview
Add SCSS styles for the new auto-import section to provide visual separation from path-dependent actions.

**File:** \`src/app/features/nas-scanner/nas-scanner-page.component.scss\`

## Styles to add
\`\`\`scss
&__auto-import {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--surface-200);

  h2 {
    margin: 0 0 0.5rem;
  }

  p {
    margin: 0 0 1.25rem;
  }
}
\`\`\`

## Acceptance Criteria
- [ ] \`__auto-import\` block added to component SCSS
- [ ] Visual separator (border-top) visible between main scan area and auto-import section
- [ ] Heading and description styles consistent with existing \`__header\` pattern

## Context
Feature branch: \`003-scan-and-import\` | Phase 5 — US3. Can run in parallel with T012/T013.
EOF
T015_NUM=$(new_issue "[T015][US3] Add SCSS styles for auto-import section (visual separation)" "feature,angular,phase-5-us3,nas-scanner" "$TMPDIR_ISSUES/t015.md")

# ─────────────────────────────────────────────────────────
# PHASE 6 — User Story 4 — Bilingual verification
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 6: User Story 4 — Bilingual Support ==="

cat > "$TMPDIR_ISSUES/t016.md" << EOF
## Overview
Verify that all English translations are complete and all new i18n keys referenced in templates exist in \`en.json\`.

## Verification steps
1. Open \`src/assets/i18n/en.json\`
2. Confirm the following keys exist inside \`nasScanner\`:
   - \`locations.selectTooltip\`
   - \`scanAndImport.button\`, \`scanAndImport.loading\`, \`scanAndImport.error\`
   - \`scanAndImport.results.title\`, \`.matched\`, \`.skipped\`, \`.failed\`
   - \`scanAndImport.errors.title\`
   - \`autoImport.title\`, \`autoImport.description\`, \`autoImport.button\`, \`autoImport.loading\`, \`autoImport.error\`
   - \`autoImport.results.title\`, \`.totalUnlinked\`, \`.matched\`, \`.skipped\`, \`.failed\`
   - \`autoImport.errors.title\`
3. Cross-reference all \`transloco\` pipe usages in:
   - \`nas-scanner-page.component.html\`
   - \`import-results.component.ts\`
4. Start the app in English — confirm no raw key strings visible in UI

## Acceptance Criteria
- [ ] All keys above present in \`en.json\`
- [ ] No untranslated raw key strings visible in English UI
- [ ] Cross-reference confirms no missing keys

## Dependencies
- #$T011_NUM (T011) — US2 template complete
- #$T014_NUM (T014) — US3 template complete
- #$T002_NUM (T002) — EN keys added

## Context
Feature branch: \`003-scan-and-import\` | Phase 6 — US4 (P3).
EOF
T016_NUM=$(new_issue "[T016][US4] Verify English translations are complete — cross-reference all transloco keys" "feature,i18n,phase-6-us4,nas-scanner" "$TMPDIR_ISSUES/t016.md")

cat > "$TMPDIR_ISSUES/t017.md" << EOF
## Overview
Verify that all French translations are complete and that the app renders correctly in French.

## Verification steps
1. Open \`src/assets/i18n/fr.json\`
2. Confirm all keys listed in T016 exist in \`fr.json\` with French values
3. Switch application language to French
4. Navigate to the NAS Scanner page
5. Verify all new labels appear in French:
   - "Cliquer pour sélectionner cet emplacement" (location tooltip)
   - "Scanner et importer" (Scan & Import button)
   - "Importation automatique" (Auto Import button and section title)
   - All import result stat labels in French
   - Error details section label in French

## Acceptance Criteria
- [ ] All FR keys present — exact mirror of EN additions
- [ ] App renders NAS Scanner page fully in French with no raw key strings visible
- [ ] French translations are natural and correct

## Dependencies
- #$T016_NUM (T016) — EN verification complete
- #$T003_NUM (T003) — FR keys added

## Context
Feature branch: \`003-scan-and-import\` | Phase 6 — US4 (P3).
EOF
T017_NUM=$(new_issue "[T017][US4] Verify French translations are complete — test NAS Scanner page in French" "feature,i18n,phase-6-us4,nas-scanner" "$TMPDIR_ISSUES/t017.md")

# ─────────────────────────────────────────────────────────
# PHASE 7 — Polish & Cross-Cutting
# ─────────────────────────────────────────────────────────
echo ""
echo "=== Phase 7: Polish & Cross-Cutting Concerns ==="

cat > "$TMPDIR_ISSUES/t018.md" << EOF
## Overview
Verify that the loading state correctly disables all interactive elements during any active operation (scan, scan-and-import, or auto-import).

**Files to check:**
- \`src/app/features/nas-scanner/nas-scanner-page.component.html\`
- \`src/app/features/nas-scanner/nas-scanner.service.ts\`

## Verification checklist
- [ ] All NAS location buttons: \`[disabled]="service.loading()"\`
- [ ] "Scan" button: \`[disabled]="service.loading()"\`
- [ ] "Scan & Import" button: \`[disabled]="service.loading()"\`
- [ ] "Auto Import" button: \`[disabled]="service.loading()"\`
- [ ] "Scan All" button: \`[disabled]="service.loading()"\`
- [ ] Base path input: \`[disabled]="service.loading()"\`
- [ ] \`<p-progress-spinner>\` shown during loading
- [ ] Triggering one operation while another is in progress is impossible (all buttons disabled)

## References
- FR-009, FR-010 in \`specs/003-scan-and-import/spec.md\`

## Dependencies
- #$T011_NUM (T011) — US2 template complete
- #$T014_NUM (T014) — US3 template complete

## Context
Feature branch: \`003-scan-and-import\` | Phase 7 — Polish. Can run in parallel with T019/T020/T021.
EOF
T018_NUM=$(new_issue "[T018] Verify loading state disables all buttons and input during any operation (FR-009, FR-010)" "feature,phase-7-polish,nas-scanner" "$TMPDIR_ISSUES/t018.md")

cat > "$TMPDIR_ISSUES/t019.md" << EOF
## Overview
Verify that previous operation results remain visible during a new operation, and are only replaced upon successful completion.

**File to check:** \`src/app/features/nas-scanner/nas-scanner.service.ts\`

## Verification checklist
- [ ] \`scan()\` method does NOT clear \`scanAndImportResult\` or \`autoImportResult\` signals
- [ ] \`scanAndImport()\` method does NOT clear \`scanResult\` or \`autoImportResult\` signals
- [ ] \`autoImport()\` method does NOT clear \`scanResult\` or \`scanAndImportResult\` signals
- [ ] Each method only clears its **own** result signal on successful new completion
- [ ] While loading, old results from all operation types remain visible on screen

## Example scenario to test
1. Run a scan → see scan results
2. Click "Scan & Import" (loading state)
3. Verify scan results are still visible during loading
4. After scan-and-import completes → both scan results and scan-and-import results are visible

## References
- FR-015 in \`specs/003-scan-and-import/spec.md\`

## Context
Feature branch: \`003-scan-and-import\` | Phase 7 — Polish. Can run in parallel with T018/T020/T021.
EOF
T019_NUM=$(new_issue "[T019] Verify previous results remain visible during loading, replaced only on new completion (FR-015)" "feature,phase-7-polish,nas-scanner" "$TMPDIR_ISSUES/t019.md")

cat > "$TMPDIR_ISSUES/t020.md" << EOF
## Overview
Regression test: verify the "Scan All" button (scan without a base path) still works correctly after the location button decoupling changes from US1.

**File to check:** \`src/app/features/nas-scanner/nas-scanner-page.component.html\`

## Verification checklist
- [ ] "Scan All" button clears \`basePath\` signal (sets to empty string)
- [ ] "Scan All" button calls \`triggerScan()\` which calls \`service.scan(undefined)\`
- [ ] Clicking "Scan All" triggers a full scan with no basePath parameter
- [ ] "Scan All" button is disabled during loading
- [ ] No regression from the location button decoupling (T006/T007)

## References
- FR-014 in \`specs/003-scan-and-import/spec.md\`

## Context
Feature branch: \`003-scan-and-import\` | Phase 7 — Polish. Can run in parallel with T018/T019/T021.
EOF
T020_NUM=$(new_issue "[T020] Verify Scan All button still works correctly after location button decoupling (FR-014)" "feature,phase-7-polish,nas-scanner" "$TMPDIR_ISSUES/t020.md")

cat > "$TMPDIR_ISSUES/t021.md" << EOF
## Overview
Verify that clicking multiple NAS location buttons in sequence correctly replaces the base path each time, and that only the last selected path is used when the admin triggers a scan.

## Verification steps
1. Navigate to NAS Scanner page
2. Click location button A → verify path A appears in input
3. Click location button B → verify path B replaces path A in input
4. Click "Scan" → verify the API is called with path B (not path A)

## Verification checklist
- [ ] Each \`selectLocation(loc)\` call overwrites the previous \`basePath\` signal value
- [ ] Only the last clicked location path is used when triggering "Scan" or "Scan & Import"
- [ ] No stale path values from previous clicks

## Context
Feature branch: \`003-scan-and-import\` | Phase 7 — Polish. Can run in parallel with T018/T019/T020.
EOF
T021_NUM=$(new_issue "[T021] Verify multiple location button clicks replace path in input (last click wins)" "feature,phase-7-polish,nas-scanner" "$TMPDIR_ISSUES/t021.md")

# ─────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  All 21 issues created successfully!"
echo "============================================"
echo ""
echo "Issue map:"
echo "  T001 → #$T001_NUM  | Add model interfaces"
echo "  T002 → #$T002_NUM  | EN i18n keys"
echo "  T003 → #$T003_NUM  | FR i18n keys"
echo "  T004 → #$T004_NUM  | Refactor NasScannerService"
echo "  T005 → #$T005_NUM  | Update component for renamed signals"
echo "  T006 → #$T006_NUM  | Decouple location buttons"
echo "  T007 → #$T007_NUM  | Update template location buttons"
echo "  T008 → #$T008_NUM  | Add scanAndImport() to service"
echo "  T009 → #$T009_NUM  | Create ImportResultsComponent"
echo "  T010 → #$T010_NUM  | Wire triggerScanAndImport()"
echo "  T011 → #$T011_NUM  | Update template — Scan & Import"
echo "  T012 → #$T012_NUM  | Add autoImport() to service"
echo "  T013 → #$T013_NUM  | Add triggerAutoImport()"
echo "  T014 → #$T014_NUM  | Update template — Auto Import"
echo "  T015 → #$T015_NUM  | SCSS for auto-import section"
echo "  T016 → #$T016_NUM  | Verify EN translations"
echo "  T017 → #$T017_NUM  | Verify FR translations"
echo "  T018 → #$T018_NUM  | Verify loading state"
echo "  T019 → #$T019_NUM  | Verify results persistence"
echo "  T020 → #$T020_NUM  | Verify Scan All regression"
echo "  T021 → #$T021_NUM  | Verify location button path replacement"
echo ""
echo "View all issues: https://github.com/paz-dev-com/MediaHandler.Web/issues?q=label%3Anas-scanner"

