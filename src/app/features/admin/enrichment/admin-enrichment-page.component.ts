import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminEnrichmentService } from './admin-enrichment.service';
import { EnrichmentStatus } from '@shared/models/enums';

@Component({
  selector: 'app-admin-enrichment-page',
  standalone: true,
  imports: [
    TranslocoModule,
    ButtonModule,
    MessageModule,
    ProgressBarModule,
    TagModule,
    CardModule,
    ConfirmDialogModule,
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
  readonly EnrichmentStatus = EnrichmentStatus;

  get isRunning(): boolean {
    return this.enrichmentStatus()?.status === EnrichmentStatus.Running;
  }

  get isCompleted(): boolean {
    return this.enrichmentStatus()?.status === EnrichmentStatus.Completed;
  }

  get hasSummaryData(): boolean {
    const s = this.summary();
    return !!s && (s.newEntries > 0 || s.changedEntries > 0 || s.skippedEntries > 0);
  }

  ngOnInit(): void {
    this.enrichmentService.getStatus().subscribe({
      error: () => {
        // no active run — that's fine
      },
    });
    this.enrichmentService.getSummary();
  }

  startEnrichment(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to start TMDB enrichment?',
      header: 'Start TMDB Enrichment',
      icon: 'pi pi-sync',
      accept: () => {
        this.enrichmentService.startEnrichment();
        this.messageService.add({
          severity: 'info',
          summary: 'Enrichment Started',
          detail: 'TMDB enrichment scan has been started.',
        });
      },
    });
  }
}
