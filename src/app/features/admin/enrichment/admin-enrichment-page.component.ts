import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminEnrichmentService } from './admin-enrichment.service';
import { EnrichmentRun } from '@shared/models/enrichment.model';
import { EnrichmentStatus } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

@Component({
  selector: 'app-admin-enrichment-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslocoModule,
    ButtonModule,
    MessageModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    TagModule,
    CardModule,
    ConfirmDialogModule,
    TableModule,
  ],
  templateUrl: './admin-enrichment-page.component.html',
  styleUrl: './admin-enrichment-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class AdminEnrichmentPageComponent implements OnInit {
  private readonly enrichmentService = inject(AdminEnrichmentService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly enrichmentStatus = this.enrichmentService.enrichmentStatus;
  readonly summary = this.enrichmentService.summary;
  readonly loading = this.enrichmentService.loading;
  readonly enrichmentHistory = this.enrichmentService.enrichmentHistory;
  readonly historyMeta = this.enrichmentService.historyMeta;
  readonly historyLoading = this.enrichmentService.historyLoading;
  readonly runDetails = this.enrichmentService.runDetails;
  readonly runDetailsLoading = this.enrichmentService.runDetailsLoading;
  readonly EnrichmentStatus = EnrichmentStatus;

  expandedHistoryRows: Record<string, boolean> = {};

  get isRunning(): boolean {
    return this.enrichmentStatus()?.status === EnrichmentStatus.Running;
  }

  get isCompleted(): boolean {
    return this.enrichmentStatus()?.status === EnrichmentStatus.Completed;
  }

  get hasSummaryData(): boolean {
    const s = this.summary();
    return !!s && (s.newCount > 0 || s.changedCount > 0);
  }

  ngOnInit(): void {
    this.enrichmentService.getStatus().subscribe({
      error: () => {
        // no active run — that's fine
      },
    });
    this.enrichmentService.getSummary();
    this.enrichmentService.getHistory(1, 20);
  }

  startEnrichment(t: (key: string) => string): void {
    this.confirmationService.confirm({
      message: t('admin.enrichment.confirmMessage'),
      header: t('admin.enrichment.confirmTitle'),
      icon: 'pi pi-sync',
      accept: () => {
        this.enrichmentService.startEnrichment();
        this.messageService.add({
          severity: 'info',
          summary: t('admin.enrichment.startButton'),
        });
      },
    });
  }

  onHistoryLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.historyMeta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.enrichmentService.getHistory(page, pageSize);
  }

  getStatusSeverity(status: EnrichmentStatus): TagSeverity {
    switch (status) {
      case EnrichmentStatus.Completed:
        return 'success';
      case EnrichmentStatus.Failed:
        return 'danger';
      case EnrichmentStatus.Running:
        return 'warn';
      case EnrichmentStatus.Pending:
        return 'info';
      default:
        return undefined;
    }
  }

  toggleHistoryRow(id: string, currentlyExpanded: boolean): void {
    this.expandedHistoryRows = currentlyExpanded ? {} : { [id]: true };
    if (!currentlyExpanded) {
      this.enrichmentService.getRunDetails(id);
    }
  }

  getMediaDetailSeverity(status: string): TagSeverity {
    switch (status) {
      case 'Enriched':
        return 'success';
      case 'Failed':
        return 'danger';
      case 'Skipped':
        return 'secondary';
      default:
        return undefined;
    }
  }

  trackByRunId(_: number, run: EnrichmentRun): string {
    return run.enrichmentRunId;
  }
}
