# MediaHandler.Web Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-09

## Active Technologies

TypeScript 5.9 / Angular 21.2 + PrimeNG 21.x (UI components), PrimeFlex 4.x (responsive CSS utilities), `@auth0/auth0-angular` (authentication), `@jsverse/transloco` (i18n)

## Project Structure

```text
src/
├── app/
│   ├── core/          # Auth, API, i18n, layout (sidebar)
│   ├── features/      # Lazy-loaded feature areas (collection, media-detail, tmdb-search, wishlist, profile, nas-scanner)
│   └── shared/        # Models, shared components, pipes
├── assets/i18n/       # Translation files (en.json, fr.json)
└── environments/      # Environment configs
```

## Commands

```bash
npm test        # Run Vitest tests
npm start       # Start dev server (ng serve)
npm run build   # Production build
npm run lint    # Lint check
```

## Code Style

- Standalone components only (no NgModules)
- Angular signals-first state management
- OnPush change detection on all components
- Functional route guards and HTTP interceptors
- Strict TypeScript (no `any`)
- Prettier: 100 char width, single quotes, Angular HTML parser
- RxJS only for async streams (HTTP); signals for synchronous state
- Components must not exceed 200 lines

## Recent Changes

- **003-scan-and-import**: Scan & Import — decouple location buttons, combined scan + TMDB import, auto-import unlinked files, collapsible results accordion
- **002-nas-file-scanner**: NAS Scanner page — admin NAS scan with stat cards, location quick-scan buttons
- **001-media-collection-manager**: Media collection web interface — card grid browsing, NAS file access, watch tracking, TMDB search/import, wishlist, bilingual EN/FR UI

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
