# Tasks: UX/UI Redesign

**Input**: Design documents from `specs/005-ux-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/design-tokens.md ✅, quickstart.md ✅

**Tests**: Test tasks are grouped in Phase 11 (after each implementation phase). Constitution §II mandates unit+component tests for all new services, directives, and non-trivial components (80% coverage target).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root (Angular SPA)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Font assets, design tokens, global styles, and Angular Animations bootstrap

- [x] T001 Download and add self-hosted font files (Bebas Neue Regular WOFF2, Inter Regular/500/600 WOFF2) to `src/assets/fonts/`
- [x] T002 Add `@font-face` declarations for Bebas Neue and Inter (with `font-display: swap`) and declare all CSS custom property design tokens (`:root` block per contracts/design-tokens.md including color, typography, animation tokens, and `prefers-reduced-motion` override) in `src/styles.scss`
- [x] T003 Add `provideAnimationsAsync()` to providers and customize PrimeNG Aura preset with dark cinematic palette tokens (primitive/semantic color overrides for surface `#141420`, primary `#6366F1`, text `#F5F5F7`) via `providePrimeNG()` in `src/app/app.config.ts`
- [x] T004 [P] Create animation timing constants (`ANIMATION_TIMINGS` with FAST, NORMAL, SLOW, STAGGER_DELAY) in `src/app/shared/animations/animation.config.ts`
- [x] T005 [P] Create breakpoint constants (`BREAKPOINTS` with MOBILE, TABLET, DESKTOP media queries) in `src/app/shared/constants/breakpoints.ts`
- [x] T006 [P] Create SCSS mixins file with reusable mixins (card-glow, shimmer, responsive-grid, focus-ring, gradient-overlay) in `src/app/shared/styles/_mixins.scss`
- [x] T007 [P] Create SCSS variables file referencing CSS custom properties for use in component styles in `src/app/shared/styles/_variables.scss`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared utilities and app shell wiring that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create `InViewportDirective` using `IntersectionObserver` (sets `inViewport` signal to `true` once element enters viewport, disconnects via `DestroyRef`) in `src/app/shared/directives/in-viewport.directive.ts`
- [x] T009 Create route transition animation definitions (cross-fade pattern: opacity 1→0 outgoing, 0→1 incoming, 150ms each, triggered by `route.data['animation']`) in `src/app/shared/animations/route.animations.ts`
- [x] T010 Add `@routeAnimation` trigger binding to `<router-outlet>` in `src/app/app.html` and wire the route animation trigger (reading `ActivatedRoute` data) in `src/app/app.ts`
- [x] T011 Add `data: { animation: 'PageName' }` to each feature route in `src/app/app.routes.ts` (CollectionPage, DetailPage, SearchPage, WishlistPage, etc.)
- [x] T012 Update app shell background to use `--color-bg-base` and apply global dark theme styles (body, scrollbar, selection) in `src/app/app.scss`
- [x] T013 Add global focus-visible styles (`outline: 2px solid var(--color-accent)`) and keyboard navigation styles for all interactive elements in `src/styles.scss`
- [x] T014 Add new i18n translation keys for redesigned UI text (empty states, navigation labels, accessibility labels) in `src/assets/i18n/en.json` and `src/assets/i18n/fr.json`

**Checkpoint**: Foundation ready — shared utilities, app shell, route animations, and design system are in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse Collection with Cinematic Visual Experience (Priority: P1) 🎯 MVP

**Goal**: Transform the collection page into an immersive, dark-themed media browsing experience with poster-centric cards, hover micro-interactions, staggered scroll-triggered entrance animations, and shimmer skeleton loading states.

**Independent Test**: Navigate to the collection page, verify dark theme with `#0A0A0F` background, scroll through media items to see staggered fade-in card entrances, hover over cards to see scale(1.04) + Indigo glow + info overlay, and trigger loading states to see shimmer skeletons.

### Implementation for User Story 1

- [x] T015 [P] [US1] Restyle `CollectionPageComponent` with dark theme grid layout, responsive CSS Grid columns (1 col mobile / 2–3 tablet / 4–6 desktop per FR-019), and add staggered card entrance animation trigger (`query(':enter', stagger(50, ...))`) in `src/app/features/collection/collection-page.component.ts`
- [x] T016 [P] [US1] Update collection page template with animation bindings (`@cardEnter` triggers), responsive grid wrapper, and `NgOptimizedImage` migration for poster images in `src/app/features/collection/collection-page.component.html`
- [x] T017 [P] [US1] Restyle collection page with dark grid background (`--color-bg-base`), responsive column breakpoints via SCSS mixins, and card gap spacing in `src/app/features/collection/collection-page.component.scss`
- [x] T018 [US1] Add `InViewportDirective` integration, hover state signal, and `@cardEnter` Angular Animation (void→visible: opacity 0→1, translateY 24px→0, 300ms) to `MediaCardComponent` in `src/app/features/collection/media-card.component.ts`
- [x] T019 [US1] Update media card template with gradient overlay (`--color-poster-gradient`), Bebas Neue title overlay, quick-info section (title, year, rating), `NgOptimizedImage` with width/height, and no-poster placeholder using `--color-bg-elevated` in `src/app/features/collection/media-card.component.html`
- [x] T020 [US1] Restyle media card with dark surface background (`--color-bg-surface`), CSS hover micro-interactions (scale 1.04, box-shadow using `--color-accent-glow`, info overlay reveal within 200ms), Bebas Neue font for title, and border using `--color-border` in `src/app/features/collection/media-card.component.scss`
- [x] T021 [US1] Redesign empty collection component with attractive dark-themed empty state illustration, call-to-action button styled with accent color, and updated i18n text in `src/app/features/collection/empty-collection.component.ts`
- [x] T022 [US1] Enhance `LoadingSkeletonComponent` with CSS shimmer animation overlay (`@keyframes shimmer` with translucent gradient, `transform: translateX()` for GPU acceleration, disabled under `prefers-reduced-motion`) in `src/app/shared/components/loading-skeleton.component.ts`

**Checkpoint**: Collection page is fully functional with cinematic dark theme, staggered card entrances, hover interactions, shimmer skeletons, and responsive grid. Can be tested independently.

---

## Phase 4: User Story 2 — Responsive Navigation and Layout Across Devices (Priority: P1)

**Goal**: Refactor the navigation shell so the sidebar adapts to three states: expanded desktop, collapsed icon-rail, and mobile bottom navigation bar, with smooth Angular Animations transitions at each breakpoint.

**Independent Test**: Resize the browser across breakpoints — verify full sidebar on desktop >1024px with smooth collapse toggle, adaptive layout on tablet 768–1024px, and bottom navigation bar on mobile <768px. Verify route transitions play fade animation on navigation.

### Implementation for User Story 2

- [x] T023 [US2] Refactor `SidebarComponent` to add `BreakpointObserver` (via `@angular/cdk/layout`) with `toSignal()`, computed `NavigationMode` signal ('expanded' | 'collapsed' | 'mobile'), and `@sidebarState` Angular Animation trigger (width 220px↔60px over 200ms, mobile slide-from-bottom) in `src/app/core/layout/sidebar.component.ts`
- [x] T024 [US2] Update sidebar template with conditional rendering: desktop sidebar (expanded/collapsed rail) vs mobile bottom navigation bar, animated icon transitions, and active route highlighting with accent color in `src/app/core/layout/sidebar.component.html`
- [x] T025 [US2] Restyle sidebar with dark theme (`--color-bg-surface` background, `--color-border` dividers, `--color-accent` active state), mobile bottom nav bar styles (fixed bottom, horizontal icon layout, safe-area padding), and collapsed rail styles (60px width, centered icons) in `src/app/core/layout/sidebar.component.scss`

**Checkpoint**: Navigation shell is fully responsive: desktop sidebar with expand/collapse, mobile bottom nav. Route transitions animate between pages. Can be tested independently.

---

## Phase 5: User Story 3 — Immersive Media Detail Experience (Priority: P2)

**Goal**: Create a cinematic media detail page with a full-width backdrop hero section, gradient overlay, Bebas Neue title, parallax scroll effect, and animated season/episode accordion for TV shows.

**Independent Test**: Click a media card from the collection to navigate to detail view. Verify hero section with backdrop image + gradient overlay + Bebas Neue title, parallax effect on scroll, and expand/collapse accordion for TV show seasons with staggered episode reveals.

### Implementation for User Story 3

- [x] T026 [P] [US3] Add hero section logic with parallax scroll handler (`requestAnimationFrame`-throttled scroll listener setting `--scroll-offset` CSS custom property, disabled under `prefers-reduced-motion`), and entry animation trigger to `MediaDetailPageComponent` in `src/app/features/media-detail/media-detail-page.component.ts`
- [x] T027 [P] [US3] Update detail page template with full-width hero section (backdrop image via `NgOptimizedImage` with width/height, gradient overlay using `--color-poster-gradient`, title in `--font-display`, metadata in `--font-body`), and parallax transform binding in `src/app/features/media-detail/media-detail-page.component.html`
- [x] T028 [P] [US3] Restyle detail page with hero section styles (full-width backdrop, gradient fade to `--color-bg-base`, parallax transform layer), dark content area (`--color-bg-surface` panels), and responsive layout adjustments in `src/app/features/media-detail/media-detail-page.component.scss`
- [x] T029 [US3] Add `@accordionExpand` Angular Animation trigger (height 0→auto with opacity fade, 300ms, staggered episode fade-in) to `SeasonListComponent` in `src/app/features/media-detail/season-list.component.ts`
- [x] T030 [US3] Update season list template with animation trigger bindings on expand/collapse and staggered episode entry in `src/app/features/media-detail/season-list.component.html`
- [x] T031 [US3] Restyle season list with dark accordion styles (`--color-bg-surface` headers, `--color-bg-elevated` content, `--color-border` dividers, `--color-accent` expand indicator) in `src/app/features/media-detail/season-list.component.scss`

**Checkpoint**: Media detail page has a cinematic hero with parallax, animated accordion for seasons. Can be tested independently by navigating to any media item.

---

## Phase 6: User Story 4 — Search and Discovery with Visual Polish (Priority: P2)

**Goal**: Apply the dark cinematic treatment to the TMDB search page (focus glow on search input, staggered result cards) and the wishlist page (consistent card style and entrance animations with collection).

**Independent Test**: Navigate to TMDB search, type a query, verify search input focus glow and staggered result card entrances. Navigate to wishlist, verify consistent dark card styles and entrance animations matching the collection grid.

### Implementation for User Story 4

- [x] T032 [P] [US4] Add search input focus glow animation and staggered result card entrance trigger (`query + stagger`) to `TmdbSearchPageComponent` in `src/app/features/tmdb-search/tmdb-search-page.component.ts`
- [x] T033 [P] [US4] Update search page template with animation bindings on result cards and focus animation on search input in `src/app/features/tmdb-search/tmdb-search-page.component.html`
- [x] T034 [P] [US4] Restyle search page with dark theme (`--color-bg-base` background), search input focus animation (Indigo `--color-accent` glow border transition), and responsive grid for results in `src/app/features/tmdb-search/tmdb-search-page.component.scss`
- [x] T035 [P] [US4] Restyle `TmdbResultCardComponent` with dark card surface (`--color-bg-surface`), hover micro-interactions matching media cards, and `NgOptimizedImage` migration in `src/app/features/tmdb-search/tmdb-result-card.component.ts`
- [x] T036 [P] [US4] Update TMDB result card template with `NgOptimizedImage`, gradient overlay, and styled metadata in `src/app/features/tmdb-search/tmdb-result-card.component.html`
- [x] T037 [P] [US4] Restyle TMDB result card with dark theme, hover glow, and consistent card styling in `src/app/features/tmdb-search/tmdb-result-card.component.scss`
- [x] T038 [P] [US4] Add staggered entrance animation trigger to `WishlistPageComponent` and apply responsive CSS Grid (matching collection column counts) in `src/app/features/wishlist/wishlist-page.component.ts`
- [x] T039 [P] [US4] Update wishlist page template with animation bindings and responsive grid wrapper in `src/app/features/wishlist/wishlist-page.component.html`
- [x] T040 [P] [US4] Restyle wishlist page with dark grid layout, responsive columns, consistent spacing with collection in `src/app/features/wishlist/wishlist-page.component.scss`
- [x] T041 [P] [US4] Restyle `WishlistCardComponent` with dark card surface, hover micro-interactions (scale + glow), and `NgOptimizedImage` migration in `src/app/features/wishlist/wishlist-card.component.ts`
- [x] T042 [P] [US4] Update wishlist card template with `NgOptimizedImage`, gradient overlay, and styled metadata in `src/app/features/wishlist/wishlist-card.component.html`
- [x] T043 [P] [US4] Restyle wishlist card with dark theme, hover glow, Bebas Neue title, consistent with media cards in `src/app/features/wishlist/wishlist-card.component.scss`

**Checkpoint**: Search and wishlist pages have consistent dark cinematic styling, focus animations, staggered card entrances, and hover interactions. Can be tested independently.

---

## Phase 7: User Story 5 — Animated Loading States and Transitions (Priority: P3)

**Goal**: Polish loading states app-wide with enhanced shimmer skeletons, ensure all route transitions animate smoothly, and style toast notifications with dark theme and Angular Animations enter/exit.

**Independent Test**: Throttle network to observe shimmer skeletons on all pages, navigate between multiple routes to verify smooth cross-fade transitions, trigger a toast notification to verify dark-themed slide-in/out animation.

### Implementation for User Story 5

- [x] T044 [US5] Restyle `ErrorMessageComponent` with dark theme styling (`--color-bg-elevated` background, `--color-text-primary` text, accent border) in `src/app/shared/components/error-message.component.ts`
- [x] T045 [US5] Add global PrimeNG toast overrides for dark theme (dark surface background, accent left-border, Angular Animations slide-in from right + fade-out) in `src/styles.scss`

**Checkpoint**: Loading states are polished across the app, route transitions are smooth, and toast notifications have cinematic styling. Can be tested independently.

---

## Phase 8: User Story 6 — Accessibility and Reduced Motion Support (Priority: P3)

**Goal**: Ensure all animations respect `prefers-reduced-motion`, all interactive elements have visible focus rings, keyboard navigation works throughout, and WCAG AA contrast is maintained.

**Independent Test**: Enable `prefers-reduced-motion: reduce` in OS/browser, navigate entire app with keyboard only, verify all animations are suppressed, focus rings are visible (`2px solid #6366F1`), and all content is accessible.

### Implementation for User Story 6

- [x] T046 [US6] Add `@.disabled` binding for Angular Animations (bound to `prefers-reduced-motion` media query match via `matchMedia`) to disable all Angular Animation triggers when reduced motion is preferred in `src/app/app.ts`
- [x] T047 [US6] Audit and update all interactive elements (nav items, cards, buttons, accordions, search input) to ensure keyboard operability, `tabindex` where needed, `aria-label` attributes, and visible focus ring via `--color-accent` in all modified component templates
- [x] T048 [US6] Verify and enforce `alt` attributes on all `<img>` and `NgOptimizedImage` instances with media title text across `src/app/features/collection/`, `src/app/features/media-detail/`, `src/app/features/tmdb-search/`, and `src/app/features/wishlist/`

**Checkpoint**: App is fully accessible — reduced motion disables all animations, keyboard navigation works, focus rings are visible, contrast meets WCAG AA, and all images have alt text.

---

## Phase 9: User Story — Spotlight Carousel (Priority: P3, Optional)

**Goal**: Add a horizontal "Recently Added" spotlight carousel at the top of the Collection page with Angular Animations slide transitions.

**Independent Test**: Navigate to the collection page, verify a horizontal carousel of recently added media appears above the main grid with smooth slide transitions.

### Implementation

- [x] T049 [FR-023] Create `SpotlightCarouselComponent` (standalone, OnPush, signals) with horizontal scroll, Angular Animations slide transitions, responsive sizing, and dark card styling in `src/app/features/collection/spotlight-carousel.component.ts`
- [x] T050 [FR-023] Integrate `SpotlightCarouselComponent` into the collection page template above the main grid (conditionally rendered when recently added items exist; data source: last 10 items sorted by `dateAdded` descending) in `src/app/features/collection/collection-page.component.html`

**Checkpoint**: Spotlight carousel is displayed on the collection page with smooth animations. Optional enhancement — collection page works without it.

---

## Phase 10: FR-022 — Profile Page Theme-Only (Priority: P3)

**Goal**: Apply the dark cinematic palette and typography tokens to the Profile page. No advanced animations — only design token migration (colors, fonts, surfaces, borders) per FR-022.

**Independent Test**: Navigate to the Profile page, verify dark background surfaces (`--color-bg-surface`), accent-colored avatar, Bebas Neue page title, Inter body text, and consistent `--color-border` on cards. No shimmer, parallax, or staggered entrance animations expected.

### Implementation for FR-022 — Profile

- [x] T064 [FR-022] Restyle profile page SCSS to use design tokens: replace `var(--p-primary-color)` with `var(--color-accent)` on avatar, `var(--p-text-color-secondary)` with `var(--color-text-secondary)` on labels, `var(--p-text-color)` with `var(--color-text-primary)` on values; apply `font-family: var(--font-display)` to `&__title`, `font-family: var(--font-body)` to body text elements; add `background: var(--color-bg-surface)` and `border: 1px solid var(--color-border)` to `&__card` and `&__preferences` in `src/app/features/profile/profile-page.component.scss`

**Checkpoint**: Profile page uses design tokens for all colors, typography, and surfaces. Visually consistent with the dark cinematic theme. No animations required.

---

## Phase 11: FR-022 — Admin Dashboard Theme-Only (Priority: P3)

**Goal**: Apply the dark cinematic palette and typography tokens to all Admin area components (layout, dashboard, scanner, users, library roots, review, scan results, enrichment, parent folders, and shared dialogs). No advanced animations — only design token migration per FR-022.

**Independent Test**: Navigate to Admin → Dashboard, verify dark surfaces and design token colors throughout. Click through each admin sub-page (Users, Library Roots, Scanner, Review, Scan Results, Enrichment, Parent Folders) and confirm consistent dark palette, `--font-display` on page titles, `--font-body` on body text, and `--color-border` on all borders/dividers.

### Implementation for FR-022 — Admin

- [ ] T065 [FR-022] Restyle admin layout SCSS: add `background: var(--color-bg-base)` to `:host`, `color: var(--color-text-primary)` to `.admin-layout`, and `border-bottom: 1px solid var(--color-border)` to tab navigation area in `src/app/features/admin/admin-layout.component.scss`
- [ ] T066 [P] [FR-022] Restyle dashboard page SCSS: replace `var(--text-color)` with `var(--color-text-primary)` on `&__title`, apply `font-family: var(--font-display)` to title, add `background: var(--color-bg-surface)` and `border: 1px solid var(--color-border)` to grid cards in `src/app/features/admin/dashboard/admin-dashboard-page.component.scss`
- [ ] T067 [P] [FR-022] Restyle health panel SCSS: replace `var(--text-color-secondary)` with `var(--color-text-secondary)` on `&__label` and `&__empty`, replace `var(--text-color)` with `var(--color-text-primary)` on `&__value`, apply `font-family: var(--font-body)` to content text in `src/app/features/admin/dashboard/health-panel.component.scss`
- [ ] T068 [P] [FR-022] Restyle scanner page and sub-components SCSS: replace `var(--p-surface-border)` with `var(--color-border)` and `var(--p-surface-card)` with `var(--color-bg-surface)` on section containers, apply `font-family: var(--font-display)` to `__title` elements; update scan-status `var(--p-surface-100)` to `var(--color-bg-elevated)` and `var(--p-text-muted-color)` to `var(--color-text-secondary)` across `src/app/features/admin/scanner/admin-scanner-page.component.scss`, `src/app/features/admin/scanner/scan-status.component.scss`, `src/app/features/admin/scanner/scan-launcher.component.scss`, and `src/app/features/admin/scanner/scan-history-table.component.scss`
- [ ] T069 [P] [FR-022] Restyle users page SCSS: apply `font-family: var(--font-display)` to `&__title`, `font-family: var(--font-body)` to body text, add `color: var(--color-text-primary)` to title in `src/app/features/admin/users/admin-users-page.component.scss`
- [ ] T070 [P] [FR-022] Restyle library roots page SCSS: apply `font-family: var(--font-display)` to `&__title`, replace `var(--p-primary-color)` with `var(--color-accent)` and `var(--p-primary-contrast-color)` with `var(--color-text-primary)` on `&__badge`, add `color: var(--color-text-primary)` to title in `src/app/features/admin/library-roots/admin-library-roots-page.component.scss`
- [ ] T071 [P] [FR-022] Restyle review page and resolve dialog SCSS: replace `var(--surface-hover)` with `var(--color-bg-elevated)` on row hover, apply `font-family: var(--font-display)` to `&__title`; in resolve dialog replace `var(--text-color-secondary)` with `var(--color-text-secondary)`, `var(--surface-border)` with `var(--color-border)`, `var(--surface-hover)` with `var(--color-bg-elevated)`, `var(--primary-color)` with `var(--color-accent)`, `var(--primary-50)` with `var(--color-bg-surface)`, `var(--surface-100)` with `var(--color-bg-elevated)` across `src/app/features/admin/review/admin-review-page.component.scss` and `src/app/features/admin/review/review-resolve-dialog.component.scss`
- [ ] T072 [P] [FR-022] Restyle scan results page and sub-components SCSS: replace `var(--p-text-muted-color)` with `var(--color-text-secondary)`, `var(--p-surface-border)` with `var(--color-border)`, `var(--p-surface-50)` and `var(--p-surface-100)` with `var(--color-bg-elevated)`, `var(--p-surface-200)` with `var(--color-bg-elevated)` across `src/app/features/admin/scan-results/admin-scan-results-page.component.scss`, `src/app/features/admin/scan-results/scan-decision-detail.component.scss`, `src/app/features/admin/scan-results/scan-decision-table.component.scss`, and `src/app/features/admin/scan-results/tv-show-group-list.component.scss`
- [ ] T073 [P] [FR-022] Restyle enrichment page SCSS: replace `var(--p-text-muted-color)` with `var(--color-text-secondary)` on `&__stat-label`, apply `font-family: var(--font-display)` to `&__title`, add `color: var(--color-text-primary)` to `&__stat-value` in `src/app/features/admin/enrichment/admin-enrichment-page.component.scss`
- [ ] T074 [P] [FR-022] Restyle parent folders page SCSS: replace `var(--p-text-color-secondary)` with `var(--color-text-secondary)` on `&__subtitle`, replace `var(--p-primary-color)` with `var(--color-accent)` and `var(--p-primary-contrast-color)` with `var(--color-text-primary)` on `&__badge`, apply `font-family: var(--font-display)` to `&__title` in `src/app/features/admin/parent-folders/admin-parent-folders-page.component.scss`
- [ ] T075 [P] [FR-022] Restyle shared admin components SCSS: in rename-dialog replace `var(--text-color-secondary)` with `var(--color-text-secondary)` and `var(--surface-border)` with `var(--color-border)`; in tmdb-search-panel replace `var(--p-surface-border)` with `var(--color-border)`, `var(--p-surface-hover)` with `var(--color-bg-elevated)`, `var(--p-surface-200)` with `var(--color-bg-elevated)`, `var(--p-text-muted-color)` with `var(--color-text-secondary)` across `src/app/features/admin/shared/rename-dialog.component.scss` and `src/app/features/admin/shared/tmdb-search-panel.component.scss`

**Checkpoint**: All admin pages use design tokens for colors, typography, and surfaces. Visually consistent with the dark cinematic theme across all sub-pages. No animations required. T051 verification can now confirm theme-only pages are correct.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories

- [ ] T051 [P] Verify PrimeNG token overrides apply correctly to theme-only pages (Settings, Profile, Admin) — confirm dark palette and Inter/Bebas Neue typography without advanced animations
- [ ] T052 [P] **⚠️ Measure baseline first**: Run `ng build --configuration=production` BEFORE making changes to record baseline bundle size. After implementation, verify bundle stays within constitution budget (**500kB warning / 1MB error** initial) — record `@angular/animations` impact separately. If baseline already exceeds 500kB, file a constitution amendment ADR before continuing.
- [ ] T053 [P] Audit all animation definitions across the codebase to verify ONLY `transform` and `opacity` are animated (no `width`, `height`, `top`, `left`, `margin`, or other layout-triggering properties) — enforce SC-004 reflow safety
- [ ] T054 [P] Verify Lighthouse scores: 90+ desktop / 75+ mobile, LCP < 2.5s, TTI < 3s, CLS < 0.1 on collection and detail pages
- [ ] T055 Run full quickstart.md verification checklist (all 11 items: dark theme, typography, card hover, scroll entrance, route transitions, sidebar collapse, mobile nav, skeleton shimmer, reduced motion, focus rings, contrast)
- [ ] T056 Verify all new/modified components use `ChangeDetectionStrategy.OnPush`, are standalone (no NgModules), and use signals for state

---

## Phase 13: Tests (Constitution §II — Mandatory)

**Purpose**: Unit and component tests for all new shared utilities and modified components. Required by constitution §II (80% coverage, behavior-focused, test isolation). Uses Vitest.

- [ ] T057 [P] Write unit tests for `InViewportDirective`: verify `inViewport` signal becomes `true` when element enters viewport, stays `false` when not intersecting, and `IntersectionObserver` is disconnected on component destroy — `src/app/shared/directives/in-viewport.directive.spec.ts`
- [ ] T058 [P] Write unit tests for route animation definitions in `route.animations.ts`: verify trigger names exist, transition states are correctly defined, and animation metadata structure is valid — `src/app/shared/animations/route.animations.spec.ts`
- [ ] T059 [P] Write component tests for `SidebarComponent`: verify `BreakpointObserver` correctly sets `NavigationMode` signal to 'mobile' / 'collapsed' / 'expanded' at respective breakpoints; verify `@sidebarState` animation trigger fires on mode change — `src/app/core/layout/sidebar.component.spec.ts`
- [ ] T060 [P] Write component tests for `MediaCardComponent`: verify hover state signal toggles correctly on `mouseenter`/`mouseleave`; verify `@cardEnter` animation trigger fires when `inViewport` signal becomes true; verify no-poster placeholder renders when `posterUrl` is null — `src/app/features/collection/media-card.component.spec.ts`
- [ ] T061 [P] Write component tests for `LoadingSkeletonComponent`: verify shimmer element is rendered in DOM; verify it has the CSS class that drives the `@keyframes shimmer` animation; verify animation is disabled when `prefers-reduced-motion: reduce` is active (via CSS custom property `--anim-normal: 0ms`) — `src/app/shared/components/loading-skeleton.component.spec.ts`
- [ ] T062 [P] Write component tests for `SeasonListComponent`: verify `@accordionExpand` Angular Animation trigger is bound to expand/collapse state signal; verify episode list renders when season is expanded and is hidden when collapsed — `src/app/features/media-detail/season-list.component.spec.ts`
- [ ] T063 [P] Write unit tests for `animation.config.ts`: verify `ANIMATION_TIMINGS` exports FAST (150), NORMAL (300), SLOW (500), STAGGER_DELAY constants with correct numeric values — `src/app/shared/animations/animation.config.spec.ts`

**Checkpoint**: All new utilities and modified components have passing tests. Run `npx vitest --coverage` and verify 80%+ line coverage on new files.

---

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 Collection (Phase 3)**: Depends on Foundational — delivers MVP
- **US2 Navigation (Phase 4)**: Depends on Foundational — can run in parallel with US1
- **US3 Media Detail (Phase 5)**: Depends on Foundational — can run in parallel with US1/US2
- **US4 Search & Wishlist (Phase 6)**: Depends on Foundational — can run in parallel with US1/US2/US3
- **US5 Loading States (Phase 7)**: Depends on US1 (shimmer component from T022)
- **US6 Accessibility (Phase 8)**: Depends on US1–US4 (audits all modified components)
- **Spotlight Carousel (Phase 9)**: Depends on US1 (integrates into collection page)
- **FR-022 Profile Theme-Only (Phase 10)**: Depends on Foundational (design tokens from Phase 1/2) — can run in parallel with US1–US4
- **FR-022 Admin Theme-Only (Phase 11)**: Depends on Foundational (design tokens from Phase 1/2) — can run in parallel with US1–US4 and Phase 10
- **Polish (Phase 12)**: Depends on all user stories and FR-022 phases being complete — T051 verifies theme-only pages from Phases 10–11
- **Tests (Phase 13)**: Can start incrementally after each phase; T057-T063 map to Foundational/Phase 2-5 components and can be written in parallel with implementation work

### User Story Dependencies

- **US1 (P1)**: After Foundational — no dependencies on other stories ← **MVP**
- **US2 (P1)**: After Foundational — independent of US1 (different files: sidebar vs collection)
- **US3 (P2)**: After Foundational — independent (media-detail feature module)
- **US4 (P2)**: After Foundational — independent (search + wishlist features)
- **US5 (P3)**: After US1 (needs shimmer component T022) — lightweight overlay
- **US6 (P3)**: After US1–US4 — cross-cutting audit of all modified components

### Within Each User Story

- Component logic (.ts) before template (.html) before styles (.scss)
- Parent components before child integrations
- Shared utilities before feature components (handled by Foundational phase)

### Parallel Opportunities

- **Phase 1**: T004, T005, T006, T007 can all run in parallel (different files)
- **Phase 2**: T008 and T009 can run in parallel (directive vs animation definitions)
- **Phase 3**: T015, T016, T017 (collection page files) can run in parallel; T018→T019→T020 are sequential (media card)
- **Phase 4**: All US2 tasks are sequential (same component)
- **Phase 5**: T026, T027, T028 (detail page) in parallel; T029→T030→T031 (season list) sequential
- **Phase 6**: All US4 tasks are parallelizable (different component files across search and wishlist)
- **After Foundational**: US1, US2, US3, US4, FR-022 Profile (Phase 10), FR-022 Admin (Phase 11) can all proceed simultaneously
- **Phase 10**: Single task (T064) — profile SCSS restyling
- **Phase 11**: T066–T075 are all parallelizable (different admin component SCSS files); only T065 (admin layout) should complete first as it sets the layout shell tokens

---

## Parallel Example: User Story 1

```bash
# Launch all collection page files together (different file types):
Task T015: "Restyle CollectionPageComponent .ts"
Task T016: "Update collection page template .html"
Task T017: "Restyle collection page .scss"

# Then media card (sequential within component):
Task T018: "Add InViewportDirective to MediaCardComponent .ts"
Task T019: "Update media card template .html"
Task T020: "Restyle media card .scss"

# Independent parallel tasks:
Task T021: "Redesign empty collection component"
Task T022: "Enhance LoadingSkeletonComponent with shimmer"
```

## Parallel Example: After Foundational Phase

```bash
# All user stories can launch simultaneously:
Developer A → US1: Collection page (Phase 3)
Developer B → US2: Navigation shell (Phase 4)
Developer C → US3: Media detail (Phase 5)
Developer D → US4: Search + Wishlist (Phase 6)
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. Complete Phase 1: Setup (fonts, tokens, animation bootstrap)
2. Complete Phase 2: Foundational (directives, route animations, app shell)
3. Complete Phase 3: User Story 1 — Collection (the primary landing page)
4. Complete Phase 4: User Story 2 — Navigation (responsive shell)
5. **STOP and VALIDATE**: The app has a cinematic collection page with responsive navigation
6. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Design system and shared infrastructure ready
2. Add US1 (Collection) → Cinematic browsing experience → Deploy/Demo (**MVP!**)
3. Add US2 (Navigation) → Responsive layout across devices → Deploy/Demo
4. Add US3 (Media Detail) → Immersive detail with parallax + accordion → Deploy/Demo
5. Add US4 (Search + Wishlist) → Consistent visual polish everywhere → Deploy/Demo
6. Add US5 (Loading States) → Polished transitions and toasts → Deploy/Demo
7. Add US6 (Accessibility) → Reduced motion + keyboard nav → Deploy/Demo
8. Add Spotlight Carousel (optional P3) → Premium carousel enhancement
9. Add FR-022 Profile + Admin Theme-Only (Phases 10–11) → Dark palette + typography on remaining pages
10. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No new heavy dependencies — only `@angular/animations` (platform package) added
- All colors, fonts, and animation timings via CSS custom properties — no hard-coded values
- All components must be standalone, OnPush, signals-first per constitution
- **Bundle budget: 500kB warning / 1MB error** (constitution §IV) — measure baseline before implementation (T052)
