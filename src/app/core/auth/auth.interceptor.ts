import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getAccessToken()).pipe(
    switchMap((token) => {
      if (token) {
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }
      return next(req);
    }),
  );
};
