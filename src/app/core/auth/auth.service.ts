import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '@core/api/api.service';
import { User } from '@shared/models/user.model';
import { filter, firstValueFrom, take } from 'rxjs';

/** Custom Auth0 claim namespace for roles — must match the API's RoleClaimType. */
const ROLES_CLAIM = 'https://mediahandler.com/roles';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth0 = inject(Auth0Service);
  private readonly api = inject(ApiService);

  private readonly _user = signal<User | null>(null);
  private readonly _auth0User = toSignal(this.auth0.user$, { initialValue: null });

  /** Prevents syncUser() from firing more than once per session. */
  private _synced = false;
  /** Prevents loadProfile() from firing more than once per session. */
  private _profileLoaded = false;

  readonly isAuthenticated = toSignal(this.auth0.isAuthenticated$, { initialValue: false });
  readonly user = computed(() => this._user());

  /** True when the Auth0 JWT contains the 'Admin' role in the namespaced claim. */
  readonly isAdmin = computed(() => {
    // First check the backend user profile (most reliable — role comes from DB)
    const backendUser = this._user();
    if (backendUser) {
      return backendUser.role === 'Admin';
    }
    // Fallback: check the Auth0 JWT custom claim (works when audience is configured)
    const roles = this._auth0User()?.[ROLES_CLAIM] as string[] | undefined;
    return roles?.includes('Admin') ?? false;
  });

  constructor() {
    // On page refresh (returning session), load the stored profile from the DB —
    // this preserves the role that was set at first login.
    // For fresh logins, AuthCallbackComponent calls syncUser() explicitly after the
    // code exchange completes; loadProfile() will call syncUser() as a fallback only
    // when the user is not yet in the DB (404).
    this.auth0.isAuthenticated$.pipe(filter(Boolean), take(1)).subscribe(() => this.loadProfile());
  }

  login(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this._user.set(null);
    this._synced = false;
    this._profileLoaded = false;
    this.auth0.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  async getAccessToken(): Promise<string | undefined> {
    try {
      return await firstValueFrom(this.auth0.getAccessTokenSilently());
    } catch {
      return undefined;
    }
  }

  /**
   * POST auth/sync — creates the user in the DB if new, updates email/name.
   *
   * Called either:
   *  - explicitly by AuthCallbackComponent after a fresh Auth0 login, OR
   *  - automatically by loadProfile() when the user is not found in the DB (404).
   *
   * The email/name are sent in the request body sourced from the Auth0 ID token
   * (auth0.user$) because Auth0 access tokens do NOT include those claims by
   * default — they are only available in the ID token.
   */
  syncUser(): void {
    if (this._synced) return;
    this._synced = true;

    // Wait for the Auth0 ID token to be decoded before posting to auth/sync.
    // _auth0User() (toSignal) can still be null at call time (Firefox, slow connections).
    // auth0.user$ is replay-like: if the user is already loaded it emits synchronously.
    this.auth0.user$
      .pipe(
        filter((u) => !!u?.sub),
        take(1),
      )
      .subscribe((auth0User) => {
        // Include roles from the ID token as a fallback for the API.
        // Auth0 access tokens only carry roles when an Auth0 Action is configured;
        // sending them from the ID token mirrors the email/name pattern.
        const roles = (auth0User?.[ROLES_CLAIM] as string[] | undefined) ?? [];
        this.api
          .post<User>('auth/sync', {
            sub: auth0User?.sub ?? null,
            email: auth0User?.email ?? null,
            name: auth0User?.name ?? null,
            roles,
          })
          .subscribe({
            next: (response) => {
              this._profileLoaded = true;
              this._user.set(response.data);
            },
            error: () => {
              // Sync failed — reset so loadProfile() can retry GET /auth/me as a fallback.
              this._profileLoaded = false;
              this.loadProfile();
            },
          });
      });
  }

  /**
   * GET auth/me — fetch profile from the backend without creating/updating.
   * Used on every authenticated session (fresh login AND page refresh).
   *
   * If the user is not found (404), syncUser() is triggered automatically so the
   * user is provisioned regardless of the entry point into the application —
   * not only when going through /auth/callback.
   */
  private loadProfile(): void {
    if (this._profileLoaded) return;
    this._profileLoaded = true;
    this.api.get<User>('auth/me').subscribe({
      next: (response) => this._user.set(response.data),
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          // User is authenticated in Auth0 but not yet in the DB.
          // Trigger a sync — handles page-refresh where /auth/callback was never visited.
          this._profileLoaded = false;
          this.syncUser();
        }
        // Other errors (401, 500, network…): silently fail.
      },
    });
  }

  setUser(user: User): void {
    this._user.set(user);
  }
}
