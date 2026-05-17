import { Routes } from '@angular/router';

export const mediaDetailRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./media-detail-page.component').then((m) => m.MediaDetailPageComponent),
  },
];
