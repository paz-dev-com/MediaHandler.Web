import { Routes } from '@angular/router';

export const wishlistRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./wishlist-page.component').then(m => m.WishlistPageComponent),
  },
];
