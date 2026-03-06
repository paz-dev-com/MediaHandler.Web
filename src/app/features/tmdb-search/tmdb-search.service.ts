import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { TranslocoService } from '@jsverse/transloco';

export interface TmdbSearchResult {
  tmdbId: number;
  title: string;
  overview: string | null;
  posterPath: string | null;
  releaseDate: string | null;
  mediaType: string;
  voteAverage: number | null;
}

@Injectable({ providedIn: 'root' })
export class TmdbSearchService {
  private readonly api = inject(ApiService);
  private readonly transloco = inject(TranslocoService);

  readonly results = signal<TmdbSearchResult[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly importingIds = signal<Set<number>>(new Set());

  search(query: string): void {
    if (!query.trim()) {
      this.results.set([]);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const language = this.transloco.getActiveLang();
    this.api
      .get<TmdbSearchResult[]>('tmdb/search', { query, language })
      .subscribe({
        next: res => {
          this.results.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('tmdb.searchError');
          this.loading.set(false);
        },
      });
  }

  import(tmdbId: number, mediaType: string): void {
    this.importingIds.update(ids => new Set([...ids, tmdbId]));
    const language = this.transloco.getActiveLang();
    this.api
      .post<void>(`tmdb/import/${tmdbId}`, null, { mediaType, language })
      .subscribe({
        complete: () => {
          this.importingIds.update(ids => {
            const next = new Set(ids);
            next.delete(tmdbId);
            return next;
          });
        },
        error: () => {
          this.importingIds.update(ids => {
            const next = new Set(ids);
            next.delete(tmdbId);
            return next;
          });
        },
      });
  }
}
