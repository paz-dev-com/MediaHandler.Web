# Research: UX/UI Redesign

**Feature**: 005-ux-redesign  
**Date**: 2025-07-23

## R-001: PrimeNG Theme Customization for Dark Cinematic Look

**Decision**: Customize PrimeNG's Aura preset via `providePrimeNG()` design tokens and overlay with a custom SCSS theming layer using CSS custom properties.

**Rationale**: PrimeNG v21 (already installed at `^21.1.3`) supports a design-token-based theming system through `@primeuix/themes`. The Aura preset is currently in use. PrimeNG's `providePrimeNG()` accepts a `theme.preset` with overrides for `primitive` and `semantic` color tokens, letting us remap surface, primary, and text colors to the cinematic palette (`#0A0A0F`, `#6366F1`, etc.) without forking CSS files. A supplementary `:root` block in `styles.scss` declares the app's own `--color-*` custom properties for use in custom components and SCSS mixins.

**Alternatives Considered**:

- **Fork PrimeNG CSS**: Rejected — brittle across PrimeNG upgrades, violates maintainability principle.
- **Build separate CSS theme file**: Rejected — PrimeNG v21's JS-based token system is the recommended approach; a CSS file would conflict with it.
- **Replace PrimeNG with custom components**: Rejected — contradicts "LEVERAGE PRIMENG FULLY" constraint.

## R-002: Angular Animations for Route Transitions and Entrance Effects

**Decision**: Use `@angular/animations` (BrowserAnimationsModule / `provideAnimationsAsync()`) for route transitions, staggered card entrances, accordion expand/collapse, and toast animations. CSS transitions/keyframes handle micro-interactions (hover, shimmer, focus glow).

**Rationale**: Angular Animations integrates natively with the router (`@routeAnimations` trigger on `<router-outlet>`), supports `query()` + `stagger()` for card entrance sequences, and respects `@.disabled` for reduced-motion. The project already uses Angular 21 with standalone components; `provideAnimationsAsync()` in `app.config.ts` enables tree-shakable animation support. CSS transitions handle hover/focus states with zero JS cost. This avoids any third-party animation library per the user's explicit constraint.

**Alternatives Considered**:

- **GSAP / Framer Motion / Motion One**: Explicitly forbidden by user constraints.
- **Web Animations API directly**: Possible but loses Angular's declarative trigger/state model and stagger utilities.
- **CSS-only for everything**: Insufficient for coordinated route transitions and stagger sequences.

## R-003: Scroll-Triggered Entrance Animations Strategy

**Decision**: Use `IntersectionObserver` (via a reusable Angular directive `InViewportDirective`) to detect when media cards enter the viewport, then trigger Angular Animations `@cardEnter` on each card. This replaces continuous scroll listeners.

**Rationale**: `IntersectionObserver` is performant (no scroll-event jank), widely supported, and allows lazy triggering of animations per card. The directive sets a signal `inViewport` to `true` once, which triggers the Angular Animation transition `:enter` or `void => *`. Cards that haven't scrolled into view remain in `void` state (invisible) until observed. This aligns with the spec's FR-004 (staggered fade-in).

**Alternatives Considered**:

- **CSS `animation-timeline: scroll()`**: Scroll-driven animations spec has limited browser support (Chrome 115+, no Firefox/Safari stable). Used only as progressive enhancement for parallax, not as primary entrance mechanism.
- **Manual `scroll` event listener with `requestAnimationFrame`**: Viable but IntersectionObserver is more performant and purpose-built.

## R-004: Parallax Effect on Media Detail Backdrop

**Decision**: Use CSS `transform: translateY()` driven by a lightweight scroll listener on the detail page container (via `@HostListener` or a directive) to shift the backdrop image. Fallback: pure CSS `background-attachment: fixed` on desktop.

**Rationale**: True CSS scroll-driven animations (`animation-timeline`) have limited support. A minimal JS scroll handler that updates a CSS custom property (`--scroll-offset`) on `requestAnimationFrame` is performant (transforms only, no layout reflow). The parallax factor is subtle (0.3–0.5x scroll speed) per the spec's requirement. `prefers-reduced-motion` disables the listener entirely.

**Alternatives Considered**:

- **CSS `background-attachment: fixed`**: Works on desktop but broken on iOS Safari; not sufficient alone.
- **CSS `animation-timeline: scroll()`**: Progressive enhancement only due to browser support gaps.

## R-005: Typography Loading Strategy (Bebas Neue + Inter)

**Decision**: Self-host both fonts via `@font-face` in `styles.scss` with `font-display: swap`. Download WOFF2 files from Google Fonts and place in `src/assets/fonts/`.

**Rationale**: Self-hosting eliminates external network dependency (per spec assumptions), improves privacy, and gives full control over `font-display` behavior. WOFF2 is the optimal format (best compression, universal modern browser support). `font-display: swap` ensures text remains visible during font load (avoids FOIT), which is critical for LCP. Total payload: Bebas Neue Regular ~15KB WOFF2, Inter Variable ~95KB WOFF2 (or subset to Regular 400 + Medium 500 + SemiBold 600 ≈ 50KB).

**Alternatives Considered**:

- **Google Fonts CDN link**: Rejected — adds external dependency, privacy concern, extra DNS/connection overhead.
- **System fonts only**: Rejected — Bebas Neue display font is core to the cinematic aesthetic.

## R-006: Responsive Navigation (Sidebar → Mobile Nav)

**Decision**: Refactor `SidebarComponent` to support three states: expanded (desktop > 1024px), collapsed rail (desktop, toggled), and bottom navigation bar (mobile < 768px). Use `BreakpointObserver` from `@angular/cdk/layout` (already in deps) to reactively switch between desktop sidebar and mobile bottom nav. Angular Animations for expand/collapse transitions.

**Rationale**: `@angular/cdk` is already in `package.json` (`^21.2.5`). `BreakpointObserver` provides a reactive `Observable<BreakpointState>` that maps cleanly to signals via `toSignal()`. The sidebar component already has a `collapsed` signal and basic transition. The mobile bottom nav is a separate template section within the same component, conditionally rendered based on breakpoint, keeping navigation logic in one place.

**Alternatives Considered**:

- **Hamburger menu with slide-in drawer**: Still an option for tablet; bottom nav is better for mobile (thumb-reachable). Could offer hamburger as secondary option for tablet.
- **PrimeNG Sidebar/Drawer component**: Possible but the existing custom sidebar is simpler to restyle; PrimeNG's `Drawer` adds overlay behavior we don't need for persistent nav.

## R-007: Loading Skeleton Shimmer Animation

**Decision**: Enhance the existing `LoadingSkeletonComponent` (which already uses PrimeNG `p-skeleton`) with a custom CSS shimmer animation overlay. Add a `:host ::ng-deep` or global class that applies a `linear-gradient` animation moving left-to-right on skeleton elements.

**Rationale**: PrimeNG's `p-skeleton` already renders placeholder shapes. Adding a CSS `@keyframes shimmer` animation with a translucent gradient creates the premium shimmer effect described in the spec. The animation uses `transform: translateX()` for GPU acceleration (no layout reflow). `prefers-reduced-motion` disables the shimmer.

**Alternatives Considered**:

- **Custom skeleton component from scratch**: Unnecessary; PrimeNG's skeleton handles shape/sizing, we just need the shimmer overlay.
- **PrimeNG skeleton animation prop**: PrimeNG skeleton has a built-in `animation` option but it's a simple pulse; the custom gradient shimmer is more visually striking.

## R-008: View Transitions API

**Decision**: Use View Transitions API (`document.startViewTransition()`) as a progressive enhancement for route transitions where supported (Chrome 111+). Wrap Angular router navigation in `startViewTransition()` when available. Fall back to standard Angular Animations route transitions on unsupported browsers.

**Rationale**: View Transitions API provides native cross-fade between DOM states during navigation. Angular 17+ has experimental `withViewTransitions()` in the router module. Since browser support is partial, it serves as enhancement only — the Angular Animations route transition is the baseline. This aligns with spec FR-005 and the user's mention of View Transitions API.

**Alternatives Considered**:

- **View Transitions only (no Angular Animations fallback)**: Rejected — Safari/Firefox lack support.
- **Skip View Transitions entirely**: Viable, but it's a free progressive enhancement that improves perceived quality on Chrome.

## R-009: Bundle Size Impact Assessment

**Decision**: No new dependencies required. `@angular/animations` is part of the Angular platform (already tree-shaken into the build when `provideAnimationsAsync()` is added). Font files add ~65–110KB to assets (one-time, cached). No third-party animation libraries.

**Rationale**: The constitution mandates bundle budget enforcement (500KB warning / 1MB error for initial bundle). Adding `@angular/animations` via `provideAnimationsAsync()` adds approximately 60KB to the initial bundle (gzipped: ~16KB). This is well within budget. Self-hosted fonts are static assets loaded on demand, not part of the JS bundle. PrimeNG is already in the bundle.

**Alternatives Considered**:

- N/A — no new dependencies proposed.

## R-010: Performance Strategy for Large Collections

**Decision**: Continue using server-side pagination (already in `CollectionService`). Add `loading="lazy"` to all poster `<img>` tags (already present on media cards). Entrance animations only trigger for cards entering the viewport (IntersectionObserver). Consider virtual scrolling (`@angular/cdk/scrolling`) as a future optimization if pagination UX changes.

**Rationale**: The existing pagination model (20 items per page) keeps DOM node count manageable (~20–80 cards per page). IntersectionObserver-triggered animations avoid computing animations for off-screen cards. `NgOptimizedImage` should replace raw `<img>` tags per constitution requirements (IV. Performance — Image Optimization). Virtual scrolling is unnecessary with pagination but noted for future infinite-scroll scenarios.

**Alternatives Considered**:

- **Infinite scroll with virtual scrolling**: More complex UX change; pagination is simpler and already working.
- **Pre-render all cards but hide off-screen**: Wasteful; IntersectionObserver approach is better.
