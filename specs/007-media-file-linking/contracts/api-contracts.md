# API Contracts: Media File Linking & Missing Content Detection

**Feature**: 007-media-file-linking  
**Date**: 2026-05-21  
**Base URL**: `/api/v1`

---

## New Endpoints

### 1. GET `/media/{id}/completeness`

**Controller**: `MediaController` (existing, `[Authorize]`)  
**Purpose**: Returns per-season completeness data for a TV show. Films return 400.

**Request**

```
GET /api/v1/media/{id}/completeness
Authorization: Bearer <token>
```

| Parameter | Type   | Location | Required | Description     |
| --------- | ------ | -------- | -------- | --------------- |
| `id`      | `Guid` | path     | ✅       | Media entity ID |

**Response — 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "seasonNumber": 1,
      "seasonName": "Season 1",
      "totalExpected": 10,
      "ownedCount": 8,
      "missingEpisodeNumbers": [3, 7],
      "isComplete": false
    },
    {
      "seasonNumber": 2,
      "seasonName": "Season 2",
      "totalExpected": 8,
      "ownedCount": 8,
      "missingEpisodeNumbers": [],
      "isComplete": true
    }
  ]
}
```

**Response — 400 Bad Request** (called on a Film)

```json
{
  "success": false,
  "errors": [
    { "code": "MEDIA_TYPE_INVALID", "message": "Completeness is only supported for TV shows." }
  ]
}
```

**Response — 404 Not Found**

```json
{ "success": false, "errors": [{ "code": "NOT_FOUND", "message": "Media 'id' not found." }] }
```

**Notes**:

- Season 0 and seasons named "Specials" (case-insensitive) are excluded.
- Empty array returned when the TV show has no enriched `TvSeason` records.

---

### 2. GET `/admin/media/unlinked-files`

**Controller**: `AdminMediaFilesController` (NEW, `[Authorize(Policy = "AdminOnly")]`)  
**Purpose**: Paginated list of `MediaFile` rows not assigned to any `Media` (i.e., `MediaId IS NULL`).

**Request**

```
GET /api/v1/admin/media/unlinked-files?page=1&pageSize=20
Authorization: Bearer <admin-token>
```

| Parameter  | Type  | Location | Required | Default | Description         |
| ---------- | ----- | -------- | -------- | ------- | ------------------- |
| `page`     | `int` | query    | ❌       | 1       | 1-based page number |
| `pageSize` | `int` | query    | ❌       | 20      | Max 100             |

**Response — 200 OK**

```json
{
  "success": true,
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "filePath": "/nas/Movies/Inception (2010)/Inception.mkv",
      "fileSizeBytes": 8589934592,
      "format": "mkv",
      "resolution": "1080p"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 47,
    "totalPages": 3
  }
}
```

---

### 3. PUT `/admin/media/{mediaId}/files/{fileId}/link`

**Controller**: `AdminMediaFilesController` (NEW, `[Authorize(Policy = "AdminOnly")]`)  
**Purpose**: Sets `MediaFile.MediaId = mediaId`.

**Request**

```
PUT /api/v1/admin/media/{mediaId}/files/{fileId}/link
Authorization: Bearer <admin-token>
```

| Parameter | Type   | Location | Required | Description            |
| --------- | ------ | -------- | -------- | ---------------------- |
| `mediaId` | `Guid` | path     | ✅       | Target Media entity ID |
| `fileId`  | `Guid` | path     | ✅       | MediaFile entity ID    |

No request body.

**Response — 204 No Content** (success)

**Response — 404 Not Found**

```json
{ "success": false, "errors": [{ "code": "MEDIA_NOT_FOUND", "message": "Media 'mediaId' not found." }] }
{ "success": false, "errors": [{ "code": "FILE_NOT_FOUND", "message": "MediaFile 'fileId' not found." }] }
```

**Response — 422 Unprocessable Entity** (file already linked to another media)

```json
{
  "success": false,
  "errors": [
    {
      "code": "FILE_ALREADY_LINKED",
      "message": "MediaFile 'fileId' is already linked to media 'otherMediaId'."
    }
  ]
}
```

---

### 4. DELETE `/admin/media/{mediaId}/files/{fileId}/link`

**Controller**: `AdminMediaFilesController` (NEW, `[Authorize(Policy = "AdminOnly")]`)  
**Purpose**: Clears `MediaFile.MediaId` (sets to `null`).

**Request**

```
DELETE /api/v1/admin/media/{mediaId}/files/{fileId}/link
Authorization: Bearer <admin-token>
```

| Parameter | Type   | Location | Required | Description            |
| --------- | ------ | -------- | -------- | ---------------------- |
| `mediaId` | `Guid` | path     | ✅       | Target Media entity ID |
| `fileId`  | `Guid` | path     | ✅       | MediaFile entity ID    |

No request body.

**Response — 204 No Content** (success)

**Response — 404 Not Found**

```json
{
  "success": false,
  "errors": [
    {
      "code": "FILE_NOT_FOUND",
      "message": "MediaFile 'fileId' not found or not linked to this media."
    }
  ]
}
```

---

### 5. PATCH `/admin/media/{mediaId}/root-folder`

**Controller**: `AdminMediaFilesController` (NEW, `[Authorize(Policy = "AdminOnly")]`)  
**Purpose**: Set or clear the manual root folder override on a `Media` item.

**Request**

```
PATCH /api/v1/admin/media/{mediaId}/root-folder
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "rootFolder": "/nas/TV Shows/Breaking Bad"
}
```

| Body field   | Type             | Required | Description                                                              |
| ------------ | ---------------- | -------- | ------------------------------------------------------------------------ |
| `rootFolder` | `string \| null` | ✅       | New root folder path. Send `null` or empty string to clear the override. |

**Response — 204 No Content** (success)

**Response — 404 Not Found**

```json
{ "success": false, "errors": [{ "code": "NOT_FOUND", "message": "Media 'mediaId' not found." }] }
```

---

## Modified Endpoints

### GET `/media/{id}` (MODIFIED)

`MediaDto` gains one new field:

```json
{
  "id": "...",
  "title": "Breaking Bad",
  // ...existing fields...
  "rootFolder": "/nas/TV Shows/Breaking Bad" // NEW — null if no files and no override
}
```

The `rootFolder` value is resolved server-side:

1. If `Media.RootFolder` is set → return that value.
2. Else if linked files exist → return the common parent directory of all `MediaFile.FilePath` values.
3. Else → `null`.

---

## Unchanged Endpoints (No Backend Modification Needed)

### GET `/admin/parent-folders` (UNCHANGED)

The existing endpoint already supports `status=Assigned` (pending import only) and `status=InCollection` (fully in collection) as separate filter values. Only the **frontend i18n label** changes:

| i18n key                             | Old value (EN) | New value (EN)                     |
| ------------------------------------ | -------------- | ---------------------------------- |
| `admin.parentFolders.statusAssigned` | `"Assigned"`   | `"TMDB Assigned (Pending Import)"` |

| i18n key                             | Old value (FR) | New value (FR)                       |
| ------------------------------------ | -------------- | ------------------------------------ |
| `admin.parentFolders.statusAssigned` | `"Assigné"`    | `"TMDB assigné (import en attente)"` |
