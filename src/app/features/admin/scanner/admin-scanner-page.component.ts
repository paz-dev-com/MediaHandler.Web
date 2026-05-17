import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AdminScanService } from './admin-scan.service';
import { ScanLauncherComponent } from './scan-launcher.component';
import { ScanStatusComponent } from './scan-status.component';
import { ScanHistoryTableComponent } from './scan-history-table.component';
import { ScanStatus } from '@shared/models/enums';

@Component({
  selector: 'app-admin-scanner-page',
  standalone: true,
  imports: [TranslocoModule, ScanLauncherComponent, ScanStatusComponent, ScanHistoryTableComponent],
  templateUrl: './admin-scanner-page.component.html',
  styleUrl: './admin-scanner-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScannerPageComponent implements OnInit {
  private readonly scanService = inject(AdminScanService);

  readonly activeScan = this.scanService.activeScan;

  ngOnInit(): void {
    this.scanService.getActiveScan();
  }

  isActiveScan(): boolean {
    const scan = this.activeScan();
    return (
      scan !== null && (scan.status === ScanStatus.Running || scan.status === ScanStatus.Pending)
    );
  }
}
