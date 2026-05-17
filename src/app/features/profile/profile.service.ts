import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '@core/api/api.service';
import { AuthService } from '@core/auth/auth.service';
import { User } from '@shared/models/user.model';
import { environment } from '@env/environment';

export interface UserPreferences {
  preferredLanguage: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  /**
   * Resolve a profile picture path to a full absolute URL.
   * The API returns paths like `/uploads/profile-pictures/user.jpg` which are
   * relative to the API origin, not the frontend origin.
   */
  resolveProfilePictureUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const origin = new URL(environment.apiBaseUrl).origin;
    return `${origin}${path}`;
  }

  loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<User>('auth/me').subscribe({
      next: (res) => {
        this.user.set(res.data);
        // Keep AuthService in sync so sidebar navPictureUrl reflects the latest state
        this.authService.setUser(res.data);
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
      next: (res) => this.user.set(res.data),
    });
  }

  /**
   * Upload a new profile picture.
   * Sends multipart/form-data to POST /api/v1/users/profile-picture.
   * Updates the user signal with the returned UserDto on success.
   */
  uploadProfilePicture(file: File): void {
    this.isUploading.set(true);
    this.uploadError.set(null);

    const formData = new FormData();
    formData.append('file', file);

    this.http
      .post<{ data: User }>(`${environment.apiBaseUrl}/users/profile-picture`, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const updatedUser = this.user()
            ? { ...this.user()!, profilePicturePath: res.data.profilePicturePath }
            : res.data;
          this.user.set(updatedUser);
          // Sync to AuthService so sidebar navPictureUrl updates immediately
          this.authService.setUser(updatedUser);
          this.isUploading.set(false);
        },
        error: (err) => {
          const status = err?.status;
          if (status === 400) {
            this.uploadError.set('profile.picture.errorType');
          } else {
            this.uploadError.set('profile.loadError');
          }
          this.isUploading.set(false);
        },
      });
  }

  /**
   * Remove the custom profile picture.
   * Sends DELETE /api/v1/users/profile-picture.
   * Clears profilePicturePath on the user signal on success.
   */
  removeProfilePicture(): void {
    this.isUploading.set(true);
    this.uploadError.set(null);

    this.http
      .delete<{ data: User }>(`${environment.apiBaseUrl}/users/profile-picture`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const updatedUser = this.user() ? { ...this.user()!, profilePicturePath: null } : null;
          this.user.update((u) => (u ? { ...u, profilePicturePath: null } : u));
          // Sync to AuthService so sidebar navPictureUrl updates immediately
          if (updatedUser) {
            this.authService.setUser(updatedUser);
          }
          this.isUploading.set(false);
        },
        error: () => {
          this.uploadError.set('profile.loadError');
          this.isUploading.set(false);
        },
      });
  }
}
