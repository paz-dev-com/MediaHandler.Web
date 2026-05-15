# Feature Specification: UX/UI Redesign

**Feature Branch**: `005-ux-redesign`  
**Created**: 2025-07-23  
**Status**: Draft  
**Input**: User description: "This app needs some new UX, especially the graphic part. I want a modern, responsive web app with amazing animations. Something like this website: https://aerukart.com"

## Clarifications

### Session 2025-07-23

- Q: What animation technology should be used for the redesign? → A: Angular Animations API (`@angular/animations`) as the primary animation engine for route transitions, entrance/exit, and sequence orchestration; CSS animations/transitions for micro-interactions (hover, shimmer, focus states). No third-party animation library (e.g. GSAP) is introduced.
- Q: What are the exact dark theme color token values (background, surface, accent)? → A: Cinematic dark palette — base `#0A0A0F`, surface `#141420`, elevated surface `#1E1E2E`, accent `#6366F1` (Indigo-500), accent hover `#818CF8` (Indigo-400), text primary `#F5F5F7`, text secondary `#A1A1AA`, border `rgba(255,255,255,0.08)`. All values defined as CSS custom properties.
- Q: Which font families should be used for the redesign? → A: `Bebas Neue` (Google Fonts) for display/hero and card-overlay headings; `Inter` (Google Fonts) for all body text, metadata, labels, and UI controls. Both loaded via `@font-face` in styles.scss; fallback to `system-ui, sans-serif`.
- Q: Which pages/views receive a full redesign vs. a theme-only treatment? → A: Full redesign (layout + design tokens + animations): Collection/Library, Media Detail, Search, Wishlist, Navigation Shell (sidebar + mobile nav). Theme-only (dark palette + typography, no advanced animations): Settings, User Profile, Admin Dashboard. Unchanged/out-of-scope: Auth/login flow (Auth0-managed).
- Q: What is the primary poster/artwork display style for grids (standard grid, masonry, or carousel)? → A: Responsive CSS Grid is the primary display (FR-019 column counts apply). No masonry layout (complexity, performance). A horizontal "Recently Added" spotlight carousel is included as a P3 optional section at the top of the Collection page only; the main body remains a standard grid.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse Collection with Cinematic Visual Experience (Priority: P1)

A user opens the MediaHandler app and is greeted by a visually striking, dark-themed interface that showcases their media collection with large, vivid poster artwork. As they scroll through their collection grid, media cards animate smoothly into view. Hovering over a card reveals additional details with fluid micro-interactions — a subtle scale effect, a glow, and a quick info overlay. The entire experience feels cinematic and immersive, reminiscent of premium streaming platforms.

**Why this priority**: The collection page is the primary landing page and the most-used screen. Transforming it into a visually stunning experience delivers the highest immediate impact and sets the tone for the entire redesign.

**Independent Test**: Can be fully tested by navigating to the collection page, scrolling through media items, and hovering over cards. Delivers a modern, immersive browsing experience that showcases the user's media library beautifully.

**Acceptance Scenarios**:

1. **Given** a user has media in their collection, **When** they open the app, **Then** media posters are displayed prominently in a responsive CSS Grid with the dark cinematic color palette (`#0A0A0F` base, `#6366F1` accent) and smooth Angular Animations entrance sequences
2. **Given** a user is viewing the collection grid, **When** they hover over a media card, **Then** the card responds with a CSS scale/lift transition, an Indigo glow effect (`box-shadow` using `--color-accent-glow`), and reveals quick-info (title, year, rating) within 200ms
3. **Given** a user is scrolling the collection, **When** new rows of media cards enter the viewport, **Then** the cards animate into view with staggered fade-in and slide-up transitions (Angular Animations `query` + `stagger`)
4. **Given** a user loads the collection page, **When** posters are still loading, **Then** attractive skeleton placeholders with a CSS shimmer animation are shown in place of each card

---

### User Story 2 - Responsive Navigation and Layout Across Devices (Priority: P1)

A user accesses MediaHandler from their phone, tablet, or desktop and the interface adapts seamlessly. On mobile, the sidebar collapses into a bottom navigation bar or hamburger menu with smooth open/close animations. On tablet, the layout adjusts to show fewer columns while keeping posters large and readable. On desktop, the full sidebar is visible with elegant expand/collapse transitions. All navigation transitions are fluid and keep the user oriented.

**Why this priority**: Mobile-first responsive design is foundational — without it, the app is unusable on a significant portion of devices. This must be addressed alongside the visual redesign.

**Independent Test**: Can be tested by resizing the browser or using multiple devices, verifying that navigation and layout adapt fluidly at all breakpoints.

**Acceptance Scenarios**:

1. **Given** a user opens the app on a mobile device (< 768px), **When** the page loads, **Then** the sidebar is replaced by a bottom navigation bar with fixed position at the bottom of the screen
2. **Given** a user is on a tablet (768px–1024px), **When** they browse the collection, **Then** the grid adjusts to show 2–3 columns with appropriately sized poster artwork
3. **Given** a user is on a desktop (> 1024px), **When** they click the sidebar collapse toggle, **Then** the sidebar smoothly collapses to an icon-only rail with an Angular Animations transition
4. **Given** a user navigates between pages on any device, **When** a route change occurs, **Then** a smooth page transition animation plays via Angular Animations router outlet animation (fade or cross-dissolve)

---

### User Story 3 - Immersive Media Detail Experience (Priority: P2)

A user taps or clicks on a media card and transitions into a rich, cinematic detail page. A hero section at the top displays the backdrop image with a gradient overlay, the title in bold `Bebas Neue` typography, and key metadata (year, genres, rating) in `Inter`. As the user scrolls down, parallax effects subtly shift the backdrop image. Season/episode lists for TV shows expand and collapse with smooth accordion animations.

**Why this priority**: The media detail page is the second most-visited page and the primary place where users interact deeply with a specific title. A cinematic detail view elevates the perceived quality of the entire app.

**Independent Test**: Can be tested by navigating from the collection to a specific media item and scrolling through the detail page, verifying visual treatments and animation quality.

**Acceptance Scenarios**:

1. **Given** a user clicks a media card, **When** the detail page loads, **Then** the hero section displays a full-width backdrop image with a gradient fade-to-dark overlay (`linear-gradient` to `#0A0A0F`), the title in `Bebas Neue`, and metadata in `Inter`
2. **Given** a user is viewing a media detail page, **When** they scroll down, **Then** the backdrop image exhibits a subtle parallax scrolling effect (CSS `transform` driven by scroll position)
3. **Given** a user is viewing a TV show, **When** they expand a season accordion, **Then** the episode list reveals with a smooth Angular Animations expand animation and each episode fades in sequentially
4. **Given** a user navigates from collection to detail, **When** the transition occurs, **Then** a smooth Angular Animations page transition connects the outgoing collection view to the incoming detail hero

---

### User Story 4 - Search and Discovery with Visual Polish (Priority: P2)

A user navigates to the TMDB search page and types a query. As they type, search results appear with a staggered animation, each result card sliding in. The search input has a subtle focus animation. Filtering and sorting controls animate smoothly when revealed or interacted with. The wishlist page also receives the same visual treatment with consistent card styles and animations.

**Why this priority**: Search and wishlist are high-traffic pages that benefit significantly from the visual redesign, reinforcing the consistent premium feel across the app.

**Independent Test**: Can be tested by performing a TMDB search and browsing the wishlist, verifying that visual polish and animations are applied consistently.

**Acceptance Scenarios**:

1. **Given** a user navigates to the search page, **When** they type a query and results load, **Then** result cards appear with staggered entrance animations (Angular Animations `stagger`)
2. **Given** a user is on the search page, **When** they focus the search input, **Then** the input displays a CSS focus animation (Indigo `#6366F1` glow and border transition)
3. **Given** a user views their wishlist, **When** the page loads, **Then** wishlist items are displayed with the same card style and entrance animations as the collection grid

---

### User Story 5 - Animated Loading States and Transitions (Priority: P3)

Throughout the app, wherever content is loading, the user sees polished loading states — shimmer skeletons for cards, animated spinners for actions, and progress indicators for longer operations. Page transitions between routes use smooth Angular Animations. Toast notifications animate in and out. All of these micro-interactions contribute to a fluid, premium feel.

**Why this priority**: Loading states and micro-interactions are the finishing touches that elevate the app from "redesigned" to "polished." They can be layered on after core layouts and animations are in place.

**Independent Test**: Can be tested by triggering loading states (slow network), navigating between pages, and performing actions that show notifications, verifying that all transitions are smooth and attractive.

**Acceptance Scenarios**:

1. **Given** any page is loading data, **When** the content is not yet available, **Then** CSS shimmer skeleton placeholders matching the expected layout are displayed
2. **Given** a user navigates between routes, **When** the route change occurs, **Then** a smooth Angular Animations transition plays between the outgoing and incoming pages
3. **Given** a user performs an action (e.g., toggle watched status), **When** a toast notification appears, **Then** it animates in from the edge via Angular Animations and animates out after a timeout

---

### User Story 6 - Accessibility and Reduced Motion Support (Priority: P3)

A user who has enabled "prefers-reduced-motion" in their OS settings visits the app. All Angular Animations and CSS animations are either disabled or replaced with simple, instant transitions. The app maintains proper contrast ratios in the dark theme, all interactive elements are keyboard-navigable, and screen readers can interpret the content correctly. The app remains fully usable without any animations.

**Why this priority**: Accessibility is non-negotiable but is listed as P3 because it is implemented as a cross-cutting concern layered on top of the animation and design work from P1–P2, not as a standalone feature.

**Independent Test**: Can be tested by enabling reduced-motion in OS settings and navigating the entire app with keyboard-only, verifying that all functions remain accessible and animations are suppressed.

**Acceptance Scenarios**:

1. **Given** a user has "prefers-reduced-motion: reduce" enabled, **When** they use the app, **Then** all Angular Animations and CSS animations are disabled or replaced with instant state changes
2. **Given** the dark theme is applied, **When** any text or interactive element is inspected, **Then** the contrast ratio meets WCAG 2.1 AA standards (minimum 4.5:1 for normal text, 3:1 for large text) against the `#0A0A0F` base background
3. **Given** a user navigates the app using only the keyboard, **When** they tab through interactive elements, **Then** a visible Indigo focus ring (`outline: 2px solid #6366F1`) is shown and all actions are performable without a mouse

---

### Edge Cases

- What happens when a media item has no poster image? A visually consistent placeholder using `--color-bg-elevated` (`#1E1E2E`) with the title in `Inter` is shown.
- What happens when the collection is empty? An attractive empty-state illustration or animation is displayed with a call to action to add media.
- How does the app behave on very slow connections? CSS shimmer skeleton loaders remain visible until content arrives; Angular Animations are not blocked by asset loading.
- What happens when a user rapidly navigates between pages? Angular Animations route transitions queue gracefully or cancel the previous animation to prevent visual glitches.
- What happens when the browser does not support modern CSS features (e.g., very old browsers)? The app degrades gracefully — layout remains functional, animations are simply absent.
- How does the app handle very large collections (1000+ items)? Pagination and lazy loading prevent performance degradation; only visible cards trigger entrance animations.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST use a dark, cinematic color palette as the default theme, defined entirely via CSS custom properties. Canonical token values: `--color-bg-base: #0A0A0F`, `--color-bg-surface: #141420`, `--color-bg-elevated: #1E1E2E`, `--color-accent: #6366F1`, `--color-accent-hover: #818CF8`, `--color-accent-glow: rgba(99, 102, 241, 0.35)`, `--color-text-primary: #F5F5F7`, `--color-text-secondary: #A1A1AA`, `--color-text-accent: #A5B4FC`, `--color-border: rgba(255,255,255,0.08)`, `--color-poster-gradient: linear-gradient(to top, rgba(10,10,15,0.96) 0%, rgba(10,10,15,0.45) 55%, transparent 100%)`. The `:root` block in the Design Tokens section is the complete canonical source.
- **FR-002**: The app MUST display media posters as the primary visual element in collection, search, and wishlist views, arranged in a **responsive CSS Grid** (not masonry). Column counts follow FR-019.
- **FR-003**: Media cards MUST have hover/focus micro-interactions using CSS transitions: scale(1.04) lift, box-shadow glow using `--color-accent-glow`, and an info overlay revealing title, year, and rating within 200ms
- **FR-004**: The app MUST implement scroll-triggered entrance animations for media cards (staggered fade-in with vertical slide) using Angular Animations `query` + `stagger` as cards enter the viewport
- **FR-005**: The app MUST implement smooth page transition animations when navigating between routes using Angular Animations applied to the router outlet
- **FR-006**: The media detail page MUST display a hero section with a full-width backdrop image, gradient overlay (`linear-gradient` to `--color-bg-base`), title in `Bebas Neue`, metadata in `Inter`, and a CSS parallax scrolling effect
- **FR-007**: The sidebar navigation MUST have smooth Angular Animations expand/collapse transitions and transform into a mobile-friendly navigation (bottom bar or slide-in drawer) on small screens
- **FR-008**: All loading states MUST use CSS shimmer skeleton placeholders that match expected content layout
- **FR-009**: The app MUST be fully responsive with breakpoints for mobile (< 768px), tablet (768px–1024px), and desktop (> 1024px), using a mobile-first approach
- **FR-010**: The app MUST respect the `prefers-reduced-motion` media query; all Angular Animations durations MUST be set to `0ms` and all CSS animation/transition durations MUST be `0s` when this preference is active
- **FR-011**: The dark theme MUST maintain WCAG 2.1 AA contrast ratios for all text and interactive elements against `--color-bg-base` (`#0A0A0F`)
- **FR-012**: All interactive elements MUST be keyboard-navigable with a visible focus ring using `outline: 2px solid var(--color-accent)` (Indigo `#6366F1`)
- **FR-013**: TV show season/episode lists MUST use Angular Animations accordion expand/collapse interactions
- **FR-014**: The search input MUST have a CSS focus animation (Indigo `#6366F1` glow and border transition)
- **FR-015**: Toast notifications MUST animate in and out using Angular Animations entrance/exit transitions
- **FR-016**: The app MUST support EN and FR languages via the existing Transloco i18n setup; all new UI text must have translation keys
- **FR-017**: Media cards without a poster image MUST display a styled placeholder using `--color-bg-elevated` with the media title in `Inter`
- **FR-018**: Typography MUST use `Bebas Neue` (Google Fonts) for display headings, hero titles, and card-overlay text; `Inter` (Google Fonts) for all body text, labels, metadata, and UI controls. Both fonts loaded via `@font-face` in `styles.scss` with `system-ui, sans-serif` as fallback.
- **FR-019**: The collection, wishlist, and search CSS Grids MUST adapt column counts: 1 column on mobile (< 768px), 2–3 columns on tablet (768px–1024px), 4–6 columns on desktop (> 1024px)
- **FR-020**: The empty collection state MUST display an attractive illustration or Angular Animation with a call-to-action to add media
- **FR-021**: The primary animation engine MUST be Angular Animations API (`@angular/animations`) for all route transitions, entrance/exit sequences, and accordion interactions; CSS animations/transitions MUST be used for micro-interactions (hover, shimmer, focus states). No third-party animation library (e.g. GSAP, Anime.js) is to be introduced.
- **FR-022**: **Redesign scope by page**: Full redesign (layout + design tokens + animations) applies to: Collection/Library, Media Detail, Search, Wishlist, Navigation Shell. Theme-only treatment (dark palette + typography, no advanced animations) applies to: Settings, User Profile, Admin Dashboard. Unchanged/out-of-scope: Auth/login flow (Auth0-managed).
- **FR-023**: A horizontal "Recently Added" spotlight carousel MUST be implemented at the top of the Collection page only, as a P3 optional enhancement. "Recently Added" is defined as the last 10 items sorted by `dateAdded` descending (API query parameter `sort=dateAdded&order=desc&limit=10`). The primary body of the Collection page remains a standard CSS Grid. The carousel MUST use Angular Animations for slide transitions.

### Key Entities

- **Design Token**: A named value (color, spacing, typography, shadow, animation timing) defined as a CSS custom property that governs the app's visual language. Tokens are organized by category (color palette, typography scale, spacing scale, elevation/shadow, animation durations/easings). Canonical color tokens are specified in FR-001.
- **Media Card**: The primary UI element representing a movie or TV show in grids. Contains a poster image (`Bebas Neue` title overlay), year, media type tag, watched status, and CSS hover micro-interaction state.
- **Layout Shell**: The top-level app container comprising the sidebar/navigation, main content area, and optional overlay regions. Adapts its structure based on viewport size. Receives full redesign treatment.
- **Page Transition**: An Angular Animations animated visual effect that plays during route navigation, providing continuity between views.
- **Skeleton Placeholder**: A loading-state UI element using CSS shimmer animation that mimics the expected layout dimensions until real content loads.
- **Spotlight Carousel**: A horizontal scrollable section at the top of the Collection page featuring recently added media items. P3 optional enhancement; animated via Angular Animations.
- **Typography Scale**: `Bebas Neue` for display/hero headings; `Inter` for body, labels, metadata, and controls. Both sourced from Google Fonts.

### Design Tokens — Canonical CSS Custom Properties

The following tokens MUST be declared on `:root` in the global `styles.scss`:

```scss
:root {
  /* Color — Background */
  --color-bg-base: #0a0a0f; /* App background */
  --color-bg-surface: #141420; /* Cards, panels */
  --color-bg-elevated: #1e1e2e; /* Modals, dropdowns, skeleton base */

  /* Color — Accent (Indigo) */
  --color-accent: #6366f1; /* Primary interactive accent */
  --color-accent-hover: #818cf8; /* Hover / focused accent */
  --color-accent-glow: rgba(99, 102, 241, 0.35); /* Card & focus glow */

  /* Color — Text */
  --color-text-primary: #f5f5f7; /* Body text, headings */
  --color-text-secondary: #a1a1aa; /* Metadata, captions */
  --color-text-accent: #a5b4fc; /* Links, accent labels */

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
  --anim-easing: cubic-bezier(0.4, 0, 0.2, 1); /* Material standard easing */
}

/* Reduced-motion override */
@media (prefers-reduced-motion: reduce) {
  :root {
    --anim-fast: 0ms;
    --anim-normal: 0ms;
    --anim-slow: 0ms;
  }
}
```

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users perceive the app as "modern and premium" — at least 80% positive feedback in user testing when asked about visual quality
- **SC-002**: The collection page Largest Contentful Paint (LCP) MUST be < 2.5s and Time to Interactive (TTI) MUST be < 3s on a mid-range mobile device over a 4G connection
- **SC-003**: All pages score 90+ on Lighthouse performance audits (desktop) and 75+ (mobile) after the redesign
- **SC-004**: Animations run at 60 frames per second on mid-range devices, with no visible jank during scrolling or page transitions; Angular Animations and CSS transitions MUST NOT trigger layout reflow (use `transform` and `opacity` only)
- **SC-005**: The app is fully usable on screens from 320px to 2560px wide without horizontal scrolling or layout breakage
- **SC-006**: All text and interactive elements in the dark theme meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text) against `#0A0A0F`
- **SC-007**: Users with `prefers-reduced-motion` enabled experience no motion — all Angular Animations durations resolve to `0ms` via CSS custom property override (see Design Tokens)
- **SC-008**: All interactive elements are reachable and operable via keyboard-only navigation; focus ring using `outline: 2px solid #6366F1` is always visible
- **SC-009**: Time to browse and locate a specific media item does not increase compared to the current design (no UX regression)
- **SC-010**: All user-facing text in the redesigned UI is available in both English and French

## Assumptions

- The existing PrimeNG component library will be retained but restyled/themed to match the new design; no wholesale replacement of the component library is planned
- The existing Angular project structure (standalone components, signals, OnPush change detection) will be preserved and built upon
- The TMDB image API will continue to serve poster and backdrop images in the required resolutions
- Auth0 authentication flow and existing route guards remain unchanged; auth/login pages are excluded from the redesign scope
- The existing backend API contracts remain unchanged; this is a front-end-only redesign
- The current Transloco i18n setup (EN/FR) will be extended with new translation keys for any new UI text
- The dark cinematic theme is the primary (and initially only) theme; a light theme toggle is out of scope for this feature
- The aerukart.com reference is used for design inspiration (smooth transitions, bold typography, cinematic atmosphere) — not for pixel-perfect replication
- Performance optimization techniques (lazy loading images, virtual scrolling for large collections, OnPush change detection) are already partially in place and will be extended
- The admin dashboard pages receive theme-only treatment (dark palette `#0A0A0F` + `Inter`/`Bebas Neue` typography) but are not a focus for advanced animations
- `Bebas Neue` and `Inter` are publicly available via Google Fonts and require no licensing; they will be self-hosted via `@font-face` to avoid external network dependency in production
- No third-party animation library (GSAP, Anime.js, Motion One, etc.) is to be introduced; Angular Animations + CSS is sufficient and keeps the bundle lean
- Mobile navigation pattern is a **bottom navigation bar** (fixed, horizontal icon layout with safe-area padding); hamburger/slide-in drawer is out of scope for this feature
- Target browser support: Chrome 111+, Firefox 115+, Safari 16.4+, Edge 111+. Browsers outside this range degrade gracefully — layout remains functional, animations are absent
