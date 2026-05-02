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

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-review-resolve-dialog',
  standalone: true,
  imports: [DecimalPipe, TranslocoModule, DialogModule, ButtonModule, TagModule],
  template: `
    <p-dialog
      *transloco="let t"
      [header]="t('admin.review.resolveDialog.title')"
      [visible]="!!item"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [style]="{ width: '50rem' }"
      [closable]="true"
      [draggable]="false"
    >
      @if (item) {
        <div class="review-resolve-dialog__content">
          <!-- File info -->
          <div class="review-resolve-dialog__section">
            <div class="review-resolve-dialog__field">
              <span class="review-resolve-dialog__label">{{
                t('admin.review.resolveDialog.filePath')
              }}</span>
              <span class="review-resolve-dialog__value review-resolve-dialog__path">{{
                item.filePath
              }}</span>
            </div>
            <div class="review-resolve-dialog__meta-row">
              @if (item.parsedTitle) {
                <div class="review-resolve-dialog__field">
                  <span class="review-resolve-dialog__label">{{
                    t('admin.review.resolveDialog.parsedTitle')
                  }}</span>
                  <span class="review-resolve-dialog__value">{{ item.parsedTitle }}</span>
                </div>
              }
              @if (item.parsedYear) {
                <div class="review-resolve-dialog__field">
                  <span class="review-resolve-dialog__label">{{
                    t('admin.review.resolveDialog.parsedYear')
                  }}</span>
                  <span class="review-resolve-dialog__value">{{ item.parsedYear }}</span>
                </div>
              }
              <div class="review-resolve-dialog__field">
                <span class="review-resolve-dialog__label">{{
                  t('admin.review.resolveDialog.reason')
                }}</span>
                <p-tag [value]="item.reason" [severity]="'warn'" />
              </div>
              <div class="review-resolve-dialog__field">
                <span class="review-resolve-dialog__label">{{
                  t('admin.review.resolveDialog.status')
                }}</span>
                <p-tag [value]="item.status" [severity]="getStatusSeverity(item.status)" />
              </div>
            </div>
          </div>

          <!-- TMDB Candidates -->
          @if (item.candidates && item.candidates.length > 0) {
            <div class="review-resolve-dialog__section">
              <h4 class="review-resolve-dialog__section-title">
                {{ t('admin.review.resolveDialog.candidates') }}
              </h4>
              <div class="review-resolve-dialog__candidates">
                @for (candidate of item.candidates; track candidate.tmdbId) {
                  <div
                    class="review-resolve-dialog__candidate"
                    [class.review-resolve-dialog__candidate--selected]="isSelected(candidate)"
                    (click)="selectCandidate(candidate)"
                    (keydown.enter)="selectCandidate(candidate)"
                    (keydown.space)="selectCandidate(candidate)"
                    tabindex="0"
                    role="button"
                  >
                    @if (candidate.posterPath) {
                      <img
                        [src]="getPosterUrl(candidate.posterPath)"
                        [alt]="candidate.title"
                        class="review-resolve-dialog__poster"
                      />
                    } @else {
                      <div
                        class="review-resolve-dialog__poster review-resolve-dialog__poster--placeholder"
                      >
                        <i class="pi pi-image"></i>
                      </div>
                    }
                    <div class="review-resolve-dialog__candidate-info">
                      <span class="review-resolve-dialog__candidate-title">{{
                        candidate.title
                      }}</span>
                      @if (candidate.year) {
                        <span class="review-resolve-dialog__candidate-year"
                          >({{ candidate.year }})</span
                        >
                      }
                      <p-tag [value]="candidate.kind" severity="info" />
                      @if (candidate.score !== null) {
                        <span class="review-resolve-dialog__candidate-score">
                          {{ t('admin.review.resolveDialog.score') }}:
                          {{ candidate.score | number: '1.0-2' }}
                        </span>
                      }
                    </div>
                    @if (isSelected(candidate)) {
                      <i class="pi pi-check review-resolve-dialog__check"></i>
                    }
                  </div>
                }
              </div>
            </div>
          } @else {
            <p class="review-resolve-dialog__no-candidates">
              {{ t('admin.review.resolveDialog.noCandidates') }}
            </p>
          }
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button
          [label]="t('admin.review.resolveDialog.assign')"
          icon="pi pi-check"
          [disabled]="!selectedCandidate()"
          (onClick)="onAssign(t)"
        />
        <p-button
          [label]="t('admin.review.resolveDialog.dismiss')"
          icon="pi pi-eye-slash"
          severity="secondary"
          (onClick)="onAction(ReviewResolutionAction.Dismiss, t)"
        />
        <p-button
          [label]="t('admin.review.resolveDialog.delete')"
          icon="pi pi-trash"
          severity="danger"
          (onClick)="onAction(ReviewResolutionAction.Delete, t)"
        />
        <p-button
          [label]="t('admin.review.resolveDialog.reopen')"
          icon="pi pi-refresh"
          severity="contrast"
          (onClick)="onAction(ReviewResolutionAction.Reopen, t)"
        />
      </ng-template>
    </p-dialog>
  `,
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

  readonly ReviewResolutionAction = ReviewResolutionAction;

  ngOnChanges(): void {
    // Reset selection when item changes
    this.selectedCandidate.set(null);
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) {
      this.selectedCandidate.set(null);
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
