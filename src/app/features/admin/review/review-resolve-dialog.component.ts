import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
import { AdminReviewService } from './admin-review.service';
import { ReviewItem, TmdbCandidate } from '@shared/models/review.model';
import { MediaType, ReviewResolutionAction } from '@shared/models/enums';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-review-resolve-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    TranslocoModule,
    DialogModule,
    ButtonModule,
    TagModule,
    TmdbSearchPanelComponent,
  ],
  templateUrl: './review-resolve-dialog.component.html',
  styleUrl: './review-resolve-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewResolveDialogComponent implements OnChanges {
  private readonly reviewService = inject(AdminReviewService);
  private readonly messageService = inject(MessageService);

  @Input() item: ReviewItem | null = null;
  @Output() resolved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly selectedCandidate = signal<TmdbCandidate | null>(null);
  readonly showTmdbSearch = signal(false);

  readonly ReviewResolutionAction = ReviewResolutionAction;

  ngOnChanges(): void {
    // Reset selection when item changes
    this.selectedCandidate.set(null);
    this.showTmdbSearch.set(false);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.selectedCandidate.set(null);
      this.showTmdbSearch.set(false);
      this.closed.emit();
    }
  }

  selectCandidate(candidate: TmdbCandidate): void {
    this.selectedCandidate.set(candidate);
  }

  isSelected(candidate: TmdbCandidate): boolean {
    return this.selectedCandidate()?.tmdbId === candidate.tmdbId;
  }

  getPosterUrl(posterPath: string): string {
    return `${TMDB_IMAGE_BASE}${posterPath}`;
  }

  getStatusSeverity(
    status: string,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'Open':
        return 'warn';
      case 'Resolved':
        return 'success';
      case 'Dismissed':
        return 'secondary';
      default:
        return 'info';
    }
  }

  onAssign(t: (key: string, params?: Record<string, unknown>) => string): void {
    const candidate = this.selectedCandidate();
    if (!this.item || !candidate) return;

    this.reviewService.resolveItem(
      this.item.id,
      ReviewResolutionAction.Assign,
      candidate.tmdbId,
      candidate.kind as MediaType,
    );

    this.messageService.add({
      severity: 'success',
      summary: t('admin.review.resolveDialog.assignedSuccess'),
      life: 3000,
    });

    this.selectedCandidate.set(null);
    this.showTmdbSearch.set(false);
    this.resolved.emit();
  }

  onTmdbSearchSelected(
    result: TmdbSearchResult,
    t: (key: string, params?: Record<string, unknown>) => string,
  ): void {
    if (!this.item) return;

    const kind: MediaType = result.mediaType === 'movie' ? MediaType.Film : MediaType.TvShow;

    this.reviewService.resolveItem(
      this.item.id,
      ReviewResolutionAction.Assign,
      result.tmdbId,
      kind,
    );

    this.messageService.add({
      severity: 'success',
      summary: t('admin.review.resolveDialog.assignedSuccess'),
      life: 3000,
    });

    this.showTmdbSearch.set(false);
    this.resolved.emit();
  }

  onAction(
    action: ReviewResolutionAction,
    t: (key: string, params?: Record<string, unknown>) => string,
  ): void {
    if (!this.item) return;

    this.reviewService.resolveItem(this.item.id, action);

    const msgKey =
      action === ReviewResolutionAction.Dismiss
        ? 'admin.review.resolveDialog.dismissedSuccess'
        : action === ReviewResolutionAction.Delete
          ? 'admin.review.resolveDialog.deletedSuccess'
          : 'admin.review.resolveDialog.reopenedSuccess';

    this.messageService.add({
      severity: 'success',
      summary: t(msgKey),
      life: 3000,
    });

    this.selectedCandidate.set(null);
    this.resolved.emit();
  }
}
