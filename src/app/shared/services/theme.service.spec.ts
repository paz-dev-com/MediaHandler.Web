import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null as string | null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// ── matchMedia mock ───────────────────────────────────────────────────────────

type MqlChangeHandler = (e: MediaQueryListEvent) => void;

function makeMql(matches: boolean) {
  const handlers: MqlChangeHandler[] = [];
  return {
    matches,
    addEventListener: vi.fn((_event: string, handler: MqlChangeHandler) => {
      handlers.push(handler);
    }),
    removeEventListener: vi.fn(),
    _triggerChange: (newMatches: boolean) => {
      handlers.forEach((h) => h({ matches: newMatches } as MediaQueryListEvent));
    },
  };
}

describe('ThemeService', () => {
  let service: ThemeService;
  let mql: ReturnType<typeof makeMql>;

  function setup(storedTheme: Theme | null = null, osDark = true) {
    localStorageMock.getItem.mockReturnValue(storedTheme as string | null);
    mql = makeMql(osDark);

    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql));

    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);

    // Flush initial effect
    TestBed.flushEffects();
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // ── resolvedTheme ─────────────────────────────────────────────────────────

  describe('resolvedTheme', () => {
    it('returns "dark" when theme is explicitly "dark"', () => {
      setup('dark', false);
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('returns "light" when theme is explicitly "light"', () => {
      setup('light', true);
      expect(service.resolvedTheme()).toBe('light');
    });

    it('follows OS preference (dark) when theme is "system"', () => {
      setup('system', true);
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('follows OS preference (light) when theme is "system" and OS is light', () => {
      setup('system', false);
      expect(service.resolvedTheme()).toBe('light');
    });

    it('defaults to "system" when localStorage has no stored theme', () => {
      setup(null, true); // OS dark
      expect(service.theme()).toBe('system');
      expect(service.resolvedTheme()).toBe('dark');
    });
  });

  // ── data-theme attribute ──────────────────────────────────────────────────

  describe('data-theme attribute on document.documentElement', () => {
    it('sets data-theme="dark" when resolvedTheme is dark', () => {
      setup('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('sets data-theme="light" when resolvedTheme is light', () => {
      setup('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('updates data-theme when setTheme changes the resolved theme', () => {
      setup('dark');
      service.setTheme('light');
      TestBed.flushEffects();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  // ── localStorage persistence ───────────────────────────────────────────────

  describe('localStorage', () => {
    it('reads the stored theme from localStorage key "app-theme" on init', () => {
      setup('light');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('app-theme');
    });

    it('writes to localStorage when setTheme is called', () => {
      setup('dark');
      service.setTheme('light');
      TestBed.flushEffects();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'light');
    });

    it('stores "system" when no previously stored value exists', () => {
      setup(null, false);
      TestBed.flushEffects();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('app-theme', 'system');
    });
  });

  // ── toggle() ──────────────────────────────────────────────────────────────

  describe('toggle()', () => {
    it('switches from "dark" to "light"', () => {
      setup('dark');
      service.toggle();
      expect(service.theme()).toBe('light');
    });

    it('switches from "light" to "dark"', () => {
      setup('light');
      service.toggle();
      expect(service.theme()).toBe('dark');
    });

    it('resolves from "system" (dark OS) and switches to "light"', () => {
      setup('system', true); // system → dark
      service.toggle();
      expect(service.theme()).toBe('light');
    });
  });

  // ── setTheme() ────────────────────────────────────────────────────────────

  describe('setTheme()', () => {
    it('updates the theme signal', () => {
      setup('dark');
      service.setTheme('system');
      expect(service.theme()).toBe('system');
    });
  });

  // ── OS preference live update ──────────────────────────────────────────────

  describe('OS preference change (matchMedia change event)', () => {
    it('updates resolvedTheme when OS switches to dark while theme is "system"', () => {
      setup('system', false); // starts light
      expect(service.resolvedTheme()).toBe('light');

      mql._triggerChange(true);
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('does not change resolvedTheme when theme is explicit "dark"', () => {
      setup('dark', false);
      mql._triggerChange(true); // OS changes, but user locked to 'dark'
      expect(service.resolvedTheme()).toBe('dark');
    });
  });
});
