import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '@core/layout/sidebar.component';
import { AuthService } from '@core/auth/auth.service';
import { routeAnimations } from '@shared/animations/route.animations';
import { ThemeService } from '@shared/services/theme.service';
import { TranslocoService } from '@jsverse/transloco';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [routeAnimations],
})
export class App {
  /** True when the OS/browser requests reduced motion — disables Angular Animations globally. */
  readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    // Bootstrap ThemeService eagerly so data-theme is applied before first paint,
    // preventing a flash of wrong theme (FOWT). The service's effect() runs
    // synchronously in the constructor, writing the attribute to <html>.
    inject(ThemeService);

    // Apply the user's preferred language as soon as the profile is loaded.
    // This restores the correct language on every page refresh — Transloco's defaultLang
    // is always 'en', so without this the language resets on each reload.
    const authService = inject(AuthService);
    const transloco = inject(TranslocoService);
    effect(() => {
      const lang = authService.user()?.preferredLanguage;
      if (lang) {
        transloco.setActiveLang(lang);
      }
    });
  }

  getRouteAnimationState(outlet: RouterOutlet): string {
    return outlet.isActivated ? ((outlet.activatedRouteData['animation'] as string) ?? '') : '';
  }
}
