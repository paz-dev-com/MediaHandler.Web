# Quickstart: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24

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

## Frontend Development

### Key files to modify

| Area                | Files                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Icon fixes          | Global SCSS, component styles with `.rounded-icon-btn`, ThemeToggleComponent             |
| i18n                | `src/assets/i18n/en.json`, `src/assets/i18n/fr.json`, all components with hardcoded text |
| Date format         | New `LocaleDatePipe` in `src/app/shared/pipes/`                                          |
| Library root dialog | `add-library-root-dialog.component.ts/html`                                              |
| Wishlist indicator  | `tmdb-search-page.component.ts`, `tmdb-result-card.component.ts/html/scss`               |
| TV show status      | `media-detail-page.component.ts/html`, `season-list.component.ts/html`                   |
| Profile picture     | `profile-page.component.ts/html/scss`, `profile.service.ts`                              |
| Nav user info       | `sidebar.component.ts/html/scss`                                                         |
| Warning fixes       | Various components (audit console output)                                                |

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

- [ ] All icons render glyphs in dark and light mode on every page
- [ ] All text is translated when switching between EN and FR
- [ ] Dates format as DD/MM/YYYY (FR) and MM/DD/YYYY (EN)
- [ ] Scan uses active UI language for TMDB queries
- [ ] Library root dialog shows root folder dropdown from API
- [ ] Wishlist indicator appears on TMDB search result cards
- [ ] TV show detail page shows production status and missing seasons
- [ ] Profile page shows auth provider picture by default, supports custom upload
- [ ] Navigation menu shows user name and profile picture
- [ ] Zero console warnings during full app walkthrough
- [ ] Zero compilation warnings on production build
