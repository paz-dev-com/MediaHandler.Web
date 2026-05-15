import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ThemeService } from '@shared/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [TranslocoModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);

  toggle(): void {
    this.themeService.toggle();
  }
}
