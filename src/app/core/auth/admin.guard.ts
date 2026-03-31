import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Guards routes that require Admin role.
 *
 * Reads the role directly from the Auth0 JWT claim (https://mediahandler.com/roles)
 * via AuthService.isAdmin — no backend sync call needed, preventing any login loop.
 *
 * Must be used after authGuard (which already waits for Auth0 to finish loading).
 */
export const adminGuard: CanActivateFn = () => {
  const auth0 = inject(Auth0Service);
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for Auth0 to finish loading so the user$ claims are populated.
  return auth0.isLoading$.pipe(
    filter((loading) => !loading),
    take(1),
    map(() => (auth.isAdmin() ? true : router.createUrlTree(['/']))),
  );
};
