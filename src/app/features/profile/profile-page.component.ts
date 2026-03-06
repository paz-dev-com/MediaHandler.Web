import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProfileService } from './profile.service';

interface LanguageOption {
  label: string;
  value: string;
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
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  readonly profileService = inject(ProfileService);
  private readonly transloco = inject(TranslocoService);

  readonly languages: LanguageOption[] = [
    { label: 'English', value: 'en' },
    { label: 'Français', value: 'fr' },
  ];

  selectedLanguage = this.transloco.getActiveLang();

  ngOnInit(): void {
    this.profileService.loadProfile();
  }

  onLanguageChange(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.profileService.updatePreferences({ preferredLanguage: lang });
  }

  onRetry(): void {
    this.profileService.loadProfile();
  }
}
