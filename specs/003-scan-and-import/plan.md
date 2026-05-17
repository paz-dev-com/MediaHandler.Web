# Implementation Plan: Scan & Import

**Branch**: `003-scan-and-import` | **Date**: 2026-04-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-scan-and-import/spec.md`

## Summary

Enhance the existing NAS Scanner page to decouple location-button clicks from auto-scanning (buttons now populate the path input only), add a combined "Scan & Import" action that scans NAS files and auto-matches them against TMDB in one step, and add a standalone "Auto Import" action for retrying TMDB matching on previously unlinked files. Results for import operations are displayed in collapsible accordion panels below the existing stat cards. All new UI elements support English and French via Transloco. No new routes or pages are needed — the feature modifies the existing `nas-scanner` feature module in-place.

## Technical Context

**Language/Version**: TypeScript 5.9 / Angular 21.2  
**Primary Dependencies**: PrimeNG 21.x (existing — Accordion, Button, Card, InputText, ProgressSpinner), `@jsverse/transloco` (existing i18n) — no new dependencies required  
**Existing Infrastructure**: `ApiService` (HTTP client), `AuthService` (user/role info), `NasScannerService` (scan state + API), `ScanResultsComponent` (stat cards), `TranslocoService` (active language), error interceptor, admin guard, sidebar navigation  
**Storage**: N/A (frontend only)  
**Testing**: Vitest 4.0.8 with jsdom, Angular TestBed  
**Target Platform**: Modern evergreen browsers, desktop and tablet viewports (360px–2560px)  
**Project Type**: web-application (SPA) — extending existing feature  
**Performance Goals**: LCP < 2.5s, FID < 100ms, CLS < 0.1  
**Constraints**: Standalone components only, OnPush change detection, signals-first state, lazy-loaded routes, bundle budget < 500kB warning / 1MB error  
**Scale/Scope**: Single admin user at a time; enhances 1 existing page; 2 new API integrations

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Research Check

| Principle                         | Status | Notes                                                                                                                  |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability | PASS   | Standalone components, signals-first state, strict TS, OnPush — all aligned with existing patterns                     |
| II. Testing Standards             | PASS   | Vitest configured; unit tests planned for new service methods, new components, and modified component behavior         |
| III. User Experience Consistency  | PASS   | PrimeNG Accordion/Card for consistent UI; loading states, error feedback, collapsible results per spec; bilingual i18n |
| IV. Performance Requirements      | PASS   | No new dependencies (zero bundle impact); Accordion already tree-shakeable from PrimeNG; lazy-loaded route preserved   |
| Technical Decision Framework      | PASS   | No new third-party dependencies — all changes use existing stack (PrimeNG, Transloco, Angular signals)                 |

### Post-Design Check

| Principle                         | Status | Notes                                                                                                                                                 |
| --------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Code Quality & Maintainability | PASS   | New components (ImportResultsComponent) < 100 lines each; service methods follow existing pattern; no `any` types; all standalone                     |
| II. Testing Standards             | PASS   | Service: test scanAndImport(), autoImport(), modified scan(); Components: test accordion expand/collapse, error list rendering, button disable states |
| III. User Experience Consistency  | PASS   | Collapsible accordion for import results; loading spinner during operations; all buttons disabled during operations; i18n for all new text            |
| IV. Performance Requirements      | PASS   | No new dependencies; PrimeNG Accordion tree-shaken; no new routes; no impact on initial bundle; OnPush on all components                              |
| Technical Decision Framework      | PASS   | Simplest approach: extend existing service + page component; new child component for import results only. No unnecessary abstractions.                |

**Gate result**: PASS — no violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-scan-and-import/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — entity models
├── quickstart.md        # Phase 1 output — setup & run guide
├── contracts/           # Phase 1 output — API integration contracts
│   └── api-contract.md
├── checklists/
│   └── requirements.md  # Requirements checklist (pre-existing)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── features/
│   │   └── nas-scanner/
│   │       ├── nas-scanner-page.component.ts       # MODIFIED — decouple location click, add Scan & Import / Auto Import buttons
│   │       ├── nas-scanner-page.component.html      # MODIFIED — restructured template with 3 action buttons + auto-import section
│   │       ├── nas-scanner-page.component.scss      # MODIFIED — styles for auto-import section separator
│   │       ├── nas-scanner.service.ts               # MODIFIED — add scanAndImport(), autoImport() methods + new signals
│   │       ├── nas-scanner.routes.ts                # UNCHANGED
│   │       ├── scan-results.component.ts            # UNCHANGED (stat cards remain as-is)
│   │       └── import-results.component.ts          # NEW — collapsible accordion for import stats + error list
│   └── shared/
│       └── models/
│           └── scan.model.ts                        # MODIFIED — add ScanAndImportNasResult, AutoImportResult interfaces
├── assets/
│   └── i18n/
│       ├── en.json                                  # MODIFIED — add nasScanner.scanAndImport.*, nasScanner.autoImport.* keys
│       └── fr.json                                  # MODIFIED — add French translations for new keys
```

**Structure Decision**: No new feature modules or routes. The scan-and-import functionality is an enhancement of the existing NAS Scanner page. One new presentational component (`ImportResultsComponent`) is extracted for the collapsible import results accordion, keeping the page component under the 200-line limit. The existing `ScanResultsComponent` (stat cards) is reused without modification.

## Complexity Tracking

No constitution violations detected — this section is intentionally empty.
