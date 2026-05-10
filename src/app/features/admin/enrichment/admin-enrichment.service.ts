import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import {
  EnrichmentMediaDetail,
  EnrichmentRun,
  EnrichmentSummaryDetail,
} from '@shared/models/enrichment.model';
import { EnrichmentStatus } from '@shared/models/enums';

const TERMINAL_STATES: EnrichmentStatus[] = [EnrichmentStatus.Completed, EnrichmentStatus.Failed];

export interface EnrichmentHistoryMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminEnrichmentService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly enrichmentStatus = signal<EnrichmentRun | null>(null);
  readonly summary = signal<EnrichmentSummaryDetail | null>(null);
  readonly enrichmentHistory = signal<EnrichmentRun[]>([]);
  readonly historyMeta = signal<EnrichmentHistoryMeta>({ page: 1, pageSize: 20, total: 0 });
  readonly loading = signal(false);
  readonly historyLoading = signal(false);
  readonly runDetails = signal<EnrichmentMediaDetail[]>([]);
  readonly runDetailsLoading = signal(false);

  private readonly stopPolling$ = new Subject<void>();

  startEnrichment(): void {
    this.loading.set(true);
    this.api.post<EnrichmentRun>('admin/enrichment/start', null).subscribe({
      next: (response) => {
        this.enrichmentStatus.set(response.data);
        this.loading.set(false);
        this.startPolling();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getStatus(): Observable<EnrichmentRun> {
    return this.api.get<EnrichmentRun>('admin/enrichment/status').pipe(
      map((response) => response.data),
      tap((run) => {
        if (run) {
          this.enrichmentStatus.set(run);
        }
      }),
    );
  }

  getSummary(): void {
    this.api.get<EnrichmentSummaryDetail>('admin/enrichment/summary').subscribe({
      next: (response) => {
        this.summary.set(response.data);
      },
    });
  }

  getHistory(page = 1, pageSize = 20): void {
    this.historyLoading.set(true);
    this.api.get<EnrichmentRun[]>('admin/enrichment/history', { page, pageSize }).subscribe({
      next: (response) => {
        this.enrichmentHistory.set(response.data ?? []);
        const apiMeta = response.meta as PaginationMeta | null;
        if (apiMeta) {
          this.historyMeta.set({
            page: apiMeta.page,
            pageSize: apiMeta.pageSize,
            total: apiMeta.totalCount,
          });
        }
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
      },
    });
  }

  getRunDetails(runId: string): void {
    this.runDetailsLoading.set(true);
    this.runDetails.set([]);
    this.api.get<EnrichmentMediaDetail[]>(`admin/enrichment/${runId}/details`).subscribe({
      next: (response) => {
        this.runDetails.set(response.data ?? []);
        this.runDetailsLoading.set(false);
      },
      error: () => {
        this.runDetailsLoading.set(false);
      },
    });
  }

  private startPolling(): void {
    this.stopPolling$.next();

    interval(4000)
      .pipe(
        switchMap(() => this.getStatus()),
        takeUntilDestroyed(this.destroyRef),
        takeUntil(this.stopPolling$),
      )
      .subscribe((run) => {
        if (run && TERMINAL_STATES.includes(run.status)) {
          this.stopPolling$.next();
          // Refresh history when enrichment completes
          this.getHistory();
        }
      });
  }
}
