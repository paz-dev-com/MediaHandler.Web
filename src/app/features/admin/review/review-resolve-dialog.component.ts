import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { AdminReviewService } from './admin-review.service';
import { ReviewItem, TmdbCandidate } from '@shared/models/review.model';
import { MediaType, ReviewResolutionAction, ReviewStatus } from '@shared/models/enums';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';
import { deriveRootParentFolder } from './review-path.util';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-review-resolve-dialog',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    TranslocoModule,
    CheckboxModule,
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
  bulkResolve = false;

  readonly ReviewResolutionAction = ReviewResolutionAction;
  readonly MediaType = MediaType;

  /**
   * Automatically filter TMDB search to TvShow when the file is an episode
   * (parsedSeason or parsedEpisode is set), to null (all) otherwise.
   */
  readonly tmdbMediaTypeFilter = computed<MediaType | null>(() => {
    const it = this.item;
    if (!it) return null;
    return it.parsedSeason != null || it.parsedEpisode != null ? MediaType.TvShow : null;
  });

  /** Root parent folder path derived using deriveRootParentFolder() for prefix-based sibling matching */
  readonly parentFolderPath = computed<string>(() => {
    const it = this.item;
    if (!it) return '';
    return deriveRootParentFolder(it.filePath, this.reviewService.items());
  });

  /** Count of open sibling items under the root parent folder (prefix match) */
  readonly siblingCount = computed<number>(() => {
    const folder = this.parentFolderPath();
    const current = this.item;
    if (!folder || !current) return 0;
    const prefix = folder + '/';
    return this.reviewService
      .items()
      .filter(
        (it) =>
          it.id !== current.id && it.status === ReviewStatus.Open && it.filePath.startsWith(prefix),
      ).length;
  });

  ngOnChanges(): void {
    // Reset selection when item changes
    this.selectedCandidate.set(null);
    this.showTmdbSearch.set(false);
    this.bulkResolve = false;
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.selectedCandidate.set(null);
      this.showTmdbSearch.set(false);
      this.bulkResolve = false;
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

    if (this.bulkResolve) {
      this.reviewService
        .bulkResolveByFolder(
          this.parentFolderPath(),
          ReviewResolutionAction.Assign,
          candidate.tmdbId,
          candidate.kind as string,
        )
        .subscribe((result) => {
          this.messageService.add({
            severity: 'success',
            summary: t('admin.review.bulkResolve.successToast', { count: result.resolvedCount }),
            life: 3000,
          });
        });
    } else {
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
    }

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

    if (this.bulkResolve) {
      this.reviewService
        .bulkResolveByFolder(
          this.parentFolderPath(),
          ReviewResolutionAction.Assign,
          result.id,
          kind as string,
        )
        .subscribe((res) => {
          this.messageService.add({
            severity: 'success',
            summary: t('admin.review.bulkResolve.successToast', { count: res.resolvedCount }),
            life: 3000,
          });
        });
    } else {
      this.reviewService.resolveItem(this.item.id, ReviewResolutionAction.Assign, result.id, kind);

      this.messageService.add({
        severity: 'success',
        summary: t('admin.review.resolveDialog.assignedSuccess'),
        life: 3000,
      });
    }

    this.showTmdbSearch.set(false);
    this.resolved.emit();
  }

  onAction(
    action: ReviewResolutionAction,
    t: (key: string, params?: Record<string, unknown>) => string,
  ): void {
    if (!this.item) return;

    if (this.bulkResolve && action !== ReviewResolutionAction.Reopen) {
      this.reviewService
        .bulkResolveByFolder(this.parentFolderPath(), action)
        .subscribe((result) => {
          this.messageService.add({
            severity: 'success',
            summary: t('admin.review.bulkResolve.successToast', { count: result.resolvedCount }),
            life: 3000,
          });
        });
    } else {
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
    }

    this.selectedCandidate.set(null);
    this.resolved.emit();
  }
}
