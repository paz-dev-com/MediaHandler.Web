import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { ThemeToggleComponent } from '@shared/components/theme-toggle.component';
import { ThemeService, Theme } from '@shared/services/theme.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProfileService } from './profile.service';

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
  private readonly transloco = inject(TranslocoService);

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
}
