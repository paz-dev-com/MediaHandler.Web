import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
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
  imports: [LocaleDatePipe, TranslocoModule, TagModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './scan-status.component.html',
  styleUrl: './scan-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanStatusComponent {
  private readonly scanService = inject(AdminScanService);
  private readonly router = inject(Router);

  readonly activeScan = this.scanService.activeScan;
  readonly ScanStatus = ScanStatus;

  isRunning(scan: ScanRunDetail): boolean {
    return scan.status === ScanStatus.Running || scan.status === ScanStatus.Pending;
  }

  isCompleted(scan: ScanRunDetail): boolean {
    return scan.status === ScanStatus.Completed;
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

  navigateToResults(scanId: string): void {
    this.router.navigate(['/admin/scan-results', scanId]);
  }
}
