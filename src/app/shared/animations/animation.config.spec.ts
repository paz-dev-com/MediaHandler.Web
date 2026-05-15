import { ANIMATION_TIMINGS } from './animation.config';

describe('ANIMATION_TIMINGS', () => {
  it('exports FAST with 150ms cubic-bezier easing', () => {
    expect(ANIMATION_TIMINGS.FAST).toContain('150ms');
    expect(ANIMATION_TIMINGS.FAST).toContain('cubic-bezier');
  });

  it('exports NORMAL with 300ms cubic-bezier easing', () => {
    expect(ANIMATION_TIMINGS.NORMAL).toContain('300ms');
    expect(ANIMATION_TIMINGS.NORMAL).toContain('cubic-bezier');
  });

  it('exports SLOW with 500ms cubic-bezier easing', () => {
    expect(ANIMATION_TIMINGS.SLOW).toContain('500ms');
    expect(ANIMATION_TIMINGS.SLOW).toContain('cubic-bezier');
  });

  it('exports STAGGER_DELAY as numeric 50', () => {
    expect(ANIMATION_TIMINGS.STAGGER_DELAY).toBe(50);
  });

  it('is a const object (read-only)', () => {
    // All values should be strings except STAGGER_DELAY
    expect(typeof ANIMATION_TIMINGS.FAST).toBe('string');
    expect(typeof ANIMATION_TIMINGS.NORMAL).toBe('string');
    expect(typeof ANIMATION_TIMINGS.SLOW).toBe('string');
    expect(typeof ANIMATION_TIMINGS.STAGGER_DELAY).toBe('number');
  });
});
