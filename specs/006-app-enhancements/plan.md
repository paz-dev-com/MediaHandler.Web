# Implementation Plan: Application Enhancements

**Branch**: `develop` | **Date**: 2025-07-25 | **Spec**: [specs/006-app-enhancements/spec.md](./spec.md)  
**Input**: Feature specification from `specs/006-app-enhancements/spec.md`

## Summary

Deliver 15 user stories that harden the MediaHandler.Web Angular SPA and its .NET 10 backend across UX, i18n, admin tooling, and data visibility. The frontend work centres on: CSS/theming fixes for icon visibility (US-1), full EN/FR translation + locale-aware date formatting (US-2), pagination/sorting/filtering on every admin PrimeNG `p-table` (US-9), scan-results position retention (US-10), real-time scanner counter polling (US-11), and review-item batch assignment (US-12). Backend work centres on: extending `MediaDto` with production-status fields (US-5, US-14), adding a profile-picture upload endpoint and `User.ProfilePicturePath` column (US-6), passing `language` through the scan pipeline (US-2), enriching all paginated-list endpoints with sort/filter query params (US-9), updating scan-counter persistence to increment during scanning (US-11), a batch-assign endpoint for review items (US-12), and surfacing enrichment per-item detail via polling (US-13).

## Technical Context

**Language/Version**: TypeScript 5.x / Angular 21 (frontend); C# 12 / .NET 10 (backend — separate repo `MediaHandler.API`)  
**Primary Dependencies**: PrimeNG 17+, PrimeIcons, Transloco 7+, @auth0/auth0-angular, Angular Signals, MediatR (backend), EF Core 9 (backend)  
**Storage**: PostgreSQL (backend, via EF Core); local filesystem (profile-picture uploads in `wwwroot/uploads/profile-pictures/`)  
**Testing**: Vitest + Angular Testing Library (frontend unit/component); xUnit (backend — out of scope for this PR)  
**Target Platform**: Modern evergreen browsers (Chrome, Firefox, Safari, Edge); Angular SPA served from .NET Kestrel or Nginx  
**Project Type**: Web application — Angular standalone-component SPA (frontend) + .NET 10 REST API (backend)  
**Performance Goals**: LCP < 2.5 s, FID < 100 ms, CLS < 0.1 on 4G mobile; initial bundle ≤ 500 kB (warning) / 1 MB (error); component styles ≤ 4 kB  
**Constraints**: OnPush change detection mandatory; standalone components only; no NgModules; NgOptimizedImage required for all `<img>`; `any` type forbidden; bundle budgets enforced in `angular.json`; no new heavy third-party packages without documented justification  
**Scale/Scope**: Personal/small-team media library; ~15 admin screens; bilingual EN/FR; tables can hold hundreds to low-thousands of rows

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                             | Requirement                                             | Status  | Notes                                                                                      |
| ------------------------------------- | ------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| Single Responsibility (≤200 lines)    | Components exceeding 200 lines must be refactored       | ✅ PASS | New batch-assign dialog and enrichment detail panel will be separate standalone components |
| Angular Signals-First                 | New state must use signals, not BehaviorSubject         | ✅ PASS | TableState, wishlist cross-ref, counter values, enrichment detail list — all signals       |
| Strict Typing                         | TypeScript strict mode; no `any`; explicit return types | ✅ PASS | All new DTOs/interfaces fully typed                                                        |
| Standalone Components                 | All new components must be standalone                   | ✅ PASS | No NgModules introduced                                                                    |
| Reactive Patterns                     | No manual subscriptions; use `async` or `toSignal()`    | ✅ PASS | HTTP calls via `toSignal(httpCall$)` pattern or `async` pipe                               |
| Unit Tests Required (≥80% statements) | Vitest tests for every new service/pipe/component       | ✅ PASS | Tests planned per task                                                                     |
| OnPush Change Detection               | All new components must use `OnPush`                    | ✅ PASS | Enforced by linting rule                                                                   |
| NgOptimizedImage                      | All `<img>` must use `NgOptimizedImage`                 | ✅ PASS | Profile picture display must use `NgOptimizedImage` with `fill` or explicit dimensions     |
| Bundle Budget                         | No budget relaxation without governance review          | ✅ PASS | No new runtime-imported packages anticipated; existing PrimeNG table features used         |
| Memory Management                     | DestroyRef / takeUntilDestroyed() for streams           | ✅ PASS | All polling intervals scoped to component lifecycle                                        |
| Responsive Design (360–2560 px)       | Mobile-first SCSS                                       | ✅ PASS | Compact nav user-info for mobile (US-7); table pagination adapts                           |
| Consistent Styling                    | SCSS variables/mixins; no hardcoded values              | ✅ PASS | Icon visibility fix targets CSS tokens; no inline `style=""`                               |

**Gate result**: ✅ No violations — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/006-app-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions R-001 to R-015
├── data-model.md        # Phase 1 output — entity/DTO changes + new frontend types
├── quickstart.md        # Phase 1 output — setup & verification checklist
├── contracts/
│   └── api-contracts.md # Phase 1 output — all endpoint changes and new endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (repository root)

```text
# Frontend — MediaHandler.Web (Angular SPA)
src/
├── app/
│   ├── core/
│   │   ├── auth/                         # Auth0 integration (existing)
│   │   └── services/
│   │       ├── profile.service.ts        # MODIFIED: uploadProfilePicture(), removeProfilePicture()
│   │       └── wishlist.service.ts       # EXISTING: items() signal used for cross-ref
│   ├── shared/
│   │   ├── components/
│   │   │   └── file-location/            # NEW: FileLocationComponent (US-15)
│   │   └── pipes/
│   │       └── locale-date.pipe.ts       # NEW: LocaleDatePipe (US-2)
│   ├── features/
│   │   ├── collection/
│   │   │   └── collection-page/          # MODIFIED: stats bar (US-14), completeness badge (US-14)
│   │   ├── search/
│   │   │   ├── tmdb-search-page/         # MODIFIED: wishlist cross-ref signal (US-4)
│   │   │   └── tmdb-result-card/         # MODIFIED: wishlistIndicator input (US-4)
│   │   ├── profile/
│   │   │   └── profile-page/             # MODIFIED: custom picture upload/remove (US-6)
│   │   └── admin/
│   │       ├── library-roots/
│   │       │   └── add-library-root-dialog/  # MODIFIED: root folder dropdown (US-3)
│   │       ├── scanner/
│   │       │   └── scanner-page/         # MODIFIED: real-time counter polling (US-11)
│   │       ├── scan-results/
│   │       │   └── scan-results-page/    # MODIFIED: position retention (US-10), sorting/filtering (US-9)
│   │       ├── review-items/
│   │       │   └── review-items-page/    # MODIFIED: multi-select + batch assign (US-12)
│   │       │       └── batch-assign-dialog/  # NEW: BatchAssignDialogComponent (US-12)
│   │       ├── enrichment/
│   │       │   └── enrichment-page/      # MODIFIED: detail panel polling (US-13)
│   │       │       └── enrichment-detail-panel/  # NEW: EnrichmentDetailPanelComponent (US-13)
│   │       └── users/
│   │           └── users-page/           # MODIFIED: pagination/sort/filter (US-9)
│   └── layout/
│       └── sidebar/
│           └── sidebar.component.*       # MODIFIED: user info + picture (US-7)
├── assets/
│   └── i18n/
│       ├── en.json                       # MODIFIED: add all missing keys (US-2)
│       └── fr.json                       # MODIFIED: add all missing keys (US-2)
└── styles/
    └── _themes.scss                      # MODIFIED: icon visibility CSS fix (US-1)

# Backend — MediaHandler.API (separate repo, companion changes)
src/
├── MediaHandler.API/
│   ├── Controllers/
│   │   ├── AdminScanController.cs        # MODIFIED: pass Language to command
│   │   └── UserProfileController.cs      # NEW: POST/DELETE profile-picture
│   └── DTOs/
│       ├── MediaDto.cs                   # MODIFIED: +Status, +NumberOfSeasons
│       └── UserDto.cs                    # MODIFIED: +ProfilePicturePath
├── Application/
│   ├── Commands/
│   │   ├── StartScanCommand.cs           # MODIFIED: +Language field
│   │   └── BatchAssignReviewItemsCommand.cs  # NEW
│   └── Queries/
│       └── GetEnrichmentRunDetailsQuery.cs   # MODIFIED: support polling during active run
├── Domain/
│   └── Entities/
│       └── User.cs                       # MODIFIED: +ProfilePicturePath
└── Infrastructure/
    └── Persistence/
        └── Migrations/                   # NEW: migration for User.ProfilePicturePath
```

**Structure Decision**: Web application (Option 2). Frontend lives entirely in `MediaHandler.Web/src/`. Backend changes are tracked as companion work in `MediaHandler.API` (separate repo). All feature toggles are release-based (ship when complete).

## Complexity Tracking

_No constitution violations — table not applicable._
