# Data Model: Scan & Import

**Feature**: 003-scan-and-import  
**Date**: 2026-04-09  
**Source**: Feature spec + existing `scan.model.ts` + backend API contracts

## Existing Entities (unchanged)

### ScanNasResult

Existing result from the scan-only endpoint. **No modifications needed.**

| Field           | Type     | Required | Description                                           |
| --------------- | -------- | -------- | ----------------------------------------------------- |
| `newFiles`      | `number` | Yes      | Count of newly discovered files added to the database |
| `existingFiles` | `number` | Yes      | Count of files that already existed in the database   |
| `totalScanned`  | `number` | Yes      | Total number of files scanned on the NAS              |
| `foldersFound`  | `number` | Yes      | Number of folders traversed during scan               |

**File**: `src/app/shared/models/scan.model.ts`

## New Entities

### ScanAndImportNasResult

Result from the combined scan-and-import endpoint. Contains all scan statistics plus import statistics from TMDB auto-matching.

| Field           | Type       | Required | Description                                                     |
| --------------- | ---------- | -------- | --------------------------------------------------------------- |
| `newFiles`      | `number`   | Yes      | Count of newly discovered files added to the database           |
| `existingFiles` | `number`   | Yes      | Count of files that already existed in the database             |
| `totalScanned`  | `number`   | Yes      | Total number of files scanned on the NAS                        |
| `foldersFound`  | `number`   | Yes      | Number of folders traversed during scan                         |
| `matched`       | `number`   | Yes      | Count of files successfully matched to TMDB entries             |
| `skipped`       | `number`   | Yes      | Count of files skipped (already linked or not matchable)        |
| `failed`        | `number`   | Yes      | Count of files that failed TMDB matching                        |
| `errors`        | `string[]` | Yes      | List of error detail strings for individual file-level failures |

**Validation rules**:

- `matched + skipped + failed` should equal the total of files that went through the import process
- `errors.length` should equal `failed` (one error message per failed file)
- All numeric fields ≥ 0

**File**: `src/app/shared/models/scan.model.ts`

### AutoImportResult

Result from the auto-import endpoint. Contains only import statistics (no scan statistics — operates on already-scanned unlinked files).

| Field           | Type       | Required | Description                                                     |
| --------------- | ---------- | -------- | --------------------------------------------------------------- |
| `totalUnlinked` | `number`   | Yes      | Total number of unlinked files that were processed              |
| `matched`       | `number`   | Yes      | Count of files successfully matched to TMDB entries             |
| `skipped`       | `number`   | Yes      | Count of files skipped (not matchable or already attempted)     |
| `failed`        | `number`   | Yes      | Count of files that failed TMDB matching                        |
| `errors`        | `string[]` | Yes      | List of error detail strings for individual file-level failures |

**Validation rules**:

- `matched + skipped + failed` should equal `totalUnlinked`
- `errors.length` should equal `failed`
- All numeric fields ≥ 0
- When no unlinked files exist, all counts are 0 and `errors` is empty

**File**: `src/app/shared/models/scan.model.ts`

## TypeScript Interfaces

All interfaces are co-located in `src/app/shared/models/scan.model.ts`:

```typescript
// Existing — no changes
export interface ScanNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
  foldersFound: number;
}

// New — combined scan + TMDB import result
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

// New — auto-import result (unlinked files only)
export interface AutoImportResult {
  totalUnlinked: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}
```

## Entity Relationships

```
POST /files/scan           → ScanNasResult
POST /files/scan-and-import → ScanAndImportNasResult (superset of ScanNasResult + import stats)
POST /files/auto-import     → AutoImportResult (import stats only, no scan stats)
```

`ScanAndImportNasResult` shares the same scan-statistic fields as `ScanNasResult` but is a separate interface (not an extension) because the backend returns them as distinct DTOs. The `ScanResultsComponent` accepts `ScanNasResult` and can also accept the scan-statistic subset of `ScanAndImportNasResult` since the fields are structurally compatible (TypeScript structural typing).

## State Transitions

### NAS Scanner Page Operation States

```
Idle           → [click Scan]           → Loading → Scan Complete (show ScanNasResult)
Idle           → [click Scan & Import]  → Loading → Scan & Import Complete (show ScanAndImportNasResult)
Idle           → [click Auto Import]    → Loading → Auto Import Complete (show AutoImportResult)
Any Complete   → [click any action]     → Loading (previous results visible) → New Complete (replaces previous)
Loading        → [error]                → Error (previous results preserved)
```

### Button State Rules

```
Loading = true  → All buttons disabled, input disabled, spinner shown
Loading = false → All buttons enabled, input enabled, spinner hidden
```

