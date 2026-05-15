# UI Design Token Contract

**Feature**: 005-ux-redesign  
**Type**: CSS Custom Properties API

This contract defines the public design token interface that all components in the application MUST consume. Hard-coded color, typography, or animation values in component styles are forbidden per the constitution (III. Consistent Styling).

## Color Tokens

| Token                     | Value                       | Usage                                                 |
| ------------------------- | --------------------------- | ----------------------------------------------------- |
| `--color-bg-base`         | `#0A0A0F`                   | App background, page background                       |
| `--color-bg-surface`      | `#141420`                   | Cards, panels, sidebar                                |
| `--color-bg-elevated`     | `#1E1E2E`                   | Modals, dropdowns, skeleton base, poster placeholders |
| `--color-accent`          | `#6366F1`                   | Primary interactive accent, focus rings, active nav   |
| `--color-accent-hover`    | `#818CF8`                   | Hover/focused accent                                  |
| `--color-accent-glow`     | `rgba(99, 102, 241, 0.35)`  | Card hover box-shadow, focus glow                     |
| `--color-text-primary`    | `#F5F5F7`                   | Body text, headings                                   |
| `--color-text-secondary`  | `#A1A1AA`                   | Metadata, captions, secondary labels                  |
| `--color-text-accent`     | `#A5B4FC`                   | Links, accent labels                                  |
| `--color-border`          | `rgba(255, 255, 255, 0.08)` | Card borders, dividers                                |
| `--color-poster-gradient` | `linear-gradient(...)`      | Poster overlay gradient on cards and hero             |

## Typography Tokens

| Token            | Value                                 | Usage                                            |
| ---------------- | ------------------------------------- | ------------------------------------------------ |
| `--font-display` | `'Bebas Neue', system-ui, sans-serif` | Hero titles, card overlay headings, display text |
| `--font-body`    | `'Inter', system-ui, sans-serif`      | Body text, metadata, labels, UI controls         |

## Animation Tokens

| Token           | Value                          | Reduced Motion Value | Usage                                 |
| --------------- | ------------------------------ | -------------------- | ------------------------------------- |
| `--anim-fast`   | `150ms`                        | `0ms`                | Micro-interactions (hover, focus)     |
| `--anim-normal` | `300ms`                        | `0ms`                | Card entrances, accordion, route fade |
| `--anim-slow`   | `500ms`                        | `0ms`                | Hero parallax, spotlight carousel     |
| `--anim-easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | unchanged            | Standard Material easing curve        |

## PrimeNG Theme Token Overrides

Applied via `providePrimeNG()` in `app.config.ts`:

```typescript
providePrimeNG({
  theme: {
    preset: Aura,
    options: { darkModeSelector: false },
  },
  // Override primitive and semantic tokens:
  // primitive.colors → map to cinematic palette
  // semantic.colorScheme.light.surface → #141420 etc.
  // semantic.colorScheme.light.primary → #6366F1
  // semantic.colorScheme.light.text → #F5F5F7
});
```

## Breakpoint Contract

| Name    | Query            | Grid Columns (FR-019) |
| ------- | ---------------- | --------------------- |
| Mobile  | `< 768px`        | 1 column              |
| Tablet  | `768px – 1024px` | 2–3 columns           |
| Desktop | `> 1024px`       | 4–6 columns           |

## Component Animation Contract

### Route Transitions (Angular Animations)

- **Trigger**: `@routeAnimation` on `<router-outlet>`
- **Pattern**: Cross-fade (opacity 1→0 outgoing, 0→1 incoming, 150ms each)
- **Data source**: `route.data['animation']` string identifier per route

### Card Entrance (Angular Animations)

- **Trigger**: `@cardEnter` on each media card host element
- **Pattern**: `void → *`: `opacity: 0, translateY(24px)` → `opacity: 1, translateY(0)` over 300ms
- **Stagger**: 50ms delay between cards via `query(':enter', stagger(50, ...))` in parent
- **Viewport gating**: `InViewportDirective` sets `inViewport` signal; animation triggers only when true

### Sidebar (Angular Animations)

- **Trigger**: `@sidebarState` bound to navigation mode
- **Pattern**: Width transition `220px ↔ 60px` over 200ms; mobile: slide from bottom

### Accordion (Angular Animations)

- **Trigger**: `@accordionExpand` on season content
- **Pattern**: Height `0 → *` with opacity fade, 300ms

### Toast (PrimeNG + Angular Animations)

- **Pattern**: Slide-in from right + fade, auto-dismiss with fade-out
- **Styling**: Dark surface token background, accent border-left

## Accessibility Contract

| Requirement              | Implementation                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Focus visibility         | `outline: 2px solid var(--color-accent)` on `:focus-visible` for all interactive elements                     |
| Reduced motion           | `@media (prefers-reduced-motion: reduce)` sets all `--anim-*` to `0ms`; Angular Animations check `@.disabled` |
| Contrast AA (text)       | Primary `#F5F5F7` on `#0A0A0F` = 18.2:1 ✓                                                                     |
| Contrast AA (secondary)  | `#A1A1AA` on `#0A0A0F` = 7.1:1 ✓                                                                              |
| Contrast (UI components) | `#6366F1` on `#0A0A0F` = 4.6:1 ✓ (≥ 3:1 threshold)                                                            |
| Keyboard navigation      | All nav items, cards, buttons, accordions focusable and operable via keyboard                                 |
| Image alt text           | All `<img>` tags MUST have `alt` attribute with media title                                                   |
