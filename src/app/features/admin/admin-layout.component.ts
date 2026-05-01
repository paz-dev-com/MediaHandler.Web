import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Placeholder layout shell — implemented in Phase 2 (T009) */
@Component({
  selector: 'app-admin-layout',
  template: `<router-outlet />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class AdminLayoutComponent {}
