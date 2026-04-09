# API Contract: Scan & Import

**Feature**: 003-scan-and-import  
**Date**: 2026-04-09  
**Backend**: MediaHandler.API (ASP.NET Core, base URL: `/api/v1/`)

All endpoints require Auth0 JWT Bearer authentication and Admin role. All responses use the `ApiResponse<T>` envelope.

## Existing Endpoints (unchanged, for reference)

### POST /api/v1/files/scan

Triggers a scan of the NAS file system. Discovers new media files and adds them to the database.

- **Auth**: Admin only
- **Query Parameters**:
  - `basePath` (string, optional) — Directory path on the NAS to scan. Defaults to scanning all configured base paths.
- **Request Body**: Empty `{}`
- **Response**: `ApiResponse<ScanNasResult>`

#### ScanNasResult

| Field           | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `newFiles`      | `number` | Count of newly discovered files added to the database |
| `existingFiles` | `number` | Count of files that already existed in the database   |
| `totalScanned`  | `number` | Total number of files scanned on the NAS              |
| `foldersFound`  | `number` | Number of folders traversed during scan               |

### GET /api/v1/files/locations

Returns configured NAS base paths.

- **Auth**: Admin only
- **Response**: `ApiResponse<string[]>`

---

## New Endpoints

### POST /api/v1/files/scan-and-import

Triggers a combined NAS scan and TMDB auto-import. Scans files from the NAS, then automatically matches newly discovered files against TMDB metadata and links them in the database.

- **Auth**: Admin only
- **Query Parameters**:
  - `basePath` (string, optional) — Directory path on the NAS to scan. Defaults to scanning all configured base paths.
  - `language` (string, optional) — BCP-47 language code (e.g., `"en"`, `"fr"`) for TMDB metadata retrieval. Defaults to `"en"` if not specified.
- **Request Body**: Empty `{}`
- **Response**: `ApiResponse<ScanAndImportNasResult>`

#### ScanAndImportNasResult

| Field           | Type       | Description                                              |
| --------------- | ---------- | -------------------------------------------------------- |
| `newFiles`      | `number`   | Count of newly discovered files added to the database    |
| `existingFiles` | `number`   | Count of files that already existed in the database      |
| `totalScanned`  | `number`   | Total number of files scanned on the NAS                 |
| `foldersFound`  | `number`   | Number of folders traversed during scan                  |
| `matched`       | `number`   | Count of files successfully matched to TMDB entries      |
| `skipped`       | `number`   | Count of files skipped (already linked or not matchable) |
| `failed`        | `number`   | Count of files that failed TMDB matching                 |
| `errors`        | `string[]` | Error detail strings for each file that failed import    |

#### Success Response Example

```json
{
  "data": {
    "newFiles": 12,
    "existingFiles": 88,
    "totalScanned": 100,
    "foldersFound": 15,
    "matched": 10,
    "skipped": 1,
    "failed": 1,
    "errors": ["Could not match file 'The.Unknown.Movie.2025.mkv': No TMDB result found"]
  },
  "meta": null,
  "errors": []
}
```

#### Error Responses

- `400 Bad Request` — Invalid base path (outside allowed paths)
- `401 Unauthorized` — Missing or invalid JWT
- `403 Forbidden` — User is not an admin
- `500 Internal Server Error` — NAS connection failure or unhandled server error

---

### POST /api/v1/files/auto-import

Retries TMDB matching for all previously scanned but unlinked media files. Does not scan the NAS — operates only on existing unlinked records in the database.

- **Auth**: Admin only
- **Query Parameters**:
  - `language` (string, optional) — BCP-47 language code (e.g., `"en"`, `"fr"`) for TMDB metadata retrieval. Defaults to `"en"` if not specified.
- **Request Body**: Empty `{}`
- **Response**: `ApiResponse<AutoImportResult>`

#### AutoImportResult

| Field           | Type       | Description                                                 |
| --------------- | ---------- | ----------------------------------------------------------- |
| `totalUnlinked` | `number`   | Total number of unlinked files that were processed          |
| `matched`       | `number`   | Count of files successfully matched to TMDB entries         |
| `skipped`       | `number`   | Count of files skipped (not matchable or already attempted) |
| `failed`        | `number`   | Count of files that failed TMDB matching                    |
| `errors`        | `string[]` | Error detail strings for each file that failed import       |

#### Success Response Example

```json
{
  "data": {
    "totalUnlinked": 25,
    "matched": 20,
    "skipped": 3,
    "failed": 2,
    "errors": [
      "Could not match file 'random_video.avi': No TMDB result found",
      "Could not match file 'home_movie.mp4': TMDB API timeout"
    ]
  },
  "meta": null,
  "errors": []
}
```

#### Success Response Example (no unlinked files)

```json
{
  "data": {
    "totalUnlinked": 0,
    "matched": 0,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "meta": null,
  "errors": []
}
```

#### Error Responses

- `401 Unauthorized` — Missing or invalid JWT
- `403 Forbidden` — User is not an admin
- `500 Internal Server Error` — Unhandled server error

---

## TypeScript Interfaces

```typescript
// Existing (src/app/shared/models/scan.model.ts)
export interface ScanNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
  foldersFound: number;
}

// New
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

// New
export interface AutoImportResult {
  totalUnlinked: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}
```

## Frontend API Call Mapping

| UI Action             | Service Method                      | API Endpoint                         | Query Params             |
| --------------------- | ----------------------------------- | ------------------------------------ | ------------------------ |
| Click "Scan"          | `NasScannerService.scan()`          | `POST /api/v1/files/scan`            | `basePath?`              |
| Click "Scan & Import" | `NasScannerService.scanAndImport()` | `POST /api/v1/files/scan-and-import` | `basePath?`, `language?` |
| Click "Auto Import"   | `NasScannerService.autoImport()`    | `POST /api/v1/files/auto-import`     | `language?`              |

## Error Response Format

All error responses use the standard `ApiResponse` envelope:

```json
{
  "data": null,
  "meta": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable error message"
    }
  ]
}
```
