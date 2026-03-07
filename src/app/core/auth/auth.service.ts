import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { ApiService } from '@core/api/api.service';
import { User } from '@shared/models/user.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth0 = inject(Auth0Service);
  private readonly api = inject(ApiService);

  private readonly _user = signal<User | null>(null);

  readonly isAuthenticated = toSignal(this.auth0.isAuthenticated$, { initialValue: false });
  readonly user = computed(() => this._user());

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

  syncUser(): void {
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
