# API Contract Changes: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24

## Modified Endpoints

### 1. POST /api/v1/admin/scan — Start Scan

**Change**: Add optional `language` field to request body.

**Request Body** (modified):

```json
{
  "libraryRootIds": ["guid", "..."],
  "mode": "Full" | "Incremental",
  "language": "en" | "fr" | null
}
```

**Response**: Unchanged (202 Accepted with `ScanRunSummaryResponse`).

**Notes**: When `language` is null/omitted, the API falls back to its default behavior (currently no language filter on TMDB queries).

---

### 2. GET /api/v1/media/{id} — Get Media Detail

**Change**: Response DTO extended with `status` and `numberOfSeasons`.

**Response Body** (extended fields only):

```json
{
  "data": {
    "...existing fields...",
    "status": "Returning Series" | "Ended" | "Released" | null,
    "numberOfSeasons": 5 | null
  }
}
```

**Notes**: `status` and `numberOfSeasons` are populated from the `Media` entity (filled during TMDB enrichment). `null` for films or when data is unavailable.

---

### 3. GET /api/v1/auth/me — Get Current User

**Change**: Response DTO extended with `profilePicturePath`.

**Response Body** (extended fields only):

```json
{
  "data": {
    "...existing fields...",
    "profilePicturePath": "/uploads/profile-pictures/user-guid.jpg" | null
  }
}
```

---

### 4. POST /api/v1/auth/sync — Sync User

**Change**: Response DTO extended with `profilePicturePath` (same as above, via `UserDto`).

---

## New Endpoints

### 5. POST /api/v1/users/profile-picture — Upload Profile Picture

**Authorization**: Authenticated user (acts on current user).

**Request**: `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary | Yes | Image file (JPEG, PNG, or WebP, ≤ 2MB) |

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "id": "guid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "preferredLanguage": "en",
    "role": "User",
    "isActive": true,
    "profilePicturePath": "/uploads/profile-pictures/user-guid.jpg"
  }
}
```

**Error Responses**:

- `400 Bad Request` — Invalid file type or file exceeds 2MB.
- `401 Unauthorized` — Not authenticated.

---

### 6. DELETE /api/v1/users/profile-picture — Remove Profile Picture

**Authorization**: Authenticated user (acts on current user).

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": {
    "...UserDto with profilePicturePath: null..."
  }
}
```

**Error Responses**:

- `401 Unauthorized` — Not authenticated.
- `404 Not Found` — No custom profile picture to remove.

---

## Existing Endpoints (No Changes)

### GET /api/v1/files/locations — Get NAS Locations

Already exists. Returns `string[]` from `Nas.BasePaths` config. Used by the frontend for the root folder dropdown.

**Response** (200 OK):

```json
{
  "succeeded": true,
  "data": ["/Disque NAS 1", "/Disque NAS 2"]
}
```

---

## Frontend Service Contracts

### AdminScanService.startScan()

**Change**: Add `language` parameter.

```typescript
startScan(libraryRootIds: string[], mode: ScanMode, language?: string): void
// POST body: { libraryRootIds, mode, language }
```

### ProfileService

**New methods**:

```typescript
uploadProfilePicture(file: File): void
// POST /api/v1/users/profile-picture (multipart/form-data)
// Updates user signal on success

removeProfilePicture(): void
// DELETE /api/v1/users/profile-picture
// Updates user signal on success (profilePicturePath → null)
```

### AdminFilesService (or AdminLibraryRootService extension)

**New method**:

```typescript
getLocations(): Observable<ApiResponse<string[]>>
// GET /api/v1/files/locations
```
