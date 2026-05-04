import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

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
  imports: [RouterLink, RouterLinkActive, TranslocoModule, ButtonModule, TooltipModule],
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  readonly collapsed = signal(false);

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
    this.collapsed.update((v) => !v);
  }
}
