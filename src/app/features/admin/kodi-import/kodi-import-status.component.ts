import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportRun } from '@shared/models/kodi-import.model';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-kodi-import-status',
  standalone: true,
  imports: [
    LocaleDatePipe,
    TranslocoModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
  ],
  templateUrl: './kodi-import-status.component.html',
  styleUrl: './kodi-import-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiImportStatusComponent {
  private readonly importService = inject(AdminKodiImportService);
  private readonly router = inject(Router);

  readonly activeRun = this.importService.activeRun;
  readonly pollingError = this.importService.pollingError;
  readonly elapsedSeconds = this.importService.elapsedSeconds;
  readonly ImportRunStatus = ImportRunStatus;
  readonly KodiImportMode = KodiImportMode;

  isActive(run: ImportRun): boolean {
    return run.status === ImportRunStatus.Pending || run.status === ImportRunStatus.Running;
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

  navigateToReport(runId: string): void {
    this.router.navigate(['/admin/kodi-import', runId]);
  }

  formatElapsed(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
  }
}
