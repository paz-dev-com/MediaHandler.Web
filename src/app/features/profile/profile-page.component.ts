import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@core/auth/auth.service';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { ThemeToggleComponent } from '@shared/components/theme-toggle.component';
import { ThemeService, Theme } from '@shared/services/theme.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProfileService } from './profile.service';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface LanguageOption {
  label: string;
  value: string;
}

interface ThemeOption {
  labelKey: string;
  value: Theme;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    TranslocoModule,
    ButtonModule,
    CardModule,
    SelectModule,
    TagModule,
    FormsModule,
    NgOptimizedImage,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  readonly profileService = inject(ProfileService);
  readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly transloco = inject(TranslocoService);

  /** Effective profile picture URL: custom backend path > Auth0 provider picture > placeholder.
   * The custom path from the API is relative (e.g. /uploads/...) and must be resolved to an
   * absolute URL pointing to the API server origin. */
  readonly effectivePictureUrl = computed(() => {
    const user = this.profileService.user();
    const auth0Pic = this.authService.auth0Picture();
    const customUrl = this.profileService.resolveProfilePictureUrl(user?.profilePicturePath);
    return customUrl ?? auth0Pic ?? '/assets/images/avatar-placeholder.svg';
  });

  readonly languages: LanguageOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
  ];

  readonly themeOptions: ThemeOption[] = [
    { labelKey: 'profile.themeOptions.dark', value: 'dark' },
    { labelKey: 'profile.themeOptions.light', value: 'light' },
    { labelKey: 'profile.themeOptions.system', value: 'system' },
  ];

  selectedLanguage = this.transloco.getActiveLang();

  ngOnInit(): void {
    this.profileService.loadProfile();
  }

  onLanguageChange(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.profileService.updatePreferences({ preferredLanguage: lang });
  }

  onThemeChange(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  onRetry(): void {
    this.profileService.loadProfile();
  }

  onLogout(): void {
    this.authService.logout();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Frontend validation before upload
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      this.profileService.uploadError.set('profile.picture.errorType');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.profileService.uploadError.set('profile.picture.errorSize');
      return;
    }

    this.profileService.uploadProfilePicture(file);
    // Reset input so the same file can be re-selected after removal
    input.value = '';
  }

  onRemovePicture(): void {
    this.profileService.removeProfilePicture();
  }
}
