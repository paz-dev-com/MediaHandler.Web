# Implementation Plan: UX/UI Redesign

**Branch**: `develop` | **Date**: 2025-07-23 | **Spec**: `specs/005-ux-redesign/spec.md`
**Input**: Feature specification from `specs/005-ux-redesign/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Complete front-end UX/UI redesign of the MediaHandler.Web Angular application to achieve a dark cinematic aesthetic inspired by aerukart.com. The redesign introduces a custom design token system (CSS custom properties), PrimeNG theme customization via the Aura preset, self-hosted Bebas Neue + Inter typography, Angular Animations for route transitions / staggered card entrances / accordion interactions, CSS micro-interactions for hover/focus/shimmer states, IntersectionObserver-driven viewport entrance animations, and a responsive navigation shell with mobile bottom nav. No third-party animation libraries; `@angular/animations` + CSS is the sole animation stack. Full redesign scope: Collection, Media Detail, Search, Wishlist, Navigation Shell. Theme-only: Settings, Profile, Admin. Out of scope: Auth0 login.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21 (standalone, signals-first, OnPush)  
**Primary Dependencies**: PrimeNG 21.x (`@primeuix/themes/aura`), `@angular/cdk` 21.x, `@angular/animations`, Transloco 8.x, Auth0 Angular 2.x  
**Storage**: N/A (front-end only; backend API unchanged)  
**Testing**: Vitest (unit + component tests)  
**Target Platform**: Web (modern browsers — Chrome 111+, Firefox 115+, Safari 16.4+, Edge 111+)  
**Project Type**: Web application (SPA)  
**Performance Goals**: 60fps animations (transform+opacity only), Lighthouse 90+ desktop / 75+ mobile, LCP < 2.5s, TTI < 3s, CLS < 0.1  
**Constraints**: Bundle budget **500kB warning / 1MB error** (initial, per constitution §IV); 4kB/8kB component styles; no third-party animation libraries; self-hosted fonts; PrimeNG as component foundation. **⚠️ Measure baseline bundle size with `ng build --configuration=production` before starting — if baseline already exceeds 500kB, file a constitution amendment ADR before proceeding.**  
**Scale/Scope**: ~6 feature pages (full redesign: 5, theme-only: 3), ~20 components modified/created, ~4 new shared utilities

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                       | Status     | Notes                                                                                                                                                                                                                                                             |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Single Responsibility**    | ✅ PASS    | Each new utility (InViewportDirective, route animations, animation config) has one clear purpose. No component exceeds 200 lines.                                                                                                                                 |
| **I. Angular Signals-First**    | ✅ PASS    | All new state (navigation mode, viewport visibility, scroll offset) uses signals. Existing signal patterns preserved.                                                                                                                                             |
| **I. Strict Typing**            | ✅ PASS    | TypeScript strict mode remains enabled. All new types have explicit definitions. No `any` usage.                                                                                                                                                                  |
| **I. Prettier Compliance**      | ✅ PASS    | No changes to Prettier config. All new code follows 100-char, single-quote format.                                                                                                                                                                                |
| **I. Standalone Components**    | ✅ PASS    | All new/modified components are standalone. No NgModules introduced.                                                                                                                                                                                              |
| **I. Reactive Patterns**        | ✅ PASS    | BreakpointObserver uses `toSignal()`. No manual subscriptions without cleanup.                                                                                                                                                                                    |
| **II. Unit Tests Required**     | ✅ PASS    | InViewportDirective, animation trigger helpers, sidebar mode logic must have unit tests. 80%+ coverage target.                                                                                                                                                    |
| **II. Component Tests**         | ✅ PASS    | MediaCard hover interactions, sidebar mode switching, skeleton rendering tested via DOM assertions.                                                                                                                                                               |
| **III. Responsive Design**      | ✅ PASS    | Mobile-first SCSS with breakpoints 768px/1024px. Tested 360px–2560px.                                                                                                                                                                                             |
| **III. Loading States**         | ✅ PASS    | Existing skeleton + shimmer enhancement. Empty states have meaningful CTAs.                                                                                                                                                                                       |
| **III. Error Feedback**         | ✅ PASS    | Existing error components retained and restyled.                                                                                                                                                                                                                  |
| **III. Accessibility Baseline** | ✅ PASS    | Keyboard nav with focus rings, alt attributes, color not sole indicator, `prefers-reduced-motion` respected.                                                                                                                                                      |
| **III. Consistent Styling**     | ✅ PASS    | All colors/fonts/spacing via CSS custom properties and SCSS mixins. No hard-coded values.                                                                                                                                                                         |
| **III. Animation Restraint**    | ✅ PASS    | All animations serve orientation/feedback purpose. Decorative animations respect reduced-motion.                                                                                                                                                                  |
| **IV. Bundle Budget**           | ⚠️ MEASURE | No new heavy dependencies. `@angular/animations` adds ~60KB (~16KB gzipped). Fonts are assets, not in JS bundle. **Baseline must be measured before implementation** (`ng build --production`). If baseline exceeds 500kB/1MB, file a constitution amendment ADR. |
| **IV. Lazy Loading**            | ✅ PASS    | Feature routes remain lazy-loaded. Animation definitions are co-located with lazy features.                                                                                                                                                                       |
| **IV. OnPush Change Detection** | ✅ PASS    | All new components use `ChangeDetectionStrategy.OnPush`.                                                                                                                                                                                                          |
| **IV. Image Optimization**      | ⚠️ ACTION  | Existing `<img>` tags must be migrated to `NgOptimizedImage` with `width`/`height`. Currently uses raw `<img>` with `loading="lazy"`.                                                                                                                             |
| **IV. Memory Management**       | ✅ PASS    | IntersectionObserver disconnects on destroy via `DestroyRef`. BreakpointObserver uses `takeUntilDestroyed()`.                                                                                                                                                     |
| **IV. Core Web Vitals**         | ✅ PASS    | LCP < 2.5s (font-display: swap, lazy images), FID < 100ms (OnPush, no main-thread blocking), CLS < 0.1 (explicit image dimensions).                                                                                                                               |

**Gate Result**: ✅ PASS — One action item (NgOptimizedImage migration) is a task within the implementation, not a blocker.

## Project Structure

### Documentation (this feature)

```text
specs/005-ux-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions
├── data-model.md        # Phase 1 output — UI types and design tokens
├── quickstart.md        # Phase 1 output — setup and verification guide
├── contracts/
│   └── design-tokens.md # Phase 1 output — design token and animation contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── assets/
│   ├── fonts/                          # NEW: Self-hosted Bebas Neue + Inter WOFF2
│   │   ├── bebas-neue-v14-latin-regular.woff2
│   │   ├── inter-v18-latin-regular.woff2
│   │   ├── inter-v18-latin-500.woff2
│   │   └── inter-v18-latin-600.woff2
│   └── i18n/
│       ├── en.json                     # MODIFIED: New translation keys
│       └── fr.json                     # MODIFIED: New translation keys
├── styles.scss                         # MODIFIED: @font-face, design tokens, global styles
├── app/
│   ├── app.config.ts                   # MODIFIED: provideAnimationsAsync(), PrimeNG dark tokens
│   ├── app.ts                          # MODIFIED: Route animation trigger
│   ├── app.html                        # MODIFIED: @routeAnimation on router-outlet
│   ├── app.scss                        # MODIFIED: Dark shell background
│   ├── core/
│   │   └── layout/
│   │       ├── sidebar.component.ts    # MODIFIED: BreakpointObserver, mobile nav, animations
│   │       ├── sidebar.component.html  # MODIFIED: Conditional desktop/mobile nav
│   │       └── sidebar.component.scss  # MODIFIED: Dark theme, mobile bottom nav
│   ├── shared/
│   │   ├── animations/                 # NEW directory
│   │   │   ├── route.animations.ts     # NEW: Route transition definitions
│   │   │   └── animation.config.ts     # NEW: Timing constants
│   │   ├── constants/                  # NEW directory
│   │   │   └── breakpoints.ts          # NEW: Breakpoint constants
│   │   ├── directives/                 # NEW directory
│   │   │   └── in-viewport.directive.ts # NEW: IntersectionObserver directive
│   │   ├── components/
│   │   │   ├── loading-skeleton.component.ts  # MODIFIED: Shimmer animation
│   │   │   └── error-message.component.ts     # MODIFIED: Dark theme styling
│   │   └── styles/                     # NEW directory
│   │       ├── _mixins.scss            # NEW: Reusable SCSS mixins (card-glow, shimmer, etc.)
│   │       └── _variables.scss         # NEW: SCSS variables referencing CSS custom properties
│   └── features/
│       ├── collection/
│       │   ├── collection-page.component.ts    # MODIFIED: Stagger animation trigger
│       │   ├── collection-page.component.html  # MODIFIED: Animation bindings, NgOptimizedImage
│       │   ├── collection-page.component.scss  # MODIFIED: Dark grid, responsive columns
│       │   ├── media-card.component.ts         # MODIFIED: InViewportDirective, hover state
│       │   ├── media-card.component.html        # MODIFIED: Gradient overlay, NgOptimizedImage
│       │   ├── media-card.component.scss        # MODIFIED: Dark card, hover glow, Bebas Neue
│       │   ├── empty-collection.component.ts    # MODIFIED: Redesigned empty state
│       │   └── spotlight-carousel.component.ts  # NEW (P3): Recently added carousel
│       ├── media-detail/
│       │   ├── media-detail-page.component.ts   # MODIFIED: Parallax scroll, hero section
│       │   ├── media-detail-page.component.html # MODIFIED: Hero layout, gradient overlay
│       │   ├── media-detail-page.component.scss # MODIFIED: Hero styling, parallax
│       │   ├── season-list.component.ts         # MODIFIED: Angular Animations accordion
│       │   ├── season-list.component.html        # MODIFIED: Animation triggers
│       │   └── season-list.component.scss        # MODIFIED: Dark accordion styling
│       ├── tmdb-search/
│       │   ├── tmdb-search-page.component.ts    # MODIFIED: Search focus glow, stagger
│       │   ├── tmdb-search-page.component.html  # MODIFIED: Animation bindings
│       │   ├── tmdb-search-page.component.scss  # MODIFIED: Dark theme, focus animation
│       │   ├── tmdb-result-card.component.ts    # MODIFIED: Dark card styling
│       │   ├── tmdb-result-card.component.html  # MODIFIED: NgOptimizedImage
│       │   └── tmdb-result-card.component.scss  # MODIFIED: Dark theme
│       └── wishlist/
│           ├── wishlist-page.component.ts       # MODIFIED: Stagger animation
│           ├── wishlist-page.component.html     # MODIFIED: Animation bindings
│           ├── wishlist-page.component.scss     # MODIFIED: Dark grid, responsive columns
│           ├── wishlist-card.component.ts       # MODIFIED: Dark card styling
│           ├── wishlist-card.component.html     # MODIFIED: NgOptimizedImage
│           └── wishlist-card.component.scss     # MODIFIED: Dark theme, hover glow
```

**Structure Decision**: Single-project Angular SPA. All source under `src/`. New shared utilities go in `src/app/shared/animations/`, `src/app/shared/directives/`, `src/app/shared/constants/`, and `src/app/shared/styles/`. Feature components are modified in-place. No new feature modules or structural refactoring needed.

## Complexity Tracking

> No constitution violations requiring justification. The NgOptimizedImage migration is a constitution-aligned improvement, not a violation.

| Action Item                          | Scope                                      | Priority                           |
| ------------------------------------ | ------------------------------------------ | ---------------------------------- |
| Migrate `<img>` → `NgOptimizedImage` | All poster/backdrop images across features | P1 (done alongside card restyling) |
