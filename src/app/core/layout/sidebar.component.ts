import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  readonly collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { labelKey: 'nav.collection', icon: 'pi pi-video', route: '/' },
    { labelKey: 'nav.search', icon: 'pi pi-search', route: '/tmdb-search' },
    { labelKey: 'nav.wishlist', icon: 'pi pi-heart', route: '/wishlist' },
    { labelKey: 'nav.profile', icon: 'pi pi-user', route: '/profile' },
  ];

  toggleCollapse(): void {
    this.collapsed.update((v) => !v);
  }
}
