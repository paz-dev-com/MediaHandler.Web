# Implementation Plan: NAS File Scanner

**Branch**: `002-nas-file-scanner` | **Date**: 2026-03-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-nas-file-scanner/spec.md`

## Summary

Add a new "NAS Scanner" feature page to the existing Angular 21 web application. The page allows admin users to trigger a NAS file system scan via the existing `POST /api/v1/files/scan` backend endpoint, optionally specifying a base path, and displays scan results (new files, existing files, total scanned). The feature integrates into the existing sidebar navigation and follows all established patterns (lazy-loaded routes, OnPush, signals, PrimeNG, transloco i18n).

## Technical Context

**Language/Version**: TypeScript 5.9 / Angular 21.1  
**Primary Dependencies**: PrimeNG 21.x (UI components), `@jsverse/transloco` (i18n) — no new dependencies needed  
**Existing Infrastructure**: `ApiService` (HTTP client), `AuthService` (user/role info), error interceptor, i18n loader, sidebar navigation  
**Testing**: Vitest 4.0.8 with jsdom, Angular TestBed  
**Project Type**: web-application (SPA) — extending existing app  
**Constraints**: Standalone components only, OnPush change detection, signals-first state, lazy-loaded routes

## Project Structure

### New Files

```text
src/app/features/nas-scanner/
├── nas-scanner.routes.ts                    # Lazy-loaded child routes
├── nas-scanner-page.component.ts            # Main scan page (form + results)
├── nas-scanner-page.component.html          # Page template
├── nas-scanner-page.component.scss          # Page styles
├── scan-results.component.ts                # Scan results display (stat cards)
└── nas-scanner.service.ts                   # Scan state management + API calls
```

### Modified Files

```text
src/app/app.routes.ts                        # Add lazy-loaded route for /nas-scanner
src/app/core/layout/sidebar.component.ts     # Add NAS Scanner nav item (admin only)
src/assets/i18n/en.json                      # Add nasScanner i18n keys
src/assets/i18n/fr.json                      # Add nasScanner i18n keys (French)
```

### API Contract

**Endpoint**: `POST /api/v1/files/scan`

- **Auth**: Admin only
- **Query Parameters**: `basePath` (string, optional)
- **Response**: `ApiResponse<ScanNasResult>`

```typescript
interface ScanNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
}
```

## Implementation Approach

1. **Service**: `NasScanner​Service` wraps `ApiService.post('files/scan', {}, { basePath })`, manages `scanning` / `result` / `error` signals
2. **Page component**: Form with optional base path `InputText` + `Button`, consumes service signals for loading/result states
3. **Results component**: Receives `ScanNasResult` via input, displays 3 stat cards (PrimeNG Card)
4. **Route**: Lazy-loaded under `/nas-scanner`, protected by `authGuard` + admin role guard
5. **Sidebar**: Add nav item conditionally for admin users
6. **i18n**: Add `nasScanner.*` keys to both `en.json` and `fr.json`

## Complexity Tracking

No constitution violations — this is a minimal feature addition following all existing patterns.
