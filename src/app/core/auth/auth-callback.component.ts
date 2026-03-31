import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { filter, take, withLatestFrom } from 'rxjs';
import { AuthService as AppAuthService } from './auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    @if (callbackError()) {
      <div
        class="flex flex-column align-items-center justify-content-center"
        style="height:100vh; gap:1rem"
      >
        <p class="text-red-500">Sign-in failed: {{ callbackError() }}</p>
        <p class="text-sm text-color-secondary">
          Check the browser console and Auth0 Dashboard logs for details.
        </p>
        <button (click)="retry()">Try again</button>
      </div>
    } @else {
      <div class="flex align-items-center justify-content-center" style="height:100vh">
        <p>Completing sign-in...</p>
      </div>
    }
  `,
})
export class AuthCallbackComponent implements OnInit {
  private readonly auth0 = inject(AuthService);
  private readonly appAuth = inject(AppAuthService);
  private readonly router = inject(Router);

  protected readonly callbackError = signal<string | null>(null);

  ngOnInit(): void {
    // Check for an OAuth error in the callback URL (e.g. invalid audience, mismatched redirect_uri)
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    if (oauthError) {
      const desc = params.get('error_description') ?? oauthError;
      console.error('[Auth] OAuth callback error:', desc);
      this.callbackError.set(desc);
      return;
    }

    // Wait for the SDK to finish the code exchange, then check the result.
    this.auth0.isLoading$
      .pipe(
        filter((loading) => !loading),
        take(1),
        withLatestFrom(this.auth0.isAuthenticated$),
      )
      .subscribe(([, isAuthenticated]) => {
        if (isAuthenticated) {
          // Sync user with the backend once (creates user in DB if new).
          // Fire-and-forget: does not block navigation.
          this.appAuth.syncUser();
          this.router.navigate(['/']);
        } else {
          // Exchange failed — stay on this page to break the redirect loop.
          const msg = 'Authentication could not be completed. See console for details.';
          console.error('[Auth] Token exchange failed — isAuthenticated is false after loading.');
          this.callbackError.set(msg);
        }
      });
  }

  retry(): void {
    this.callbackError.set(null);
    this.auth0.loginWithRedirect();
  }
}
