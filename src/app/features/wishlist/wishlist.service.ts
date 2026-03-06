import { Injectable, inject, signal } from '@angular/core';
import { PaginationMeta } from '@core/api/api-response.model';
import { ApiService } from '@core/api/api.service';
import { WishlistItem } from '@shared/models/wishlist.model';

export interface AddWishlistItemRequest {
  tmdbId: number;
  title: string;
  posterPath?: string;
  releaseDate?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);

  readonly items = signal<WishlistItem[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly addingIds = signal<Set<number>>(new Set());

  loadItems(page = 1, pageSize = 20): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get<WishlistItem[]>('wishlist', { page, pageSize })
      .subscribe({
        next: res => {
          this.items.set(res.data);
          this.pagination.set(res.meta ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('wishlist.loadError');
          this.loading.set(false);
        },
      });
  }

  addItem(request: AddWishlistItemRequest): void {
    this.addingIds.update(ids => new Set([...ids, request.tmdbId]));
    this.api.post<WishlistItem>('wishlist', request).subscribe({
      next: res => {
        this.items.update(list => [res.data, ...list]);
        this.addingIds.update(ids => {
          const next = new Set(ids);
          next.delete(request.tmdbId);
          return next;
        });
      },
      error: () => {
        this.addingIds.update(ids => {
          const next = new Set(ids);
          next.delete(request.tmdbId);
          return next;
        });
      },
    });
  }

  markAcquired(id: string, isAcquired: boolean): void {
    this.api
      .put<WishlistItem>(`wishlist/${id}/acquired`, { isAcquired })
      .subscribe({
        next: res => {
          this.items.update(list =>
            list.map(item => (item.id === id ? res.data : item))
          );
        },
      });
  }

  removeItem(id: string): void {
    this.api.delete<null>(`wishlist/${id}`).subscribe({
      next: () => {
        this.items.update(list => list.filter(item => item.id !== id));
        if (this.pagination()) {
          this.pagination.update(p =>
            p ? { ...p, totalCount: p.totalCount - 1 } : p
          );
        }
      },
    });
  }
}
