# Quickstart: Scan & Import

**Feature**: 003-scan-and-import  
**Date**: 2026-04-09

## Prerequisites

- Node.js 20+ and npm 11+
- Angular CLI 21.x (`npm install -g @angular/cli`)
- Running instance of MediaHandler.API with the scan-and-import and auto-import endpoints deployed
- Auth0 account configured (existing from 001)
- Admin role assigned to your test user

## Install Dependencies

```bash
cd MediaHandler.Web

# No new dependencies required — all packages are already installed:
# - primeng (Accordion, Button, Card, InputText, ProgressSpinner)
# - @jsverse/transloco (i18n)
# - @angular/core (signals)
```

## Environment Configuration

No changes needed — the existing `src/environments/environment.ts` already has the correct `apiBaseUrl` pointing to the backend.

## Run Development Server

```bash
npm start
# Application available at http://localhost:4200
# Navigate to the NAS Scanner page via the sidebar (admin only)
```

## Run Tests

```bash
npm test
```

## Verify Feature

1. **Login as admin** — ensure your Auth0 user has the Admin role
2. **Navigate to NAS Scanner** — click "NAS Scanner" in the sidebar
3. **Test location selection** — click a NAS location button → verify path appears in input without triggering a scan
4. **Test Scan** — click "Scan" → verify scan results appear as stat cards
5. **Test Scan & Import** — enter a path → click "Scan & Import" → verify scan stat cards + collapsible import results accordion appear
6. **Test Auto Import** — click "Auto Import" (no path needed) → verify collapsible import results accordion appears
7. **Test i18n** — switch language to French → verify all new labels appear in French
8. **Test loading state** — during any operation, verify all buttons and input are disabled

## Key Files Modified/Created

| File                                                         | Change                                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| `src/app/shared/models/scan.model.ts`                       | Add `ScanAndImportNasResult`, `AutoImportResult` interfaces         |
| `src/app/features/nas-scanner/nas-scanner.service.ts`        | Add `scanAndImport()`, `autoImport()` methods + new result signals  |
| `src/app/features/nas-scanner/nas-scanner-page.component.ts` | Decouple location click, add new action buttons                     |
| `src/app/features/nas-scanner/nas-scanner-page.component.html` | Restructured template with 3 actions + auto-import section       |
| `src/app/features/nas-scanner/nas-scanner-page.component.scss` | Styles for auto-import section separator                         |
| `src/app/features/nas-scanner/import-results.component.ts`   | **NEW** — collapsible accordion for import stats + error list       |
| `src/assets/i18n/en.json`                                    | Add `nasScanner.scanAndImport.*`, `nasScanner.autoImport.*` keys    |
| `src/assets/i18n/fr.json`                                    | Add French translations for new keys                                |

## Backend API Requirements

The following backend endpoints must be available:

| Endpoint                              | Status    | Description                        |
| ------------------------------------- | --------- | ---------------------------------- |
| `POST /api/v1/files/scan`            | Existing  | Scan NAS files                     |
| `GET /api/v1/files/locations`        | Existing  | Get configured NAS base paths      |
| `POST /api/v1/files/scan-and-import` | **New**   | Combined scan + TMDB auto-import   |
| `POST /api/v1/files/auto-import`     | **New**   | Retry TMDB matching on unlinked    |

API source: MediaHandler.API  
See: [contracts/api-contract.md](contracts/api-contract.md) for full endpoint specifications.

