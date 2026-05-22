# Quickstart: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24 (updated 2025-07-25 — added US-9 to US-15)

## Prerequisites

- Node.js 22+, npm 10+
- Angular CLI 21.x
- .NET 10 SDK (for API changes)
- Running instance of MediaHandler.API (for integration testing)

## Setup

```bash
# Ensure you're on the feature branch
cd /home/tpfeifer/Repos/MediaHandler/MediaHandler.Web
git checkout feature/006-app-enhancements

# Install dependencies (no new packages expected)
npm install

# Start dev server
npm start
# App available at http://localhost:4200
```

## API Changes Required (Backend)

These changes must be made in the `MediaHandler.API` solution at `/home/tpfeifer/Repos/MediaHandler/MediaHandler.API/`:

### 1. Extend StartScanRequest + StartScanCommand

```csharp
// ScanRequests.cs — add Language parameter
public record StartScanRequest(
    Guid[] LibraryRootIds,
    ScanMode Mode,
    string? Language = null);

// StartScanCommand.cs — add Language parameter
public record StartScanCommand(
    Guid[] LibraryRootIds,
    ScanMode Mode,
    string? Language = null) : IRequest<Result<ScanRunHandle>>;
```

The `AdminScanController.StartScan()` must pass `request.Language` to the command, and the command handler must forward it to `ScanStartParameters`.

### 2. Extend MediaDto

```csharp
// MediaDto.cs — add Status and NumberOfSeasons
public record MediaDto(
    // ...existing fields...
    string? Status,
    int? NumberOfSeasons);
```

Update the mapping profile to include these fields from the `Media` entity.

### 3. Add Profile Picture Endpoint

```csharp
// New endpoint in AuthController or a new UserProfileController
// POST /api/v1/users/profile-picture (multipart/form-data)
// DELETE /api/v1/users/profile-picture
```

Add `ProfilePicturePath` to `User` entity and `UserDto`. Create a database migration.

### 4. Add Pagination/Sort/Filter to Admin List Endpoints (US-9)

All paginated admin endpoints must accept and apply:

```
?page=1&pageSize=20&sortField=<field>&sortOrder=asc|desc&<filterField>=<value>
```

Response must change from `ApiResponse<T[]>` to `ApiResponse<PagedResult<T>>`:

```csharp
public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);
```

Affected controllers: `AdminUsersController`, `AdminReviewItemsController`, `AdminScanController` (decisions, history), `AdminEnrichmentController` (history), `AdminLibraryRootsController`.

### 5. Incremental Scan Counters (US-11)

Update `ScanCoordinator.ProcessFileAsync()` to call `scanRun.IncrementCount(category)` after each file outcome. The `GET /api/v1/admin/scan/active` endpoint must read live counter values from the in-memory `IScanRunStore`, not only from DB at completion.

### 6. Batch Assign Review Items (US-12)

```csharp
// New endpoint: POST /api/v1/admin/review-items/batch-assign
// New command: BatchAssignReviewItemsCommand(Guid[] ReviewItemIds, Guid TargetMediaId)
// Returns: BatchAssignReviewItemsResponse({ Results: [{ ReviewItemId, Success, ErrorMessage }] })
```

### 7. Collection Stats Endpoint (US-14)

```csharp
// New endpoint: GET /api/v1/media/stats
// Returns: CollectionStatsDto { TotalCount, TvShowCount, FilmCount, IncompleteTvShowCount }
// IncompleteTvShowCount: count of TV shows where NumberOfSeasons > owned TvSeason count
```

## Frontend Development

### Key files to modify

| Area                  | Files                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Icon fixes            | Global SCSS, component styles with `.rounded-icon-btn`, ThemeToggleComponent             |
| i18n                  | `src/assets/i18n/en.json`, `src/assets/i18n/fr.json`, all components with hardcoded text |
| Date format           | New `LocaleDatePipe` in `src/app/shared/pipes/`                                          |
| Library root dialog   | `add-library-root-dialog.component.ts/html`                                              |
| Wishlist indicator    | `tmdb-search-page.component.ts`, `tmdb-result-card.component.ts/html/scss`               |
| TV show status        | `media-detail-page.component.ts/html`, `season-list.component.ts/html`                   |
| Profile picture       | `profile-page.component.ts/html/scss`, `profile.service.ts`                              |
| Nav user info         | `sidebar.component.ts/html/scss`                                                         |
| Warning fixes         | Various components (audit console output)                                                |
| Table pagination/sort | All admin page components + shared `TableQueryParams` interface                          |
| Scan results position | `scan-results-page.component.ts` (in-place row update via `signal.update()`)             |
| Scanner counters      | `scanner-page.component.ts` (verify counter mapping from poll response)                  |
| Batch assign          | `review-items-page.component.ts`, new `batch-assign-dialog.component.ts/html`            |
| Enrichment detail     | `enrichment-page.component.ts`, new `enrichment-detail-panel.component.ts/html`          |
| Collection stats      | `collection-page.component.ts` (stats bar), media card completeness badge                |
| File location         | New `file-location.component.ts/html` in `src/app/shared/components/`                    |

### Running tests

```bash
# Unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

### Build verification

```bash
# Production build (must produce zero warnings)
npm run build

# Check bundle size against budgets
# Budgets enforced in angular.json: 500kB warning / 1MB error
```

## Verification Checklist

### US-1: Icon Visibility

- [ ] All icons render glyphs in dark and light mode on every page
- [ ] Dark/light mode toggle icon (sun/moon) is visible in nav menu

### US-2: Translation & Date Formatting

- [ ] All text is translated when switching between EN and FR
- [ ] Dates format as DD/MM/YYYY (FR) and MM/DD/YYYY (EN)
- [ ] Scan uses active UI language for TMDB queries
- [ ] Toast categories and status badges are translated

### US-3: Library Root Folder Selection

- [ ] Library root dialog shows root folder dropdown from API
- [ ] Composed path preview updates when root + sub-path are entered
- [ ] Fallback to manual entry when no roots are returned

### US-4: Wishlist Indicator on Search

- [ ] Wishlist indicator appears on TMDB search result cards for wishlisted items
- [ ] Indicator appears immediately after adding an item to the wishlist (no reload)

### US-5: TV Show Production Status & Missing Seasons

- [ ] TV show detail page shows production status badge (Still in Production / Ended)
- [ ] Missing seasons are highlighted on the seasons section

### US-6: Profile Picture Upload

- [ ] Profile page shows auth provider picture by default
- [ ] Custom upload replaces default; remove reverts to default
- [ ] Invalid file type/size rejected with clear error message

### US-7: User Info in Nav Menu

- [ ] Navigation menu shows user's name and profile picture next to logout button
- [ ] Compact layout on mobile viewport

### US-8: Frontend Warning Fixes

- [ ] Zero console warnings during full app walkthrough
- [ ] Zero compilation warnings on production build

### US-9: Pagination, Filtering & Sorting on All Tables

- [ ] All admin data tables show pagination controls (page selector, rows-per-page)
- [ ] Clicking column headers sorts ascending/descending
- [ ] Text column filters work with case-insensitive contains match
- [ ] Enum/status column filters show dropdown with all values
- [ ] Sort, filter, and pagination state preserved when navigating between pages

### US-10: Scan Results Position Retention

- [ ] After file assignment, scan results page stays on same pagination page
- [ ] Scroll position is preserved after assignment
- [ ] Active filters remain active after assignment

### US-11: Real-Time Scanner Counters

- [ ] Scanner counters begin updating within first 2 polling cycles (~8s) after scan starts
- [ ] All four counters (totalDiscovered, added, updated, needsReview) update during scan

### US-12: Review Item Batch Assignment

- [ ] Each review item row has a checkbox for selection
- [ ] "Select All" checkbox selects all items on current page
- [ ] "Batch Assign" button disabled when no items selected
- [ ] Batch assign dialog lets user search and select a media item
- [ ] All selected items assigned at once; per-item success/failure summary shown

### US-13: Enrichment Detailed Process View

- [ ] Running enrichment page shows per-item detail panel (title, folder, status)
- [ ] Progress indicator shows "X of Y items enriched"
- [ ] Panel gracefully falls back to minimal view if detail endpoint unavailable

### US-14: Collection Page Totals and Completeness

- [ ] Stats bar shows separate TV show count and film count
- [ ] Incomplete TV shows (missing seasons) are visually flagged on media cards
- [ ] Missing season numbers accessible via tooltip/expandable detail

### US-15: File Location Quick Access

- [ ] File location button visible on media detail pages with linked files
- [ ] Clicking button shows all file paths in popover/overlay
- [ ] Copy-to-clipboard works with feedback toast; fallback textarea when clipboard denied
- [ ] Button hidden/disabled for media items with no linked files
