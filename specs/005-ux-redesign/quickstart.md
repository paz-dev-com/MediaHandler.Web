# Quickstart: UX/UI Redesign

**Feature**: 005-ux-redesign  
**Branch**: `develop`

## Prerequisites

- Node.js 20+ and npm 11+
- Angular CLI (`npx ng` via local install)
- The project at `/home/tpfeifer/Repos/MediaHandler/MediaHandler.Web`

## Setup

```bash
cd /home/tpfeifer/Repos/MediaHandler/MediaHandler.Web
npm install
```

### Add @angular/animations (if not already installed)

```bash
npm install @angular/animations
```

### Download Self-Hosted Fonts

Download WOFF2 files for **Bebas Neue** (Regular) and **Inter** (Variable or Regular 400 + Medium 500 + SemiBold 600) from Google Fonts. Place them in:

```
src/assets/fonts/
├── bebas-neue-v14-latin-regular.woff2
├── inter-v18-latin-regular.woff2
├── inter-v18-latin-500.woff2
└── inter-v18-latin-600.woff2
```

## Key Files to Modify

### Global Styles & Theming

- `src/styles.scss` — Add `@font-face` declarations, design tokens (`:root` custom properties), shimmer keyframes, global focus styles, reduced-motion overrides
- `src/app/app.config.ts` — Add `provideAnimationsAsync()`, customize PrimeNG Aura preset tokens for dark palette

### App Shell & Navigation

- `src/app/app.ts` — Add `@routeAnimation` trigger to `<router-outlet>`
- `src/app/app.html` — Wire route animation trigger
- `src/app/app.scss` — Update shell background to `--color-bg-base`
- `src/app/core/layout/sidebar.component.ts` — Add `BreakpointObserver`, mobile navigation mode, Angular Animations
- `src/app/core/layout/sidebar.component.html` — Conditional desktop sidebar vs mobile bottom nav
- `src/app/core/layout/sidebar.component.scss` — Dark theme, mobile bottom nav styles

### Shared / Reusable

- `src/app/shared/animations/route.animations.ts` — New: route transition animation definitions
- `src/app/shared/animations/animation.config.ts` — New: timing constants
- `src/app/shared/directives/in-viewport.directive.ts` — New: IntersectionObserver directive
- `src/app/shared/components/loading-skeleton.component.ts` — Restyle with shimmer
- `src/app/shared/constants/breakpoints.ts` — New: breakpoint constants

### Collection (Full Redesign)

- `src/app/features/collection/collection-page.component.*` — Dark theme, staggered card entrance
- `src/app/features/collection/media-card.component.*` — Poster-centric card with hover glow, gradient overlay, Bebas Neue title
- `src/app/features/collection/empty-collection.component.ts` — Redesigned empty state

### Media Detail (Full Redesign)

- `src/app/features/media-detail/media-detail-page.component.*` — Hero section with backdrop, gradient, parallax
- `src/app/features/media-detail/season-list.component.*` — Angular Animations accordion

### Search (Full Redesign)

- `src/app/features/tmdb-search/tmdb-search-page.component.*` — Search focus glow, staggered results
- `src/app/features/tmdb-search/tmdb-result-card.component.*` — Dark card restyling

### Wishlist (Full Redesign)

- `src/app/features/wishlist/wishlist-page.component.*` — Consistent card grid with collection
- `src/app/features/wishlist/wishlist-card.component.*` — Dark card restyling

### Theme-Only Pages (Dark palette + typography only)

- `src/app/features/profile/` — PrimeNG token restyling (automatic via global tokens)
- `src/app/features/admin/` — PrimeNG token restyling (automatic via global tokens)

## Development Server

```bash
npm start
# App runs at http://localhost:4200
```

## Run Tests

```bash
npm test
```

## Verify Redesign Checklist

1. **Dark theme applied**: Background is `#0A0A0F`, cards are `#141420`
2. **Typography**: Headings in Bebas Neue, body in Inter
3. **Card hover**: Scale(1.04) + Indigo glow on hover
4. **Scroll entrance**: Cards fade+slide into view on scroll
5. **Route transitions**: Fade transition between pages
6. **Sidebar collapse**: Smooth Angular Animation on desktop
7. **Mobile nav**: Bottom navigation bar on < 768px
8. **Skeleton shimmer**: Gradient shimmer animation on loading states
9. **Reduced motion**: All animations disabled with `prefers-reduced-motion: reduce`
10. **Focus rings**: Visible `2px solid #6366F1` outline on all interactive elements
11. **Contrast**: All text passes WCAG AA against `#0A0A0F`

## Architecture Notes

- **No new heavy dependencies**: Only `@angular/animations` (platform package) is added
- **PrimeNG theming**: Customize via `providePrimeNG()` design tokens in `app.config.ts`
- **CSS custom properties**: All colors, fonts, and animation timings are tokenized
- **Signals-first**: All new reactive state uses Angular signals
- **OnPush**: All components use `ChangeDetectionStrategy.OnPush`
- **Standalone**: All new components are standalone (no NgModules)
