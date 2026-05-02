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
  templateUrl: './scan-history-table.component.html',
  styleUrl: './scan-history-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanHistoryTableComponent implements OnInit {
  private readonly scanService = inject(AdminScanService);

  readonly scanHistory = this.scanService.scanHistory;
  readonly historyMeta = this.scanService.historyMeta;
  readonly historyLoading = this.scanService.historyLoading;

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
