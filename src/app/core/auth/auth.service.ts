import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { environment } from '@env/environment';
import OktaAuth from '@okta/okta-auth-js';
import { User } from '@shared/models/user.model';

const oktaAuth = new OktaAuth({
  issuer: environment.okta.issuer,
  clientId: environment.okta.clientId,
  redirectUri: environment.okta.redirectUri,
  scopes: environment.okta.scopes,
});

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _isAuthenticated = signal<boolean>(false);
  private readonly _user = signal<User | null>(null);

  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly user = computed(() => this._user());

  async initialize(): Promise<void> {
    const authenticated = await oktaAuth.isAuthenticated();
    this._isAuthenticated.set(authenticated);
    if (authenticated) {
      await this.syncUser();
    }
  }

  async login(): Promise<void> {
    await oktaAuth.signInWithRedirect();
  }

  async logout(): Promise<void> {
    this._isAuthenticated.set(false);
    this._user.set(null);
    await oktaAuth.signOut();
  }

  async handleCallback(): Promise<void> {
    await oktaAuth.handleLoginRedirect();
    this._isAuthenticated.set(true);
    await this.syncUser();
  }

  async getAccessToken(): Promise<string | undefined> {
    const tokenManager = oktaAuth.tokenManager;
    const token = await tokenManager.get('accessToken');
    if (token && 'accessToken' in token) {
      return token.accessToken;
    }
    return undefined;
  }

  private async syncUser(): Promise<void> {
    this.api.post<User>('auth/sync', {}).subscribe({
      next: (response) => this._user.set(response.data),
      error: () => {
        // Silently fail — user profile will be fetched on demand
      },
    });
  }

  setUser(user: User): void {
    this._user.set(user);
  }
}
