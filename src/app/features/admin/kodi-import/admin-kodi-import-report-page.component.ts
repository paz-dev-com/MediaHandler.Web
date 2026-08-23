import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
import { TagModule } from 'primeng/tag';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { KodiImportItemsTableComponent } from './kodi-import-items-table.component';
import { KodiMappingDialogComponent } from './kodi-mapping-dialog.component';
import { ImportRun } from '@shared/models/kodi-import.model';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-admin-kodi-import-report-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    ButtonModule,
    MessageModule,
    TagModule,
    LocaleDatePipe,
    KodiImportItemsTableComponent,
    KodiMappingDialogComponent,
  ],
  templateUrl: './admin-kodi-import-report-page.component.html',
  styleUrl: './admin-kodi-import-report-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminKodiImportReportPageComponent implements OnInit {
  @ViewChild(KodiMappingDialogComponent) mappingDialog!: KodiMappingDialogComponent;

  private readonly importService = inject(AdminKodiImportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly report = this.importService.report;
  readonly reportLoading = this.importService.reportLoading;
  readonly reportNotFound = this.importService.reportNotFound;
  readonly reportError = this.importService.reportError;

  readonly runId = signal<string>('');

  readonly ImportRunStatus = ImportRunStatus;
  readonly KodiImportMode = KodiImportMode;

  readonly counterKeys: Array<keyof ImportRun['counts']> = [
    'totalItems',
    'moviesCreated',
    'showsCreated',
    'episodesCreated',
    'itemsReused',
    'itemsUnchanged',
    'filesLinked',
    'unmatchedPaths',
    'noScannedFiles',
    'unsupportedLocations',
    'conflicts',
    'noLongerInKodi',
    'needsReview',
    'identityLookupFailures',
    'skippedMusicVideos',
  ];

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params['runId'] as string;
      if (id) {
        this.runId.set(id);
        this.loadReport(id);
      }
    });
  }

  loadReport(id: string): void {
    this.importService.getRunDetail(id).subscribe((run) => {
      if (
        run &&
        (run.status === ImportRunStatus.Pending || run.status === ImportRunStatus.Running)
      ) {
        this.importService.beginReportPolling(id);
      }
    });
  }

  onRetry(): void {
    const id = this.runId();
    if (id) {
      this.loadReport(id);
    }
  }

  onBackToHistory(): void {
    this.router.navigate(['/admin/kodi-import']);
  }

  onCreateMapping(prefix: string): void {
    this.mappingDialog.openWithPrefix(prefix);
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
}
