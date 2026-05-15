import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'app-theme';
const OS_DARK_QUERY = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly destroyRef = inject(DestroyRef);

  /** User's explicit preference ('system' follows the OS). */
  readonly theme = signal<Theme>(this.readStoredTheme());

  /** Live OS dark-mode flag, updated on MediaQueryList change events. */
  private readonly osDark = signal<boolean>(window.matchMedia(OS_DARK_QUERY).matches);

  /**
   * Resolved theme — 'dark' or 'light'.
   * When `theme` is 'system', follows the OS preference.
   */
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const t = this.theme();
    if (t === 'dark') return 'dark';
    if (t === 'light') return 'light';
    return this.osDark() ? 'dark' : 'light';
  });

  constructor() {
    // Apply data-theme attribute and persist to localStorage on every change.
    // Runs synchronously on first effect execution to avoid FOWT.
    effect(() => {
      document.documentElement.setAttribute('data-theme', this.resolvedTheme());
      localStorage.setItem(STORAGE_KEY, this.theme());
    });

    // Track OS preference changes live.
    const mql = window.matchMedia(OS_DARK_QUERY);
    const handler = (e: MediaQueryListEvent) => this.osDark.set(e.matches);
    mql.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => mql.removeEventListener('change', handler));
  }

  /**
   * Toggle between 'dark' and 'light'.
   * If current resolvedTheme is 'dark', switches to 'light' and vice versa.
   * Clears 'system' preference (explicit choice takes precedence).
   */
  toggle(): void {
    this.setTheme(this.resolvedTheme() === 'dark' ? 'light' : 'dark');
  }

  /** Explicitly set the theme preference. */
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private readStoredTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    return 'system';
  }
}
