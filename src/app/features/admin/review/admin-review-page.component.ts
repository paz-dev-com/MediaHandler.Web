import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminReviewService } from './admin-review.service';
import { ReviewResolveDialogComponent } from './review-resolve-dialog.component';
import { ReviewItem } from '@shared/models/review.model';
import { ReviewReason, ReviewStatus } from '@shared/models/enums';

interface StatusFilterOption {
  label: string;
  value: ReviewStatus | null;
}

interface ReasonFilterOption {
  label: string;
  value: ReviewReason | null;
}

@Component({
  selector: 'app-admin-review-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    TableModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ButtonModule,
    ReviewResolveDialogComponent,
  ],
  templateUrl: './admin-review-page.component.html',
  styleUrl: './admin-review-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReviewPageComponent implements OnInit {
  private readonly reviewService = inject(AdminReviewService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = this.reviewService.items;
  readonly loading = this.reviewService.loading;
  readonly meta = this.reviewService.meta;

  readonly selectedStatusFilter = signal<ReviewStatus | null>(null);
  readonly selectedReasonFilter = signal<ReviewReason | null>(null);
  readonly scanRunIdFilter = signal<string>('');
  readonly selectedItem = signal<ReviewItem | null>(null);

  statusFilterOptions: StatusFilterOption[] = [];
  reasonFilterOptions: ReasonFilterOption[] = [];

  private buildFilterOptions(): void {
    this.statusFilterOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      { label: this.transloco.translate('admin.review.status.Open'), value: ReviewStatus.Open },
      {
        label: this.transloco.translate('admin.review.status.Resolved'),
        value: ReviewStatus.Resolved,
      },
      {
        label: this.transloco.translate('admin.review.status.Dismissed'),
        value: ReviewStatus.Dismissed,
      },
    ];
    this.reasonFilterOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      {
        label: this.transloco.translate('admin.review.reason.NoTmdbResult'),
        value: ReviewReason.NoTmdbResult,
      },
      {
        label: this.transloco.translate('admin.review.reason.MultipleCandidates'),
        value: ReviewReason.MultipleCandidates,
      },
      {
        label: this.transloco.translate('admin.review.reason.YearMismatch'),
        value: ReviewReason.YearMismatch,
      },
      {
        label: this.transloco.translate('admin.review.reason.UnparseableEpisode'),
        value: ReviewReason.UnparseableEpisode,
      },
      {
        label: this.transloco.translate('admin.review.reason.NfoMalformed'),
        value: ReviewReason.NfoMalformed,
      },
      {
        label: this.transloco.translate('admin.review.reason.UnknownFormat'),
        value: ReviewReason.UnknownFormat,
      },
      {
        label: this.transloco.translate('admin.review.reason.OrphanedAfterMissing'),
        value: ReviewReason.OrphanedAfterMissing,
      },
    ];
  }

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildFilterOptions();
        this.cdr.markForCheck();
      });

    this.reviewService.getItems(undefined, undefined, undefined, 1, 20);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.reviewService.getItems(
      this.selectedStatusFilter() ?? undefined,
      this.selectedReasonFilter() ?? undefined,
      this.scanRunIdFilter() || undefined,
      page,
      pageSize,
    );
  }

  onStatusFilterChange(status: ReviewStatus | null): void {
    this.selectedStatusFilter.set(status);
    this.reviewService.getItems(
      status ?? undefined,
      this.selectedReasonFilter() ?? undefined,
      this.scanRunIdFilter() || undefined,
      1,
      this.meta().pageSize,
    );
  }

  onReasonFilterChange(reason: ReviewReason | null): void {
    this.selectedReasonFilter.set(reason);
    this.reviewService.getItems(
      this.selectedStatusFilter() ?? undefined,
      reason ?? undefined,
      this.scanRunIdFilter() || undefined,
      1,
      this.meta().pageSize,
    );
  }

  onScanRunIdFilterChange(scanRunId: string): void {
    this.scanRunIdFilter.set(scanRunId);
    this.reviewService.getItems(
      this.selectedStatusFilter() ?? undefined,
      this.selectedReasonFilter() ?? undefined,
      scanRunId || undefined,
      1,
      this.meta().pageSize,
    );
  }

  onRowSelect(item: ReviewItem): void {
    this.selectedItem.set(item);
  }

  onDialogResolved(): void {
    this.selectedItem.set(null);
  }

  onDialogClosed(): void {
    this.selectedItem.set(null);
  }

  getStatusSeverity(
    status: ReviewStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case ReviewStatus.Open:
        return 'warn';
      case ReviewStatus.Resolved:
        return 'success';
      case ReviewStatus.Dismissed:
        return 'secondary';
      default:
        return 'info';
    }
  }

  getReasonSeverity(
    _reason: ReviewReason,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    return 'info';
  }
}
