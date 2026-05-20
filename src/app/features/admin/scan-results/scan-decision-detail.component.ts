import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { RenameDialogComponent } from '../shared/rename-dialog.component';
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
    RenameDialogComponent,
  ],
  templateUrl: './scan-decision-detail.component.html',
  styleUrl: './scan-decision-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanDecisionDetailComponent {
  private readonly decisionService = inject(AdminScanDecisionService);
  private readonly messageService = inject(MessageService);

  @Input({ required: true }) decision!: ScanItemDecision;
  @Output() fileRenamed = new EventEmitter<void>();
  @Output() itemAssigned = new EventEmitter<ScanItemDecision>();

  readonly reassigning = signal(false);
  readonly showTmdbSearch = signal(false);
  readonly renameDialogVisible = signal(false);

  getPosterUrl(posterPath: string): string {
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  }

  openRenameDialog(): void {
    this.renameDialogVisible.set(true);
  }

  onFileRenamed(): void {
    this.fileRenamed.emit();
    this.decisionService.refreshDecisions();
  }

  onReassign(tmdbId: number, candidateMediaType: MediaType, t: (key: string) => string): void {
    // Derive the authoritative kind from multiple reliable signals (in priority order):
    // 1. decision.mediaType (set by the scanner from ParsedMediaType)
    // 2. Presence of parsedSeason / parsedEpisode → definitely a TV episode
    // 3. candidateKind as last resort — may be wrong for pre-fix scan data
    const mediaType = this.inferDecisionKind(candidateMediaType);
    this.reassigning.set(true);
    this.decisionService.reassign(this.decision.id, tmdbId, mediaType).subscribe({
      next: (updated) => {
        this.reassigning.set(false);
        this.messageService.add({
          severity: 'success',
          summary: t('admin.scanResults.reassignSuccess'),
          life: 3000,
        });
        this.itemAssigned.emit(updated);
      },
      error: () => {
        this.reassigning.set(false);
      },
    });
  }

  onTmdbSearchSelected(result: TmdbSearchResult, t: (key: string) => string): void {
    // result.mediaType from /search/multi is always reliable ("tv" or "movie").
    // The user explicitly chose this result, so respect exactly what they selected.
    const kind: MediaType = result.mediaType === 'movie' ? MediaType.Film : MediaType.TvShow;
    this.showTmdbSearch.set(false);
    this.onReassign(result.id, kind, t);
  }

  /**
   * Infers the authoritative MediaType for this decision using multiple signals.
   * Avoids trusting `candidate.kind` alone, which was incorrectly stored as Film
   * for all TV candidates in scans run before the SearchCandidatesAsync kind fix.
   *
   * Priority:
   *  1. parsedSeason / parsedEpisode present → always a TV episode (infallible)
   *  2. `decision.mediaType`  — set by scanner from ParsedMediaType (reliable when not null)
   *  3. `fallback` — passed-in candidate.kind, last resort (may be wrong for old data)
   */
  private inferDecisionKind(fallback: MediaType): MediaType {
    if (this.decision.parsedSeason !== null || this.decision.parsedEpisode !== null) {
      return MediaType.TvShow;
    }
    if (this.decision.kind !== null && this.decision.kind !== undefined) {
      return this.decision.kind;
    }
    return fallback;
  }
}
