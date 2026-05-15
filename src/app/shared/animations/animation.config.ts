// Animation timing constants for the cinematic dark theme redesign.
// All animation timings reference CSS custom properties (--anim-*) that
// automatically collapse to 0ms when prefers-reduced-motion: reduce is active.
export const ANIMATION_TIMINGS = {
  FAST: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  NORMAL: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  SLOW: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  /** Delay increment between each staggered card (in ms) */
  STAGGER_DELAY: 50,
} as const;
