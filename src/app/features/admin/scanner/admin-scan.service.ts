import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, interval } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '@core/api/api.service';
import { ScanMode, ScanStatus } from '@shared/models/enums';
import { ScanRunDetail, ScanRunSummary } from '@shared/models/admin-scan.model';

export interface ScanHistoryMeta {
  page: number;
  pageSize: number;
  total: number;
}

const TERMINAL_STATES: ScanStatus[] = [
  ScanStatus.Completed,
  ScanStatus.Failed,
  ScanStatus.Cancelled,
];

const ACTIVE_STATES: ScanStatus[] = [ScanStatus.Running, ScanStatus.Pending];

@Injectable({ providedIn: 'root' })
export class AdminScanService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stopPolling$ = new Subject<void>();

  readonly activeScan = signal<ScanRunDetail | null>(null);
  readonly scanHistory = signal<ScanRunSummary[]>([]);
  readonly historyMeta = signal<ScanHistoryMeta>({ page: 1, pageSize: 20, total: 0 });
  readonly loading = signal<boolean>(false);

  startScan(libraryRootIds: string[], mode: ScanMode): void {
    this.loading.set(true);
    this.api.post<ScanRunDetail>('scan/start', { libraryRootIds, mode }).subscribe({
      next: (resp) => {
        this.activeScan.set(resp.data);
        this.loading.set(false);
        if (resp.data && this.isActiveStatus(resp.data.status)) {
          this.beginPolling();
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getActiveScan(): void {
    this.api.get<ScanRunDetail | null>('scan/active').subscribe({
      next: (resp) => {
        this.activeScan.set(resp.data);
        if (resp.data && this.isActiveStatus(resp.data.status)) {
          this.beginPolling();
        }
      },
    });
  }

  cancelScan(id: string): void {
    this.stopPolling$.next();
    this.api.delete<void>(`scan/${id}`).subscribe({
      next: () => {
        this.activeScan.set(null);
        this.getScanHistory(1, 20);
      },
    });
  }

  getScanHistory(page: number, pageSize: number): void {
    this.api.get<ScanRunSummary[]>('scan', { page, pageSize }).subscribe({
      next: (resp) => {
        this.scanHistory.set(resp.data ?? []);
        const meta = resp.meta;
        if (meta) {
          this.historyMeta.set({
            page: meta.page,
            pageSize: meta.pageSize,
            total: meta.totalCount,
          });
        }
      },
    });
  }

  getScanDetail(id: string, includeReview?: boolean): Observable<ScanRunDetail> {
    const params: Record<string, boolean> = {};
    if (includeReview !== undefined) {
      params['includeReview'] = includeReview;
    }
    return this.api
      .get<ScanRunDetail>(`scan/${id}`, Object.keys(params).length ? params : undefined)
      .pipe(map((resp) => resp.data));
  }

  private beginPolling(): void {
    this.stopPolling$.next(); // cancel any existing polling session

    interval(4000)
      .pipe(
        switchMap(() => this.api.get<ScanRunDetail | null>('scan/active')),
        takeUntil(this.stopPolling$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resp) => {
        this.activeScan.set(resp.data);
        const isTerminal = !resp.data || TERMINAL_STATES.includes(resp.data.status);
        if (isTerminal) {
          this.stopPolling$.next();
          this.getScanHistory(1, 20);
        }
      });
  }

  private isActiveStatus(status: ScanStatus): boolean {
    return ACTIVE_STATES.includes(status);
  }
}
