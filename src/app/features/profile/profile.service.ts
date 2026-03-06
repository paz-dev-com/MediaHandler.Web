import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { User } from '@shared/models/user.model';

export interface UserPreferences {
  preferredLanguage: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<User>('auth/me').subscribe({
      next: res => {
        this.user.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('profile.loadError');
        this.loading.set(false);
      },
    });
  }

  updatePreferences(preferences: UserPreferences): void {
    this.api.put<User>('auth/preferences', preferences).subscribe({
      next: res => this.user.set(res.data),
    });
  }
}
