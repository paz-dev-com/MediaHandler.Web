import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { filter } from 'rxjs/operators';

interface AdminTab {
  labelKey: string;
  route: string;
  value: string;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TranslocoModule, Tabs, TabList, Tab],
})
export class AdminLayoutComponent implements OnInit {
  private readonly router = inject(Router);

  readonly tabs: AdminTab[] = [
    { labelKey: 'admin.nav.dashboard', route: '/admin/dashboard', value: 'dashboard' },
    { labelKey: 'admin.nav.users', route: '/admin/users', value: 'users' },
    { labelKey: 'admin.nav.libraryRoots', route: '/admin/library-roots', value: 'library-roots' },
    { labelKey: 'admin.nav.scanner', route: '/admin/scanner', value: 'scanner' },
    { labelKey: 'admin.nav.review', route: '/admin/review', value: 'review' },
    { labelKey: 'admin.nav.scanResults', route: '/admin/scan-results', value: 'scan-results' },
  ];

  readonly activeTab = signal<string>('dashboard');

  readonly activeTabValue = computed(() => this.activeTab());

  ngOnInit(): void {
    this.updateActiveTabFromUrl(this.router.url);

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateActiveTabFromUrl((event as NavigationEnd).urlAfterRedirects);
      });
  }

  navigateTo(value: string | number | undefined | null): void {
    if (value == null) return;
    const tab = this.tabs.find((t) => t.value === String(value));
    if (tab) {
      this.router.navigate([tab.route]);
    }
  }

  private updateActiveTabFromUrl(url: string): void {
    const segment = url.split('/').filter(Boolean).at(1) ?? 'dashboard';
    const match = this.tabs.find((t) => t.value === segment);
    this.activeTab.set(match?.value ?? 'dashboard');
  }
}
