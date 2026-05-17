import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject } from 'rxjs';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { BREAKPOINTS } from '@shared/constants/breakpoints';
import { AuthService } from '@core/auth/auth.service';
import { ProfileService } from '@features/profile/profile.service';
import { ThemeService } from '@shared/services/theme.service';
import { SidebarComponent } from './sidebar.component';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeBpState(mobile: boolean, desktop: boolean): BreakpointState {
  return {
    matches: mobile || desktop,
    breakpoints: {
      [BREAKPOINTS.MOBILE]: mobile,
      [BREAKPOINTS.DESKTOP]: desktop,
    },
  };
}

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let bpSubject: BehaviorSubject<BreakpointState>;
  // Use a writable signal so computed(navItems) reacts to changes
  let isAdminSignal: ReturnType<typeof signal<boolean>>;
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    bpSubject = new BehaviorSubject<BreakpointState>(makeBpState(false, false));
    isAdminSignal = signal(false);
    isAuthenticatedSignal = signal(false);

    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        {
          provide: BreakpointObserver,
          useValue: { observe: vi.fn().mockReturnValue(bpSubject.asObservable()) },
        },
        {
          provide: AuthService,
          useValue: {
            isAdmin: isAdminSignal.asReadonly(),
            isAuthenticated: isAuthenticatedSignal.asReadonly(),
            user: signal(null).asReadonly(),
            auth0Picture: signal(null).asReadonly(),
            logout: vi.fn(),
          },
        },
        {
          provide: ThemeService,
          useValue: {
            resolvedTheme: signal<'dark' | 'light'>('dark').asReadonly(),
            theme: signal<'dark' | 'light' | 'system'>('dark').asReadonly(),
            toggle: vi.fn(),
            setTheme: vi.fn(),
          },
        },
        {
          provide: ProfileService,
          useValue: {
            user: signal(null).asReadonly(),
            resolveProfilePictureUrl: (path: string | null | undefined) => path ?? null,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── NavigationMode signal ──────────────────────────────────────────────────

  describe('mode (NavigationMode)', () => {
    it('is "collapsed" with no breakpoints matched (initial tablet-sized)', () => {
      // Mobile=false, Desktop=false → collapsed (tablet range)
      expect(component.mode()).toBe('collapsed');
    });

    it('is "expanded" when desktop breakpoint matches', () => {
      bpSubject.next(makeBpState(false, true));
      fixture.detectChanges();
      expect(component.mode()).toBe('expanded');
    });

    it('is "mobile" when mobile breakpoint matches', () => {
      bpSubject.next(makeBpState(true, false));
      fixture.detectChanges();
      expect(component.mode()).toBe('mobile');
    });

    it('reverts to "collapsed" when user toggles collapse on desktop', () => {
      // Start in expanded (desktop) mode
      bpSubject.next(makeBpState(false, true));
      fixture.detectChanges();
      expect(component.mode()).toBe('expanded');

      // User collapses the sidebar
      component.toggleCollapse();
      fixture.detectChanges();
      expect(component.mode()).toBe('collapsed');
    });

    it('toggles back to "expanded" after a second toggle on desktop', () => {
      bpSubject.next(makeBpState(false, true));
      fixture.detectChanges();

      component.toggleCollapse();
      component.toggleCollapse();
      fixture.detectChanges();

      expect(component.mode()).toBe('expanded');
    });
  });

  // ── Template rendering ─────────────────────────────────────────────────────

  describe('template', () => {
    it('renders the desktop sidebar when mode is not "mobile"', () => {
      bpSubject.next(makeBpState(false, true));
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      expect(sidebar).toBeTruthy();
    });

    it('renders the mobile bottom-nav when mode is "mobile"', () => {
      bpSubject.next(makeBpState(true, false));
      fixture.detectChanges();

      const bottomNav = fixture.nativeElement.querySelector('.bottom-nav');
      expect(bottomNav).toBeTruthy();
    });

    it('does not render the sidebar when mode is "mobile"', () => {
      bpSubject.next(makeBpState(true, false));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.sidebar')).toBeNull();
    });
  });

  // ── Navigation items ───────────────────────────────────────────────────────

  describe('navItems', () => {
    it('returns base nav items (4) when user is not admin', () => {
      isAdminSignal.set(false);
      fixture.detectChanges();
      expect(component.navItems().length).toBe(4);
    });

    it('includes the admin nav item when user is admin', () => {
      isAdminSignal.set(true);
      fixture.detectChanges();
      const items = component.navItems();
      expect(items.length).toBe(5);
      expect(items.some((i) => i.route === '/admin')).toBe(true);
    });
  });
});
