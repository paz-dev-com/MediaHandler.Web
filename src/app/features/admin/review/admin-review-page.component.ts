import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
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

  readonly items = this.reviewService.items;
  readonly loading = this.reviewService.loading;
  readonly meta = this.reviewService.meta;

  readonly selectedStatusFilter = signal<ReviewStatus | null>(null);
  readonly selectedReasonFilter = signal<ReviewReason | null>(null);
  readonly scanRunIdFilter = signal<string>('');
  readonly selectedItem = signal<ReviewItem | null>(null);

  readonly statusFilterOptions: StatusFilterOption[] = [
    { label: 'All', value: null },
    { label: 'Open', value: ReviewStatus.Open },
    { label: 'Resolved', value: ReviewStatus.Resolved },
    { label: 'Dismissed', value: ReviewStatus.Dismissed },
  ];

  readonly reasonFilterOptions: ReasonFilterOption[] = [
    { label: 'All', value: null },
    { label: 'No TMDB Result', value: ReviewReason.NoTmdbResult },
    { label: 'Multiple Candidates', value: ReviewReason.MultipleCandidates },
    { label: 'Year Mismatch', value: ReviewReason.YearMismatch },
    { label: 'Unparseable Episode', value: ReviewReason.UnparseableEpisode },
    { label: 'NFO Malformed', value: ReviewReason.NfoMalformed },
    { label: 'Unknown Format', value: ReviewReason.UnknownFormat },
    { label: 'Orphaned After Missing', value: ReviewReason.OrphanedAfterMissing },
  ];

  ngOnInit(): void {
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
