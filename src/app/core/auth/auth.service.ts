import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
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

  /** Prevents loadProfile() / syncUser() from firing more than once per session. */
  private _profileLoaded = false;
  private _synced = false;

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
    // Once Auth0 confirms the user is authenticated (login OR page-refresh with
    // valid tokens in localStorage), fetch the backend profile exactly once.
    // This is intentionally LAZY and fire-and-forget — it never triggers a
    // redirect, so it cannot cause a login loop.
    this.auth0.isAuthenticated$.pipe(filter(Boolean), take(1)).subscribe(() => this.loadProfile());
  }

  login(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this._user.set(null);
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
   * Called ONLY from the auth-callback component after a fresh login.
   * Fire-and-forget: does not block navigation.
   */
  syncUser(): void {
    if (this._synced) return;
    this._synced = true;
    this._profileLoaded = true; // sync already returns the full profile
    this.api.post<User>('auth/sync', {}).subscribe({
      next: (response) => this._user.set(response.data),
      error: () => {
        /* silently fail — profile will be fetched on demand */
      },
    });
  }

  /**
   * GET auth/me — fetch profile from the backend without creating/updating.
   * Used on page refresh (user already exists in DB from a previous login).
   * Fire-and-forget: does not block navigation.
   */
  private loadProfile(): void {
    if (this._profileLoaded) return;
    this._profileLoaded = true;
    this.api.get<User>('auth/me').subscribe({
      next: (response) => this._user.set(response.data),
      error: () => {
        /* silently fail */
      },
    });
  }

  setUser(user: User): void {
    this._user.set(user);
  }
}
