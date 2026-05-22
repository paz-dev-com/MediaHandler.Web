# Implementation Plan: Media File Linking & Missing Content Detection

**Branch**: `develop` | **Date**: 2026-05-21 | **Spec**: [specs/007-media-file-linking/spec.md](./spec.md)  
**Input**: Feature specification from `specs/007-media-file-linking/spec.md`

## Summary

Extend the MediaHandler application with four capabilities:

1. **File Linking from Detail Page** — Allow admins to link/unlink `MediaFile` records to a `Media` item directly from the detail page (new `PUT`/`DELETE` admin endpoints; modified `MediaFilesComponent` with link picker dialog).
2. **Root Folder** — Store a `RootFolder` path on each `Media` entity (auto-derived from linked files or manually set); display it on the detail page with a clipboard-copy action.
3. **Season Completeness** — Display a read-only completeness panel on TV-show detail pages listing owned vs. expected episodes per season (season 1+), derived from the existing `EpisodeFileLink` join table via a new `GET /api/v1/media/{id}/completeness` endpoint.
4. **Parent-Folder Status-Filter Label Clarification** — Rename the "Assigned" filter label to "TMDB Assigned (Pending Import)" in both i18n files so the scan-results admin knows it covers only entries awaiting import — no backend filtering change needed because the API already separates `Assigned` and `InCollection`.

## Technical Context

**Language/Version**: TypeScript 5.x / Angular 21 (frontend); C# 12 / .NET 10 (backend — `MediaHandler.API` repo)  
**Primary Dependencies**: PrimeNG 17+ (`p-dialog`, `p-table`, `p-button`, `p-tag`), Transloco 7+, Angular Signals, MediatR 12, EF Core 9, PostgreSQL  
**Storage**: PostgreSQL via EF Core; `Media.RootFolder` stored as `text` (nullable)  
**Testing**: Vitest + Angular Testing Library (frontend); xUnit (backend — companion)  
**Target Platform**: Modern evergreen browsers; Angular SPA served from .NET Kestrel/Nginx  
**Project Type**: Web application — Angular standalone-component SPA + .NET 10 REST API (separate repo)  
**Performance Goals**: Completeness panel loads ≤ 2 s; link/unlink action reflects in list ≤ 1 s; initial bundle ≤ 500 kB warning / 1 MB error  
**Constraints**: `OnPush` CD required; standalone components only; no NgModules; `any` forbidden; signals-first state; `DestroyRef`/`takeUntilDestroyed()` for streams  
**Scale/Scope**: Personal/small-team library; up to ~10 k `MediaFile` rows; paginated unlinked-file picker (20/page default)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                             | Requirement                                             | Status  | Notes                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| Single Responsibility (≤200 lines)    | Components exceeding 200 lines must be refactored       | ✅ PASS | `RootFolderComponent`, `SeasonCompletenessComponent`, `FileLinkPickerDialogComponent` are separate standalone components |
| Angular Signals-First                 | New state must use signals                              | ✅ PASS | All new state in services uses `signal()`; HTTP calls via `toSignal()` or `async` pipe                                   |
| Strict Typing                         | TypeScript strict mode; no `any`; explicit return types | ✅ PASS | All new DTOs/interfaces fully typed                                                                                      |
| Standalone Components                 | All new components must be standalone                   | ✅ PASS | No NgModules introduced                                                                                                  |
| Reactive Patterns                     | No manual subscriptions; use `async` or `toSignal()`    | ✅ PASS | All HTTP: `toSignal()` or `finalize()`+subscribe bound to `DestroyRef`                                                   |
| Unit Tests Required (≥80% statements) | Vitest tests for every new service/pipe/component       | ✅ PASS | Tests planned per task                                                                                                   |
| OnPush Change Detection               | All new components must use `OnPush`                    | ✅ PASS | Enforced by lint rule                                                                                                    |
| NgOptimizedImage                      | No unoptimized `<img>`                                  | ✅ PASS | No new `<img>` tags in this feature                                                                                      |
| Bundle Budget                         | No budget relaxation                                    | ✅ PASS | No new third-party packages; PrimeNG dialog/table already in bundle                                                      |
| Memory Management                     | `DestroyRef`/`takeUntilDestroyed()`                     | ✅ PASS | Used in all new components with subscriptions                                                                            |
| Responsive Design (360–2560 px)       | Mobile-first SCSS                                       | ✅ PASS | Completeness panel and file-linking dialog use responsive grid                                                           |
| Consistent Styling                    | SCSS variables/mixins; no hardcoded values              | ✅ PASS | Existing `_variables.scss` tokens used throughout                                                                        |

**Gate result**: ✅ No violations — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/007-media-file-linking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output — entity/DTO changes + new frontend types
├── quickstart.md        # Phase 1 output — setup & verification checklist
├── contracts/
│   └── api-contracts.md # Phase 1 output — all new/modified endpoints
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
# Frontend — MediaHandler.Web (Angular SPA)
src/app/
├── features/
│   ├── media-detail/
│   │   ├── media-detail.service.ts           # MODIFIED: +linkFile(), +unlinkFile(), +updateRootFolder(), +loadCompleteness()
│   │   ├── media-files.component.ts          # MODIFIED: +unlink button; admin-only link-picker trigger
│   │   ├── media-files.component.html        # MODIFIED
│   │   ├── root-folder.component.ts          # NEW: displays root folder path, copy + manual edit (admin-only)
│   │   ├── root-folder.component.html        # NEW
│   │   ├── root-folder.component.scss        # NEW
│   │   ├── root-folder.component.spec.ts     # NEW
│   │   ├── file-link-picker-dialog.component.ts   # NEW: paginated list of unlinked files, link action
│   │   ├── file-link-picker-dialog.component.html # NEW
│   │   ├── file-link-picker-dialog.component.scss # NEW
│   │   ├── file-link-picker-dialog.component.spec.ts # NEW
│   │   ├── season-completeness.component.ts  # NEW: completeness panel for TV shows
│   │   ├── season-completeness.component.html # NEW
│   │   ├── season-completeness.component.scss # NEW
│   │   ├── season-completeness.component.spec.ts # NEW
│   │   └── media-detail-page.component.ts    # MODIFIED: wire new child components
│   └── admin/
│       ├── parent-folders/
│       │   └── admin-parent-folders-page.component.ts  # MINOR: label clarity (i18n key rename)
│       └── shared/
│           └── (no changes)
├── core/
│   └── services/
│       └── admin-media-file-link.service.ts  # NEW: link/unlink/unlinked-files/root-folder API calls
└── shared/
    └── models/
        └── media.model.ts                    # MODIFIED: +rootFolder, +completeness types
    i18n/
        ├── en.json                           # MODIFIED: +mediaDetail.* keys, rename parentFolders.statusAssigned label
        └── fr.json                           # MODIFIED: same

# Backend — MediaHandler.API (companion changes)
MediaHandler.Domain/Entities/
└── Media.cs                                  # MODIFIED: +RootFolder (string?)

MediaHandler.Infrastructure/Persistence/
├── Configurations/
│   └── MediaConfiguration.cs                 # MODIFIED: map RootFolder column
└── Migrations/
    └── AddMediaRootFolder.cs                 # NEW: EF Core migration

MediaHandler.Application/Features/Media/
├── DTOs/
│   ├── MediaDto.cs                           # MODIFIED: +RootFolder field
│   └── SeasonCompletenessDto.cs              # NEW: completeness DTO
├── Queries/
│   └── GetMediaCompleteness/
│       └── GetMediaCompletenessQueryHandler.cs # NEW
└── Commands/
    ├── LinkMediaFile/
    │   └── LinkMediaFileCommandHandler.cs    # NEW
    ├── UnlinkMediaFile/
    │   └── UnlinkMediaFileCommandHandler.cs  # NEW
    └── UpdateMediaRootFolder/
        └── UpdateMediaRootFolderCommandHandler.cs # NEW

MediaHandler.Application/Features/Files/Queries/
└── GetUnlinkedFiles/
    └── GetUnlinkedFilesQueryHandler.cs       # NEW

MediaHandler.API/Controllers/
├── MediaController.cs                        # MODIFIED: +GET completeness endpoint
└── AdminMediaFilesController.cs              # NEW: link/unlink/root-folder + unlinked-files list
```

**Structure Decision**: Web application (Option 2). Frontend in `MediaHandler.Web/src/`. Backend companion changes tracked in `MediaHandler.API`. All state for new operations uses Angular signals. No new third-party packages required.

## Complexity Tracking

_No constitution violations — table not applicable._
