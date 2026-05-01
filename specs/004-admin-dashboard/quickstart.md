# Quickstart: Administration Dashboard

**Feature**: 004-admin-dashboard  
**Branch**: `feature/spec004-admin-dashboard`

## Prerequisites

- Backend API running with admin endpoints available
- An Auth0 user with `Admin` role configured
- Node.js and npm installed

## Dev Setup

```bash
cd /home/tpfeifer/Repos/MediaHandler/MediaHandler.Web
npm install
npm start
```

Navigate to `http://localhost:4200` and log in with an Admin account.

## Key Files to Create

### 1. Admin feature module structure

```
src/app/features/admin/
├── admin.routes.ts                      # Parent + child routes
├── admin-layout.component.ts            # Shared layout with TabMenu sub-nav
├── admin-layout.component.html
├── admin-layout.component.scss
├── dashboard/
│   ├── admin-dashboard-page.component.ts    # Landing page with health panel
│   ├── admin-dashboard-page.component.html
│   ├── admin-dashboard-page.component.scss
│   └── health-panel.component.ts            # API health status card
├── users/
│   ├── admin-users-page.component.ts        # User management orchestrator
│   ├── admin-users-page.component.html
│   ├── admin-users-page.component.scss
│   ├── admin-user.service.ts                # API calls + signal state
│   └── admin-user.service.spec.ts
├── library-roots/
│   ├── admin-library-roots-page.component.ts
│   ├── admin-library-roots-page.component.html
│   ├── admin-library-roots-page.component.scss
│   ├── add-library-root-dialog.component.ts # PrimeNG Dialog for add form
│   ├── admin-library-root.service.ts
│   └── admin-library-root.service.spec.ts
├── scanner/
│   ├── admin-scanner-page.component.ts      # Scanner orchestrator
│   ├── admin-scanner-page.component.html
│   ├── admin-scanner-page.component.scss
│   ├── scan-launcher.component.ts           # Start scan controls
│   ├── scan-status.component.ts             # Live status display
│   ├── scan-history-table.component.ts      # Recent runs p-table
│   ├── admin-scan.service.ts                # API calls + polling
│   └── admin-scan.service.spec.ts
└── review/
    ├── admin-review-page.component.ts       # Review queue orchestrator
    ├── admin-review-page.component.html
    ├── admin-review-page.component.scss
    ├── review-resolve-dialog.component.ts   # TMDB candidate selection
    ├── admin-review.service.ts
    └── admin-review.service.spec.ts
```

### 2. Shared model files (new)

```
src/app/shared/models/
├── library-root.model.ts
├── admin-scan.model.ts
├── review.model.ts
└── health.model.ts
```

### 3. Files to modify

| File                                       | Change                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/app/shared/models/enums.ts`           | Add `LibraryRootKind`, `ScanMode`, `ScanStatus`, `ReviewStatus`, `ReviewReason`, `ReviewResolutionAction` |
| `src/app/app.routes.ts`                    | Add `/admin` route with `authGuard` + `adminGuard`, lazy-load admin routes                                |
| `src/app/core/layout/sidebar.component.ts` | Add "Administration" nav item for admin users                                                             |
| `src/assets/i18n/en.json`                  | Add `admin.*` and `nav.admin` translation keys                                                            |
| `src/assets/i18n/fr.json`                  | Add French translations for `admin.*` and `nav.admin`                                                     |

## Key Patterns

### Routing (admin.routes.ts)

```typescript
export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/admin-users-page.component').then((m) => m.AdminUsersPageComponent),
      },
      {
        path: 'library-roots',
        loadComponent: () =>
          import('./library-roots/admin-library-roots-page.component').then(
            (m) => m.AdminLibraryRootsPageComponent,
          ),
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('./scanner/admin-scanner-page.component').then((m) => m.AdminScannerPageComponent),
      },
      {
        path: 'review',
        loadComponent: () =>
          import('./review/admin-review-page.component').then((m) => m.AdminReviewPageComponent),
      },
    ],
  },
];
```

### Service pattern (admin-user.service.ts)

```typescript
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly users = signal<User[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);

  loadUsers(page = 1, pageSize = 20, search?: string): void {
    this.loading.set(true);
    this.api
      .get<User[]>('admin/users', { page, pageSize, search })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.meta.set(res.meta);
        },
      });
  }
}
```

### Polling pattern (admin-scan.service.ts)

```typescript
// Start polling — call when scan is started or page loads with active scan
private startPolling(): void {
  interval(4000).pipe(
    takeUntilDestroyed(this.destroyRef),
    switchMap(() => this.api.get<ScanRunSummary>('admin/scan/active')),
    takeWhile((res) => {
      const status = res.data?.status;
      return status === 'Pending' || status === 'Running';
    }, true),
  ).subscribe({ next: (res) => this.activeScan.set(res.data) });
}
```

## PrimeNG Components Used

| Component         | Import                    | Usage                                                           |
| ----------------- | ------------------------- | --------------------------------------------------------------- |
| `Table`           | `primeng/table`           | User list, library roots list, scan history, review items       |
| `Button`          | `primeng/button`          | All action buttons with severity/loading                        |
| `Tag`             | `primeng/tag`             | Status badges (Active/Inactive, Healthy/Unhealthy, scan status) |
| `Dialog`          | `primeng/dialog`          | Add library root, resolve review item                           |
| `ConfirmDialog`   | `primeng/confirmdialog`   | Remove library root confirmation                                |
| `Select`          | `primeng/select`          | Kind filter, scan mode, role selection                          |
| `MultiSelect`     | `primeng/multiselect`     | Scan root selector                                              |
| `InputText`       | `primeng/inputtext`       | Search field, path input                                        |
| `ToggleSwitch`    | `primeng/toggleswitch`    | Enable/disable library root                                     |
| `ProgressSpinner` | `primeng/progressspinner` | Loading states                                                  |
| `TabMenu`         | `primeng/tabmenu`         | Admin sub-section navigation                                    |
| `Toast`           | `primeng/toast`           | Success/error notifications (already global)                    |
| `Tooltip`         | `primeng/tooltip`         | Contextual help                                                 |
| `Badge`           | `primeng/badge`           | Count indicators                                                |
| `Toolbar`         | `primeng/toolbar`         | Page action bars                                                |

## Testing

```bash
npm test                    # Run all tests
npm test -- --reporter=verbose  # Verbose output
```

Tests use Vitest with jsdom. Follow existing patterns in `*.spec.ts` files.
