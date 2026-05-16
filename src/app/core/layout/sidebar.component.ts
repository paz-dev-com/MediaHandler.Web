import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from '@core/auth/auth.service';
import { BREAKPOINTS } from '@shared/constants/breakpoints';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { ThemeToggleComponent } from '@shared/components/theme-toggle.component';
import { TranslocoModule } from '@jsverse/transloco';
import { TooltipModule } from 'primeng/tooltip';

export type NavigationMode = 'expanded' | 'collapsed' | 'mobile';

interface NavItem {
  labelKey: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslocoModule, TooltipModule, ThemeToggleComponent],
  animations: [
    // Desktop sidebar width transition: 220px ↔ 60px
    trigger('sidebarState', [
      state('expanded', style({ width: '220px' })),
      state('collapsed', style({ width: '60px' })),
      state('mobile', style({ width: '0', overflow: 'hidden' })),
      transition('expanded <=> collapsed', animate(ANIMATION_TIMINGS.NORMAL)),
      transition('* => mobile', animate(ANIMATION_TIMINGS.FAST)),
      transition('mobile => *', animate(ANIMATION_TIMINGS.FAST)),
    ]),
    // Mobile bottom-nav slide in/out from bottom
    trigger('bottomNavEnter', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate(ANIMATION_TIMINGS.NORMAL, style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate(ANIMATION_TIMINGS.FAST, style({ transform: 'translateY(100%)' })),
      ]),
    ]),
  ],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly bp = inject(BreakpointObserver);

  /** User's manual collapse preference (desktop/tablet only). */
  private readonly userCollapsed = signal(false);

  /** Breakpoint state as a signal via toSignal(). */
  private readonly bpState = toSignal(this.bp.observe([BREAKPOINTS.MOBILE, BREAKPOINTS.DESKTOP]), {
    initialValue: {
      matches: false,
      breakpoints: {
        [BREAKPOINTS.MOBILE]: false,
        [BREAKPOINTS.DESKTOP]: false,
      } as Record<string, boolean>,
    },
  });

  /** Whether we are currently on mobile (< 768px). */
  readonly isMobile = computed(() => this.bpState().breakpoints[BREAKPOINTS.MOBILE] ?? false);

  /** Whether we are currently on desktop (> 1024px). */
  readonly isDesktop = computed(() => this.bpState().breakpoints[BREAKPOINTS.DESKTOP] ?? false);

  /**
   * Active navigation mode:
   * - 'mobile'    → < 768px  → bottom nav bar, no sidebar
   * - 'collapsed' → 768–1024px  OR user toggled on desktop
   * - 'expanded'  → > 1024px and user has not collapsed
   */
  readonly mode = computed<NavigationMode>(() => {
    if (this.isMobile()) return 'mobile';
    if (this.isDesktop() && !this.userCollapsed()) return 'expanded';
    return 'collapsed';
  });

  private readonly baseNavItems: NavItem[] = [
    { labelKey: 'nav.collection', icon: 'pi pi-video', route: '/' },
    { labelKey: 'nav.search', icon: 'pi pi-search', route: '/tmdb-search' },
    { labelKey: 'nav.wishlist', icon: 'pi pi-heart', route: '/wishlist' },
    { labelKey: 'nav.profile', icon: 'pi pi-user', route: '/profile' },
  ];

  readonly navItems = computed<NavItem[]>(() => {
    if (this.auth.isAdmin()) {
      return [...this.baseNavItems, { labelKey: 'nav.admin', icon: 'pi pi-cog', route: '/admin' }];
    }
    return this.baseNavItems;
  });

  toggleCollapse(): void {
    this.userCollapsed.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
  }
}
