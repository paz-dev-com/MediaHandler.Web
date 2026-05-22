# Quickstart: Media File Linking & Missing Content Detection

**Feature**: 007-media-file-linking  
**Date**: 2026-05-21

---

## Prerequisites

- .NET 10 SDK + PostgreSQL running locally
- Node.js 22+ with `npm` (or `pnpm`)
- Both repos cloned side-by-side:
  - `MediaHandler.API/`
  - `MediaHandler.Web/`

---

## Backend Setup (MediaHandler.API)

### 1. Apply EF Core Migration

```bash
cd MediaHandler.API
dotnet ef migrations add AddMediaRootFolder \
  --project MediaHandler.Infrastructure \
  --startup-project MediaHandler.API

dotnet ef database update \
  --project MediaHandler.Infrastructure \
  --startup-project MediaHandler.API
```

**Verify**: New column `root_folder text NULL` exists in the `Medias` table.

### 2. Build & Run API

```bash
dotnet build
dotnet run --project MediaHandler.API
# API starts at https://localhost:7001 (or configured port)
```

### 3. Verify New Endpoints

Using curl or Swagger UI (`/swagger`):

```bash
# Get completeness for a known TV show ID
curl -H "Authorization: Bearer <token>" \
     https://localhost:7001/api/v1/media/<tvShowId>/completeness

# Expected: array of SeasonCompletenessDto (empty array if no TvSeason data)

# List unlinked files (admin token required)
curl -H "Authorization: Bearer <admin-token>" \
     "https://localhost:7001/api/v1/admin/media/unlinked-files?page=1&pageSize=5"

# Expected: paginated list of MediaFile rows with MediaId == null
```

---

## Frontend Setup (MediaHandler.Web)

### 1. Install Dependencies

No new packages required. Existing PrimeNG, Transloco, and Angular are sufficient.

```bash
cd MediaHandler.Web
npm install   # or: pnpm install
```

### 2. Generate Environment

```bash
node scripts/generate-env.mjs
```

### 3. Run Dev Server

```bash
npm start
# App available at http://localhost:4200
```

---

## Verification Checklist

### US1 — File Linking from Detail Page

- [ ] Navigate to any TV show or film detail page as **admin**.
- [ ] Confirm the "Files" section shows existing linked files with an "Unlink" button per file.
- [ ] Click "Link File" → dialog opens with paginated list of unlinked files.
- [ ] Select a file and click "Link" → file appears in the list; dialog closes.
- [ ] Click "Unlink" on a file → file disappears from list.
- [ ] Navigate as **non-admin** user → confirm "Unlink" and "Link File" buttons are NOT visible.

### US2 — Root Folder

- [ ] Detail page shows "Root Folder" section with auto-derived path (from linked files).
- [ ] Click "Open in explorer" → path is copied to clipboard (toast confirms).
- [ ] Block clipboard access in browser settings → fallback text field appears with path.
- [ ] Edit the root folder path and save → change persists across page reload.
- [ ] Unset the override (clear field, save) → auto-derived path is shown again.
- [ ] Media item with no files → "No root folder" empty state is shown.

### US3 — Season Completeness

- [ ] TV show detail page shows "Completeness" section.
- [ ] Season 0 is NOT listed.
- [ ] Seasons with all episodes owned show a ✅ "Complete" badge.
- [ ] Seasons with missing episodes list the specific missing episode numbers.
- [ ] TV show with no TvSeason data → "Metadata not available" message shown.
- [ ] Film detail page → NO "Completeness" section present.

### US4 — Parent Folder Filter Label

- [ ] Navigate to Admin → Parent Folders page.
- [ ] The filter dropdown shows "TMDB Assigned (Pending Import)" (EN) / "TMDB assigné (import en attente)" (FR).
- [ ] Selecting this filter returns only folders with `status=Assigned` (not InCollection).
- [ ] "In Collection" filter still works correctly.

---

## Running Tests

### Frontend (Vitest)

```bash
cd MediaHandler.Web
npm test
# or: npx vitest run
```

New test files to verify pass:

- `src/app/features/media-detail/root-folder.component.spec.ts`
- `src/app/features/media-detail/file-link-picker-dialog.component.spec.ts`
- `src/app/features/media-detail/season-completeness.component.spec.ts`
- `src/app/core/services/admin-media-file-link.service.spec.ts`

### Backend (xUnit)

```bash
cd MediaHandler.API
dotnet test
```

New test files to verify pass:

- `MediaHandler.Tests/Features/Media/GetMediaCompletenessQueryHandlerTests.cs`
- `MediaHandler.Tests/Features/Media/LinkMediaFileCommandHandlerTests.cs`
- `MediaHandler.Tests/Features/Media/UnlinkMediaFileCommandHandlerTests.cs`
- `MediaHandler.Tests/Features/Media/UpdateMediaRootFolderCommandHandlerTests.cs`
- `MediaHandler.Tests/Features/Files/GetUnlinkedFilesQueryHandlerTests.cs`
