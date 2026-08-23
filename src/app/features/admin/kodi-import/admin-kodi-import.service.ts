import { DestroyRef, Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, interval, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';

const POLL_INTERVAL_MS = 4000;
const ELAPSED_INTERVAL_MS = 1000;
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import { ImportItemOutcome, ImportRun, ImportRunDetail } from '@shared/models/kodi-import.model';
import {
  ImportItemStatus,
  ImportRunStatus,
  KodiImportMode,
  KodiItemKind,
} from '@shared/models/enums';

export interface ImportHistoryMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ImportItemsMeta {
  page: number;
  pageSize: number;
  total: number;
}

const API_URL = 'admin/kodi-import';
const TERMINAL_STATES: ImportRunStatus[] = [ImportRunStatus.Completed, ImportRunStatus.Failed];
const ACTIVE_STATES: ImportRunStatus[] = [ImportRunStatus.Pending, ImportRunStatus.Running];

@Injectable({ providedIn: 'root' })
export class AdminKodiImportService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stopPolling$ = new Subject<void>();
  private readonly stopReportPolling$ = new Subject<void>();

  readonly activeRun = signal<ImportRun | null>(null);
  readonly history = signal<ImportRun[]>([]);
  readonly historyMeta = signal<ImportHistoryMeta>({ page: 1, pageSize: 20, total: 0 });
  readonly historyLoading = signal(false);
  readonly historyError = signal(false);

  readonly uploading = signal(false);
  readonly uploadErrorCode = signal<string | null>(null);
  readonly uploadErrorMessage = signal<string | null>(null);

  readonly pollingError = signal(false);

  readonly report = signal<ImportRunDetail | null>(null);
  readonly reportLoading = signal(false);
  readonly reportNotFound = signal(false);
  readonly reportError = signal(false);

  readonly items = signal<ImportItemOutcome[]>([]);
  readonly itemsMeta = signal<ImportItemsMeta>({ page: 1, pageSize: 50, total: 0 });
  readonly itemsLoading = signal(false);
  readonly itemsError = signal(false);

  readonly isRunActive = computed(() => {
    const run = this.activeRun();
    return run !== null && ACTIVE_STATES.includes(run.status);
  });

  readonly elapsedSeconds = signal(0);

  constructor() {
    interval(ELAPSED_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateElapsedSeconds());
  }

  private currentHistoryPage = 1;
  private currentHistoryPageSize = 20;

  private currentItemsRunId = '';
  private currentItemsOutcome: ImportItemStatus | undefined;
  private currentItemsKind: KodiItemKind | undefined;
  private currentItemsPage = 1;
  private currentItemsPageSize = 50;

  uploadDatabase(file: File, mode: KodiImportMode): void {
    if (this.uploading()) return;

    this.uploading.set(true);
    this.uploadErrorCode.set(null);
    this.uploadErrorMessage.set(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode.toLowerCase());

    this.api.upload<ImportRun>(API_URL, formData).subscribe({
      next: (resp) => {
        this.activeRun.set(resp.data);
        this.uploading.set(false);
        if (resp.data && ACTIVE_STATES.includes(resp.data.status)) {
          this.beginPolling();
        } else if (resp.data && TERMINAL_STATES.includes(resp.data.status)) {
          this.getHistory(this.currentHistoryPage, this.currentHistoryPageSize);
        }
      },
      error: (err: HttpErrorResponse) => this.handleUploadError(err),
    });
  }

  clearUploadError(): void {
    this.uploadErrorCode.set(null);
    this.uploadErrorMessage.set(null);
  }

  getActiveRun(): void {
    this.api.get<ImportRun | null>(`${API_URL}/active`).subscribe({
      next: (resp) => {
        this.activeRun.set(resp.data);
        if (resp.data && ACTIVE_STATES.includes(resp.data.status)) {
          this.beginPolling();
        }
      },
    });
  }

  getHistory(page: number, pageSize: number): void {
    this.currentHistoryPage = page;
    this.currentHistoryPageSize = pageSize;
    this.historyLoading.set(true);
    this.historyError.set(false);

    this.api.get<ImportRun[]>(API_URL, { page, pageSize }).subscribe({
      next: (resp) => {
        this.history.set(resp.data ?? []);
        const meta = resp.meta as PaginationMeta | null;
        if (meta) {
          this.historyMeta.set({
            page: meta.page,
            pageSize: meta.pageSize,
            total: meta.totalCount,
          });
        }
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyLoading.set(false);
        this.historyError.set(true);
      },
    });
  }

  getRunDetail(id: string): Observable<ImportRunDetail | null> {
    this.reportLoading.set(true);
    this.reportNotFound.set(false);
    this.reportError.set(false);

    return this.api.get<ImportRunDetail>(`${API_URL}/${id}`).pipe(
      tap({
        next: (resp) => {
          this.report.set(resp.data);
          this.reportLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.reportLoading.set(false);
          if (err.status === 404) {
            this.reportNotFound.set(true);
          } else {
            this.reportError.set(true);
          }
        },
      }),
      map((resp) => resp.data),
      catchError(() => of(null)),
    );
  }

  getItems(
    runId: string,
    outcome?: ImportItemStatus,
    kind?: KodiItemKind,
    page = 1,
    pageSize = 50,
  ): void {
    this.currentItemsRunId = runId;
    this.currentItemsOutcome = outcome;
    this.currentItemsKind = kind;
    this.currentItemsPage = page;
    this.currentItemsPageSize = pageSize;

    this.itemsLoading.set(true);
    this.itemsError.set(false);

    const params: Record<string, string | number | null | undefined> = { page, pageSize };
    if (outcome !== undefined) params['outcome'] = outcome;
    if (kind !== undefined) params['kind'] = kind;

    this.api.get<ImportItemOutcome[]>(`${API_URL}/${runId}/items`, params).subscribe({
      next: (resp) => {
        this.items.set(resp.data ?? []);
        const meta = resp.meta as PaginationMeta | null;
        if (meta) {
          this.itemsMeta.set({
            page: meta.page,
            pageSize: meta.pageSize,
            total: meta.totalCount,
          });
        }
        this.itemsLoading.set(false);
      },
      error: () => {
        this.itemsLoading.set(false);
        this.itemsError.set(true);
      },
    });
  }

  beginReportPolling(runId: string): void {
    if (!runId) return;
    this.stopReportPolling$.next();

    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() =>
          this.api.get<ImportRunDetail>(`${API_URL}/${runId}`).pipe(catchError(() => of(null))),
        ),
        takeUntil(this.stopReportPolling$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resp) => {
        if (!resp) return;
        this.report.set(resp.data);
        if (!resp.data || TERMINAL_STATES.includes(resp.data.status)) {
          this.stopReportPolling$.next();
          this.getItems(
            runId,
            this.currentItemsOutcome,
            this.currentItemsKind,
            1,
            this.currentItemsPageSize,
          );
          this.getHistory(this.currentHistoryPage, this.currentHistoryPageSize);
        }
      });
  }

  private beginPolling(): void {
    this.stopPolling$.next();

    interval(POLL_INTERVAL_MS)
      .pipe(
        switchMap(() =>
          this.api.get<ImportRun | null>(`${API_URL}/active`).pipe(catchError(() => of(null))),
        ),
        takeUntil(this.stopPolling$),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resp) => {
        if (resp === null) {
          this.pollingError.set(true);
          return;
        }

        this.pollingError.set(false);
        this.activeRun.set(resp.data);
        const isTerminal = !resp.data || TERMINAL_STATES.includes(resp.data.status);
        if (isTerminal) {
          this.stopPolling$.next();
          this.getHistory(this.currentHistoryPage, this.currentHistoryPageSize);
        }
      });
  }

  private updateElapsedSeconds(): void {
    const run = this.activeRun();
    if (run && ACTIVE_STATES.includes(run.status) && run.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000);
      this.elapsedSeconds.set(Math.max(0, elapsed));
    } else {
      this.elapsedSeconds.set(0);
    }
  }

  private handleUploadError(err: HttpErrorResponse): void {
    this.uploading.set(false);
    const apiError = err.error?.errors?.[0];
    this.uploadErrorCode.set(apiError?.code ?? 'UNKNOWN');
    this.uploadErrorMessage.set(apiError?.message ?? err.message ?? 'Unknown error');
  }
}
