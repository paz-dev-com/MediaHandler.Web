import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';
import { ScanItemDecision } from '@shared/models/scan-decision.model';
import { MediaType } from '@shared/models/enums';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-scan-decision-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslocoModule,
    ButtonModule,
    DialogModule,
    TagModule,
    ProgressSpinnerModule,
    TmdbSearchPanelComponent,
  ],
  templateUrl: './scan-decision-detail.component.html',
  styleUrl: './scan-decision-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanDecisionDetailComponent {
  private readonly decisionService = inject(AdminScanDecisionService);
  private readonly messageService = inject(MessageService);

  @Input({ required: true }) decision!: ScanItemDecision;

  readonly reassigning = signal(false);
  readonly showTmdbSearch = signal(false);

  getPosterUrl(posterPath: string): string {
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  }

  onReassign(tmdbId: number, kind: MediaType, t: (key: string) => string): void {
    this.reassigning.set(true);
    this.decisionService.reassign(this.decision.id, tmdbId, kind).subscribe({
      next: () => {
        this.reassigning.set(false);
        this.messageService.add({
          severity: 'success',
          summary: t('admin.scanResults.reassignSuccess'),
          life: 3000,
        });
        this.decisionService.refreshDecisions();
      },
      error: () => {
        this.reassigning.set(false);
      },
    });
  }

  onTmdbSearchSelected(result: TmdbSearchResult, t: (key: string) => string): void {
    const kind: MediaType = result.mediaType === 'movie' ? MediaType.Film : MediaType.TvShow;
    this.showTmdbSearch.set(false);
    this.onReassign(result.tmdbId, kind, t);
  }
}
