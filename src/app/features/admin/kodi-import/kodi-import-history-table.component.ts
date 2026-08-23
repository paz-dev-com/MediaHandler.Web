import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportRun } from '@shared/models/kodi-import.model';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-kodi-import-history-table',
  standalone: true,
  imports: [LocaleDatePipe, TranslocoModule, ButtonModule, MessageModule, TableModule, TagModule],
  templateUrl: './kodi-import-history-table.component.html',
  styleUrl: './kodi-import-history-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiImportHistoryTableComponent implements OnInit {
  private readonly importService = inject(AdminKodiImportService);
  private readonly router = inject(Router);

  readonly history = this.importService.history;
  readonly historyMeta = this.importService.historyMeta;
  readonly historyLoading = this.importService.historyLoading;
  readonly historyError = this.importService.historyError;
  readonly ImportRunStatus = ImportRunStatus;
  readonly KodiImportMode = KodiImportMode;

  ngOnInit(): void {
    this.importService.getHistory(1, 20);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? 20;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.importService.getHistory(page, pageSize);
  }

  onRetry(): void {
    this.importService.getHistory(this.historyMeta().page, this.historyMeta().pageSize);
  }

  navigateToReport(runId: string): void {
    this.router.navigate(['/admin/kodi-import', runId]);
  }

  isTerminal(run: ImportRun): boolean {
    return run.status === ImportRunStatus.Completed || run.status === ImportRunStatus.Failed;
  }

  getStatusSeverity(status: ImportRunStatus): TagSeverity {
    switch (status) {
      case ImportRunStatus.Pending:
        return 'secondary';
      case ImportRunStatus.Running:
        return 'info';
      case ImportRunStatus.Completed:
        return 'success';
      case ImportRunStatus.Failed:
        return 'danger';
      default:
        return undefined;
    }
  }

  getModeSeverity(mode: KodiImportMode): TagSeverity {
    return mode === KodiImportMode.Preview ? 'warn' : 'info';
  }

  createdCount(run: ImportRun): number {
    return run.counts.moviesCreated + run.counts.showsCreated + run.counts.episodesCreated;
  }
}
