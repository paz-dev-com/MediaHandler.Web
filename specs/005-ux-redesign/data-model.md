# Data Model: UX/UI Redesign

**Feature**: 005-ux-redesign  
**Date**: 2025-07-23

> This feature is a front-end-only redesign. No backend API or database changes are required. The data model below describes the **UI-layer types, design tokens, and state structures** introduced or modified by the redesign.

## Existing Entities (Unchanged)

These backend-driven models remain as-is. No fields added or removed.

| Entity              | File                                                | Notes                                               |
| ------------------- | --------------------------------------------------- | --------------------------------------------------- |
| `Media`             | `src/app/shared/models/media.model.ts`              | Core media item with poster, backdrop, genres, etc. |
| `MediaFile`         | `src/app/shared/models/media.model.ts`              | File metadata (path, size, format)                  |
| `WishlistItem`      | `src/app/shared/models/wishlist.model.ts`           | Wishlist entry with poster, title                   |
| `TvSeason`          | `src/app/shared/models/tv.model.ts`                 | Season with episodes array                          |
| `TvEpisode`         | `src/app/shared/models/tv.model.ts`                 | Episode with watched state                          |
| `MediaType`         | `src/app/shared/models/enums.ts`                    | `Film` \| `TvShow` enum                             |
| `CollectionFilters` | `src/app/features/collection/collection.service.ts` | search, type, genre, isWatched                      |
| `CollectionStats`   | `src/app/core/api/api-response.model.ts`            | Aggregate stats                                     |

## New UI-Layer Types

### DesignTokens (CSS Custom Properties)

Not a TypeScript type — declared in `:root` of `styles.scss`. Canonical values from spec FR-001.

```scss
:root {
  /* Color — Background */
  --color-bg-base: #0a0a0f;
  --color-bg-surface: #141420;
  --color-bg-elevated: #1e1e2e;

  /* Color — Accent (Indigo) */
  --color-accent: #6366f1;
  --color-accent-hover: #818cf8;
  --color-accent-glow: rgba(99, 102, 241, 0.35);

  /* Color — Text */
  --color-text-primary: #f5f5f7;
  --color-text-secondary: #a1a1aa;
  --color-text-accent: #a5b4fc;

  /* Color — Border & overlay */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-poster-gradient: linear-gradient(
    to top,
    rgba(10, 10, 15, 0.96) 0%,
    rgba(10, 10, 15, 0.45) 55%,
    transparent 100%
  );

  /* Typography */
  --font-display: 'Bebas Neue', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Animation durations */
  --anim-fast: 150ms;
  --anim-normal: 300ms;
  --anim-slow: 500ms;
  --anim-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --anim-fast: 0ms;
    --anim-normal: 0ms;
    --anim-slow: 0ms;
  }
}
```

### Breakpoint Constants

```typescript
// src/app/shared/constants/breakpoints.ts
export const BREAKPOINTS = {
  MOBILE: '(max-width: 767px)',
  TABLET: '(min-width: 768px) and (max-width: 1024px)',
  DESKTOP: '(min-width: 1025px)',
} as const;
```

### NavigationMode (derived state)

```typescript
// Used within SidebarComponent — not a separate file
type NavigationMode = 'expanded' | 'collapsed' | 'mobile';
```

**Derivation**: Computed from `BreakpointObserver` state and user toggle signal.

### AnimationConfig (constants)

```typescript
// src/app/shared/animations/animation.config.ts
export const ANIMATION_TIMINGS = {
  FAST: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  NORMAL: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  SLOW: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  STAGGER_DELAY: 50, // ms between each card in stagger
} as const;
```

### RouteAnimationData

```typescript
// Attached to route config `data` property
interface RouteAnimationData {
  animation: string; // e.g., 'CollectionPage', 'DetailPage', 'SearchPage'
}
```

**Usage**: Each route in `app.routes.ts` gets a `data: { animation: 'PageName' }` property. The `App` component reads this from the `ActivatedRoute` to select the correct Angular Animation transition.

## Entity Relationships (UI Layer)

```
App (shell)
├── SidebarComponent
│   └── NavigationMode ← BreakpointObserver + collapsed signal
├── <router-outlet> [@routeAnimation]
│   ├── CollectionPage
│   │   ├── CollectionFilters (existing)
│   │   ├── CollectionStats (existing)
│   │   ├── SpotlightCarousel (P3 — new)
│   │   ├── MediaCard[] (restyled — dark theme + hover micro-interactions)
│   │   │   └── InViewportDirective → triggers @cardEnter animation
│   │   ├── LoadingSkeleton (restyled — shimmer animation)
│   │   └── EmptyCollection (restyled — illustration + CTA)
│   ├── MediaDetailPage
│   │   ├── HeroSection (new — backdrop + gradient + parallax)
│   │   ├── SeasonList (restyled — Angular Animations accordion)
│   │   └── MediaFiles (existing, theme-only)
│   ├── TmdbSearchPage (restyled — card entrance, search focus glow)
│   └── WishlistPage (restyled — same card style as collection)
└── Toast (PrimeNG — restyled, Angular Animations enter/exit)
```

## State Transitions

### Media Card Animation States

```
void ──[IntersectionObserver triggers]──► visible
  opacity: 0, translateY(24px)            opacity: 1, translateY(0)
                                          (300ms ease, staggered 50ms)
```

### Sidebar Navigation States

```
expanded ──[toggle or resize ≤1024px]──► collapsed
    ▲                                        │
    └──────[toggle or resize >1024px]────────┘

expanded/collapsed ──[resize <768px]──► mobile (bottom nav)
mobile ──[resize ≥768px]──► expanded
```

### Route Transition States

```
PageA ──[navigate]──► PageB
  opacity: 1            opacity: 0 → 1
  (fade-out 150ms)      (fade-in 150ms)
```

### Season Accordion States

```
collapsed ──[click header]──► expanded
  height: 0                    height: auto (Angular Animations)
  opacity: 0                   opacity: 1 (staggered episodes)
```

## Validation Rules

| Rule                  | Scope                            | Validation                                                                    |
| --------------------- | -------------------------------- | ----------------------------------------------------------------------------- |
| WCAG AA contrast      | All text on `#0A0A0F`            | `#F5F5F7` (primary) = 18.2:1 ✓, `#A1A1AA` (secondary) = 7.1:1 ✓               |
| WCAG AA large text    | Display headings                 | `#F5F5F7` on `#0A0A0F` = 18.2:1 ✓                                             |
| Focus visibility      | All interactive elements         | `outline: 2px solid #6366F1` on `#0A0A0F` = 4.6:1 ✓ (≥ 3:1 for UI components) |
| Animation performance | All transitions                  | `transform` and `opacity` only — no layout/paint properties                   |
| Reduced motion        | `prefers-reduced-motion: reduce` | All `--anim-*` tokens → `0ms`                                                 |
| Font loading          | Bebas Neue + Inter               | `font-display: swap`, WOFF2 format                                            |
| Image format          | All poster/backdrop `<img>`      | Must use `NgOptimizedImage` with `width`/`height`                             |
