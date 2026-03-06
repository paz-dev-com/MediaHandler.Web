import { Routes } from '@angular/router';

export const collectionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./collection-page.component').then((m) => m.CollectionPageComponent),
  },
];
