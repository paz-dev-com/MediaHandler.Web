import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import { ReviewItem } from '@shared/models/review.model';
import {
  MediaType,
  ReviewReason,
  ReviewResolutionAction,
  ReviewStatus,
} from '@shared/models/enums';

export interface ReviewMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminReviewService {
  private readonly api = inject(ApiService);

  readonly items = signal<ReviewItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly meta = signal<ReviewMeta>({ page: 1, pageSize: 20, total: 0 });

  private currentStatus: ReviewStatus | undefined;
  private currentReason: ReviewReason | undefined;
  private currentScanRunId: string | undefined;
  private currentPage = 1;
  private currentPageSize = 20;

  getItems(
    status?: ReviewStatus,
    reason?: ReviewReason,
    scanRunId?: string,
    page = 1,
    pageSize = 20,
  ): void {
    this.currentStatus = status;
    this.currentReason = reason;
    this.currentScanRunId = scanRunId;
    this.currentPage = page;
    this.currentPageSize = pageSize;

    this.loading.set(true);

    const params: Record<string, string | number | boolean | null | undefined> = { page, pageSize };
    if (status !== undefined) {
      params['status'] = status;
    }
    if (reason !== undefined) {
      params['reason'] = reason;
    }
    if (scanRunId !== undefined) {
      params['scanRunId'] = scanRunId;
    }

    this.api.get<ReviewItem[]>('admin/review-items', params).subscribe({
      next: (response) => {
        this.items.set(response.data ?? []);
        const apiMeta = response.meta as PaginationMeta | null;
        if (apiMeta) {
          this.meta.set({
            page: apiMeta.page,
            pageSize: apiMeta.pageSize,
            total: apiMeta.totalCount,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  resolveItem(id: string, action: ReviewResolutionAction, tmdbId?: number, kind?: MediaType): void {
    const body: Record<string, unknown> = { action };
    if (tmdbId !== undefined) {
      body['tmdbId'] = tmdbId;
    }
    if (kind !== undefined) {
      body['kind'] = kind;
    }

    this.api.post<ReviewItem>(`admin/review-items/${id}/resolve`, body).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  private refresh(): void {
    this.getItems(
      this.currentStatus,
      this.currentReason,
      this.currentScanRunId,
      this.currentPage,
      this.currentPageSize,
    );
  }
}
