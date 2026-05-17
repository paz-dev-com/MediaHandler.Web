import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { combineLatest, filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth0 = inject(Auth0Service);

  // Wait for the SDK to finish loading before evaluating auth state.
  // Without this, the first emission of isAuthenticated$ is always false
  // (during the token exchange), which would trigger an unwanted redirect.
  return combineLatest([auth0.isAuthenticated$, auth0.isLoading$]).pipe(
    filter(([, loading]) => !loading),
    take(1),
    map(([isAuthenticated]) => {
      if (!isAuthenticated) {
        auth0.loginWithRedirect();
        return false;
      }
      return true;
    }),
  );
};
