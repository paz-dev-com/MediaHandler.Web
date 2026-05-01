import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
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
