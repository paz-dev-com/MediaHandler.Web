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
  template: `
    <div class="health-panel" *transloco="let t">
      @if (loading()) {
        <div class="health-panel__loading">
          <p-progressSpinner [style]="{ width: '40px', height: '40px' }" />
        </div>
      } @else if (health(); as status) {
        <div class="health-panel__content">
          <div class="health-panel__status">
            <span class="health-panel__label">{{ t('admin.health.status') }}</span>
            <p-tag
              [value]="
                status.status === 'Healthy'
                  ? t('admin.health.healthy')
                  : t('admin.health.unhealthy')
              "
              [severity]="status.status === 'Healthy' ? 'success' : 'danger'"
            />
          </div>
          <div class="health-panel__row">
            <span class="health-panel__label">{{ t('admin.health.timestamp') }}</span>
            <span class="health-panel__value">{{ status.timestamp | date: 'medium' }}</span>
          </div>
          <div class="health-panel__row">
            <span class="health-panel__label">{{ t('admin.health.version') }}</span>
            <span class="health-panel__value">{{ status.version }}</span>
          </div>
        </div>
      } @else {
        <p class="health-panel__empty">{{ t('admin.health.unavailable') }}</p>
      }
    </div>
  `,
  styles: [
    `
      .health-panel {
        &__loading {
          display: flex;
          justify-content: center;
          padding: 1rem;
        }

        &__content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        &__status,
        &__row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        &__label {
          font-weight: 600;
          min-width: 6rem;
          color: var(--text-color-secondary);
        }

        &__value {
          color: var(--text-color);
        }

        &__empty {
          color: var(--text-color-secondary);
          font-style: italic;
        }
      }
    `,
  ],
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
