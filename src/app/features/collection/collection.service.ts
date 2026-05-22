import { Injectable, computed, inject, signal } from '@angular/core';
import { CollectionStats } from '@core/api/api-response.model';
import { ApiService } from '@core/api/api.service';
import { MediaType } from '@shared/models/enums';
import { Media } from '@shared/models/media.model';
import { finalize } from 'rxjs';

export interface CollectionFilters {
  search: string;
  type: MediaType | null;
  genre: string | null;
  isWatched: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly api = inject(ApiService);

  readonly media = signal<Media[]>([]);
  /** Stores the 10 most recently added items for the carousel — independent of current page. */
  readonly recentMedia = signal<Media[]>([]);
  readonly stats = signal<CollectionStats | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalCount = signal(0);

  readonly filters = signal<CollectionFilters>({
    search: '',
    type: null,
    genre: null,
    isWatched: null,
  });

  readonly pagination = signal({ page: 1, pageSize: 20 });

  readonly isEmpty = computed(() => !this.loading() && this.media().length === 0);

  loadMedia(): void {
    this.loading.set(true);
    this.error.set(null);

    const { search, type, genre, isWatched } = this.filters();
    const { page, pageSize } = this.pagination();

    this.api
      .get<Media[]>('media', {
        page,
        pageSize,
        search: search || undefined,
        type: type ?? undefined,
        genre: genre ?? undefined,
        isWatched: isWatched ?? undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.media.set(response.data);
          this.totalCount.set(response.meta?.totalCount ?? 0);
          // Keep the cached recently-added list (carousel) based on the first page
          if (page === 1 && this.recentMedia().length === 0) {
            const sorted = [...response.data]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10);
            this.recentMedia.set(sorted);
          }
        },
        error: () => this.error.set('Failed to load media'),
      });
  }

  loadStats(): void {
    this.api.get<CollectionStats>('media/stats').subscribe({
      next: (response) => this.stats.set(response.data),
    });
  }

  /** Loads the 10 most recently added items for the carousel, independent of current page. */
  loadRecentMedia(): void {
    this.api.get<Media[]>('media', { page: 1, pageSize: 10 }).subscribe({
      next: (response) => {
        const sorted = [...(response.data ?? [])]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);
        this.recentMedia.set(sorted);
      },
    });
  }

  updateFilters(partial: Partial<CollectionFilters>): void {
    this.filters.update((f) => ({ ...f, ...partial }));
    this.pagination.update((p) => ({ ...p, page: 1 }));
    this.loadMedia();
  }

  setPage(page: number): void {
    this.pagination.update((p) => ({ ...p, page }));
    this.loadMedia();
  }

  toggleWatched(mediaId: string, isWatched: boolean): void {
    this.api.put(`media/${mediaId}/watched`, { isWatched }).subscribe({
      next: () => {
        this.media.update((items) =>
          items.map((item) =>
            item.id === mediaId
              ? {
                  ...item,
                  userMedia: item.userMedia
                    ? {
                        ...item.userMedia,
                        isWatched,
                        watchedAt: isWatched ? new Date().toISOString() : null,
                      }
                    : {
                        id: '',
                        userId: '',
                        mediaId,
                        isWatched,
                        watchedAt: isWatched ? new Date().toISOString() : null,
                        personalRating: null,
                        notes: null,
                      },
                }
              : item,
          ),
        );
      },
    });
  }
}
