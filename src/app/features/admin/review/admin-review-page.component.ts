import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
import { AdminReviewService } from './admin-review.service';
import { ReviewResolveDialogComponent } from './review-resolve-dialog.component';
import { BatchAssignDialogComponent } from './batch-assign-dialog.component';
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
    LocaleDatePipe,
    FormsModule,
    TranslocoModule,
    TableModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ButtonModule,
    CheckboxModule,
    ReviewResolveDialogComponent,
    BatchAssignDialogComponent,
  ],
  templateUrl: './admin-review-page.component.html',
  styleUrl: './admin-review-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReviewPageComponent implements OnInit {
  private readonly reviewService = inject(AdminReviewService);
  private readonly transloco = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = this.reviewService.items;
  readonly loading = this.reviewService.loading;
  readonly meta = this.reviewService.meta;

  readonly selectedStatusFilter = signal<ReviewStatus | null>(null);
  readonly selectedReasonFilter = signal<ReviewReason | null>(null);
  readonly scanRunIdFilter = signal<string>('');
  readonly fileNameFilter = signal<string>('');
  readonly selectedItem = signal<ReviewItem | null>(null);

  // Batch selection state
  readonly selectedItems = signal<ReviewItem[]>([]);
  readonly isAnySelected = computed(() => this.selectedItems().length > 0);
  readonly isBatchDialogVisible = signal(false);

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
    const sortField = event.sortField as string | undefined;
    const sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
    this.reviewService.getItems(
      this.selectedStatusFilter() ?? undefined,
      this.selectedReasonFilter() ?? undefined,
      this.scanRunIdFilter() || undefined,
      page,
      pageSize,
      sortField || undefined,
      sortField ? sortOrder : undefined,
      this.fileNameFilter() || undefined,
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
      undefined,
      undefined,
      this.fileNameFilter() || undefined,
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
      undefined,
      undefined,
      this.fileNameFilter() || undefined,
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
      undefined,
      undefined,
      this.fileNameFilter() || undefined,
    );
  }

  onFileNameFilterChange(fileName: string): void {
    this.fileNameFilter.set(fileName);
    this.reviewService.getItems(
      this.selectedStatusFilter() ?? undefined,
      this.selectedReasonFilter() ?? undefined,
      this.scanRunIdFilter() || undefined,
      1,
      this.meta().pageSize,
      undefined,
      undefined,
      fileName || undefined,
    );
  }

  onRowSelect(item: ReviewItem): void {
    this.selectedItem.set(item);
  }

  onSelectionChange(items: ReviewItem[]): void {
    this.selectedItems.set(items);
  }

  onSelectAll(checked: boolean): void {
    this.selectedItems.set(checked ? [...this.items()] : []);
  }

  openBatchAssign(): void {
    this.isBatchDialogVisible.set(true);
  }

  onBatchConfirmed(targetMediaId: string): void {
    const ids = this.selectedItems().map((i) => i.id);
    this.reviewService.batchAssign({ reviewItemIds: ids, targetMediaId }).subscribe({
      next: (response) => {
        const results = response.data?.results ?? [];
        const successCount = results.filter((r) => r.success).length;
        const failedCount = results.filter((r) => !r.success).length;
        const summary =
          failedCount > 0
            ? this.transloco.translate('admin.review.batchPartialFail', {
                success: successCount,
                failed: failedCount,
              })
            : this.transloco.translate('admin.review.batchSuccess', { count: successCount });

        this.messageService.add({
          severity: failedCount > 0 ? 'warn' : 'success',
          summary,
          life: 4000,
        });

        this.selectedItems.set([]);
        this.isBatchDialogVisible.set(false);
        this.reviewService.getItems(
          this.selectedStatusFilter() ?? undefined,
          this.selectedReasonFilter() ?? undefined,
          this.scanRunIdFilter() || undefined,
          1,
          this.meta().pageSize,
          undefined,
          undefined,
          this.fileNameFilter() || undefined,
        );
      },
      error: () => {
        this.isBatchDialogVisible.set(false);
      },
    });
  }

  onBatchDismissed(): void {
    this.isBatchDialogVisible.set(false);
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
