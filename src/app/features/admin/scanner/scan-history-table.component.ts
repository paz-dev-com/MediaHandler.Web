import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminScanService } from './admin-scan.service';
import { ScanStatus } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-scan-history-table',
  standalone: true,
  imports: [DatePipe, TranslocoModule, TableModule, TagModule],
  template: `
    <div class="scan-history-table" *transloco="let t">
      <h3 class="scan-history-table__title">{{ t('admin.scanner.historyTitle') }}</h3>

      <p-table
        [value]="scanHistory()"
        [lazy]="true"
        [paginator]="true"
        [rows]="20"
        [totalRecords]="historyMeta().total"
        [rowsPerPageOptions]="[10, 20, 50]"
        (onLazyLoad)="onLazyLoad($event)"
        styleClass="p-datatable-striped"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>{{ t('admin.scanner.columns.mode') }}</th>
            <th>{{ t('admin.scanner.columns.status') }}</th>
            <th>{{ t('admin.scanner.columns.startedAt') }}</th>
            <th>{{ t('admin.scanner.columns.finishedAt') }}</th>
            <th>{{ t('admin.scanner.columns.discovered') }}</th>
            <th>{{ t('admin.scanner.columns.added') }}</th>
            <th>{{ t('admin.scanner.columns.updated') }}</th>
            <th>{{ t('admin.scanner.columns.needsReview') }}</th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-scan>
          <tr>
            <td>{{ scan.mode }}</td>
            <td>
              <p-tag [value]="scan.status" [severity]="getStatusSeverity(scan.status)" />
            </td>
            <td>{{ scan.startedAt | date: 'short' }}</td>
            <td>{{ scan.finishedAt ? (scan.finishedAt | date: 'short') : '—' }}</td>
            <td>{{ scan.counts.totalDiscovered }}</td>
            <td>{{ scan.counts.added }}</td>
            <td>{{ scan.counts.updated }}</td>
            <td>{{ scan.counts.needsReview }}</td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="8" class="text-center p-4">
              {{ t('admin.scanner.historyEmpty') }}
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [
    `
      .scan-history-table__title {
        margin: 0 0 1rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanHistoryTableComponent implements OnInit {
  private readonly scanService = inject(AdminScanService);

  readonly scanHistory = this.scanService.scanHistory;
  readonly historyMeta = this.scanService.historyMeta;

  ngOnInit(): void {
    this.scanService.getScanHistory(1, 20);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? 20;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.scanService.getScanHistory(page, pageSize);
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
}
