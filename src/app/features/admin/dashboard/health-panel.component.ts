import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminHealthService } from './admin-health.service';

@Component({
  selector: 'app-health-panel',
  standalone: true,
  imports: [DatePipe, TranslocoModule, TagModule, ProgressSpinnerModule],
  templateUrl: './health-panel.component.html',
  styleUrl: './health-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthPanelComponent implements OnInit {
  private readonly healthService = inject(AdminHealthService);

  readonly health = this.healthService.health;
  readonly loading = this.healthService.loading;

  ngOnInit(): void {
    this.healthService.getHealth();
  }
}
