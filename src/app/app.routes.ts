import { Routes } from '@angular/router';
import { adminGuard } from '@core/auth/admin.guard';
import { AuthCallbackComponent } from '@core/auth/auth-callback.component';
import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
    data: { animation: 'AuthCallbackPage' },
  },
  {
    path: '',
    canActivate: [authGuard],
    data: { animation: 'CollectionPage' },
    loadChildren: () =>
      import('./features/collection/collection.routes').then((m) => m.collectionRoutes),
  },
  {
    path: 'media/:id',
    canActivate: [authGuard],
    data: { animation: 'DetailPage' },
    loadChildren: () =>
      import('./features/media-detail/media-detail.routes').then((m) => m.mediaDetailRoutes),
  },
  {
    path: 'tmdb-search',
    canActivate: [authGuard],
    data: { animation: 'SearchPage' },
    loadChildren: () =>
      import('./features/tmdb-search/tmdb-search.routes').then((m) => m.tmdbSearchRoutes),
  },
  {
    path: 'wishlist',
    canActivate: [authGuard],
    data: { animation: 'WishlistPage' },
    loadChildren: () => import('./features/wishlist/wishlist.routes').then((m) => m.wishlistRoutes),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    data: { animation: 'ProfilePage' },
    loadChildren: () => import('./features/profile/profile.routes').then((m) => m.profileRoutes),
  },
  {
    path: 'nas-scanner',
    redirectTo: '/admin/scanner',
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    data: { animation: 'AdminPage' },
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
