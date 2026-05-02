import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminScanService } from './admin-scan.service';
import { ScanStatus } from '@shared/models/enums';
import { ScanRunDetail } from '@shared/models/admin-scan.model';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-scan-status',
  standalone: true,
  imports: [DatePipe, TranslocoModule, TagModule, ProgressSpinnerModule, ButtonModule],
  template: `
    <div class="scan-status" *transloco="let t">
      @if (activeScan(); as scan) {
        <div class="scan-status__header">
          <h3 class="scan-status__title">{{ t('admin.scanner.statusTitle') }}</h3>
          <div class="scan-status__badge">
            @if (isRunning(scan)) {
              <p-progressSpinner
                styleClass="scan-status__spinner"
                strokeWidth="4"
                [style]="{ width: '1.5rem', height: '1.5rem' }"
              />
            }
            <p-tag [value]="scan.status" [severity]="getStatusSeverity(scan.status)" />
          </div>
        </div>

        <div class="scan-status__meta">
          <span class="scan-status__meta-item">
            <strong>{{ t('admin.scanner.mode') }}:</strong> {{ scan.mode }}
          </span>
          <span class="scan-status__meta-item">
            <strong>{{ t('admin.scanner.startedAt') }}:</strong>
            {{ scan.startedAt | date: 'short' }}
          </span>
        </div>

        <div class="scan-status__counts">
          <div class="scan-status__count-item">
            <span class="scan-status__count-label">{{ t('admin.scanner.counts.discovered') }}</span>
            <span class="scan-status__count-value">{{ scan.counts.totalDiscovered }}</span>
          </div>
          <div class="scan-status__count-item">
            <span class="scan-status__count-label">{{ t('admin.scanner.counts.added') }}</span>
            <span class="scan-status__count-value">{{ scan.counts.added }}</span>
          </div>
          <div class="scan-status__count-item">
            <span class="scan-status__count-label">{{ t('admin.scanner.counts.updated') }}</span>
            <span class="scan-status__count-value">{{ scan.counts.updated }}</span>
          </div>
          <div class="scan-status__count-item">
            <span class="scan-status__count-label">{{ t('admin.scanner.counts.needsReview') }}</span>
            <span class="scan-status__count-value">{{ scan.counts.needsReview }}</span>
          </div>
        </div>

        @if (isRunning(scan)) {
          <div class="scan-status__actions">
            <p-button
              [label]="t('admin.scanner.cancelScan')"
              icon="pi pi-times"
              severity="danger"
              [outlined]="true"
              (onClick)="onCancel(scan)"
            />
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .scan-status__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }
      .scan-status__title {
        margin: 0;
      }
      .scan-status__badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .scan-status__meta {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .scan-status__counts {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .scan-status__count-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--p-surface-100);
        border-radius: 0.5rem;
        min-width: 6rem;
      }
      .scan-status__count-label {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
      }
      .scan-status__count-value {
        font-size: 1.25rem;
        font-weight: 600;
      }
      .scan-status__actions {
        margin-top: 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanStatusComponent {
  private readonly scanService = inject(AdminScanService);

  readonly activeScan = this.scanService.activeScan;

  isRunning(scan: ScanRunDetail): boolean {
    return scan.status === ScanStatus.Running || scan.status === ScanStatus.Pending;
  }

  getStatusSeverity(status: ScanStatus): TagSeverity {
    switch (status) {
      case ScanStatus.Running:
        return 'info';
      case ScanStatus.Pending:
        return 'secondary';
      case ScanStatus.Completed:
        return 'success';
      case ScanStatus.Failed:
        return 'danger';
      case ScanStatus.Cancelled:
        return 'warn';
      default:
        return undefined;
    }
  }

  onCancel(scan: ScanRunDetail): void {
    this.scanService.cancelScan(scan.id);
  }
}



