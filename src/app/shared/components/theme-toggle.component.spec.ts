import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeService, ResolvedTheme } from '@shared/services/theme.service';
import { ThemeToggleComponent } from './theme-toggle.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

// ── ThemeService mock ─────────────────────────────────────────────────────────

function makeThemeServiceMock(resolved: ResolvedTheme = 'dark') {
  const resolvedSignal = signal<ResolvedTheme>(resolved);
  return {
    resolvedTheme: resolvedSignal.asReadonly(),
    toggle: vi.fn(),
    setTheme: vi.fn(),
    theme: signal<'dark' | 'light' | 'system'>('dark').asReadonly(),
    _resolvedSignal: resolvedSignal, // expose for test mutation
  };
}

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let component: ThemeToggleComponent;
  let mockThemeService: ReturnType<typeof makeThemeServiceMock>;

  beforeEach(async () => {
    mockThemeService = makeThemeServiceMock('dark');

    await TestBed.configureTestingModule({
      imports: [
        ThemeToggleComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Icon rendering ────────────────────────────────────────────────────────

  describe('icon rendering', () => {
    it('shows the sun icon (pi-sun) when resolvedTheme is "dark"', () => {
      // Dark theme → show sun to invite switching to light
      const sunIcon = fixture.nativeElement.querySelector('.pi-sun');
      const moonIcon = fixture.nativeElement.querySelector('.pi-moon');
      expect(sunIcon).toBeTruthy();
      expect(moonIcon).toBeNull();
    });

    it('shows the moon icon (pi-moon) when resolvedTheme is "light"', async () => {
      // Simulate switching to light theme
      mockThemeService._resolvedSignal.set('light');
      fixture.detectChanges();

      const moonIcon = fixture.nativeElement.querySelector('.pi-moon');
      const sunIcon = fixture.nativeElement.querySelector('.pi-sun');
      expect(moonIcon).toBeTruthy();
      expect(sunIcon).toBeNull();
    });
  });

  // ── Toggle behaviour ──────────────────────────────────────────────────────

  describe('toggle()', () => {
    it('calls themeService.toggle() when the button is clicked', () => {
      const button = fixture.nativeElement.querySelector('.theme-toggle');
      button.click();
      expect(mockThemeService.toggle).toHaveBeenCalledOnce();
    });

    it('calls themeService.toggle() when toggle() method is called directly', () => {
      component.toggle();
      expect(mockThemeService.toggle).toHaveBeenCalledOnce();
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('renders a <button> element', () => {
      const button = fixture.nativeElement.querySelector('button.theme-toggle');
      expect(button).toBeTruthy();
    });

    it('button has an aria-label attribute', () => {
      const button = fixture.nativeElement.querySelector('button[aria-label]');
      expect(button).toBeTruthy();
    });
  });
});
