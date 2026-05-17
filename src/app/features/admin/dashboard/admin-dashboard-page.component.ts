import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { HealthPanelComponent } from './health-panel.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [TranslocoModule, CardModule, HealthPanelComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPageComponent {}
