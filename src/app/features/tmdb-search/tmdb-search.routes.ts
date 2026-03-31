import { Routes } from '@angular/router';

export const tmdbSearchRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tmdb-search-page.component').then((m) => m.TmdbSearchPageComponent),
  },
];
