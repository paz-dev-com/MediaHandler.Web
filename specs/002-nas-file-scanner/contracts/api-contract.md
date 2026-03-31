# API Contract: NAS File Scanner

**Feature**: 002-nas-file-scanner  
**Date**: 2026-03-24  
**Backend**: MediaHandler.API (ASP.NET Core, base URL: `/api/v1/`)

## Files Endpoints

### POST /api/v1/files/scan

Triggers a scan of the NAS file system. Discovers new media files and adds them to the database.

- **Auth**: Admin only (`AdminOnly` policy)
- **Rate Limited**: Yes (fixed window)
- **Query Parameters**:
  - `basePath` (string, optional) — Directory path on the NAS to scan. Must fall within configured base paths. Defaults to scanning all configured base paths.
- **Request Body**: Empty
- **Response**: `ApiResponse<ScanNasResult>`

#### ScanNasResult

| Field           | Type     | Description                                           |
| --------------- | -------- | ----------------------------------------------------- |
| `newFiles`      | `number` | Count of newly discovered files added to the database |
| `existingFiles` | `number` | Count of files that already existed in the database   |
| `totalScanned`  | `number` | Total number of files scanned on the NAS              |

#### Success Response Example

```json
{
  "data": {
    "newFiles": 5,
    "existingFiles": 120,
    "totalScanned": 125
  },
  "meta": null,
  "errors": null
}
```

#### Error Responses

- `403 Forbidden` — User is not an admin
- `400 Bad Request` — Invalid base path (outside allowed paths)
- `500 Internal Server Error` — NAS connection failure

## TypeScript Interface

```typescript
export interface ScanNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
}
```
