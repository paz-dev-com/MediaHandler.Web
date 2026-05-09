import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from '@core/api/api.service';
import { EnrichmentRun, EnrichmentSummary } from '@shared/models/enrichment.model';
import { EnrichmentStatus } from '@shared/models/enums';

const TERMINAL_STATES: EnrichmentStatus[] = [EnrichmentStatus.Completed, EnrichmentStatus.Failed];

@Injectable({ providedIn: 'root' })
export class AdminEnrichmentService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly enrichmentStatus = signal<EnrichmentRun | null>(null);
  readonly summary = signal<EnrichmentSummary | null>(null);
  readonly loading = signal(false);

  private readonly stopPolling$ = new Subject<void>();

  startEnrichment(): void {
    this.loading.set(true);
    this.api.post<EnrichmentRun>('enrichment/start', null).subscribe({
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
    return this.api.get<EnrichmentRun>('enrichment/status').pipe(
      map((response) => response.data),
      tap((run) => {
        if (run) {
          this.enrichmentStatus.set(run);
        }
      }),
    );
  }

  getSummary(): void {
    this.api.get<EnrichmentSummary>('enrichment/summary').subscribe({
      next: (response) => {
        this.summary.set(response.data);
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
        }
      });
  }
}
