import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import { LibraryRoot } from '@shared/models/library-root.model';
import { LibraryRootKind } from '@shared/models/enums';

export interface LibraryRootMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminLibraryRootService {
  private readonly api = inject(ApiService);

  readonly roots = signal<LibraryRoot[]>([]);
  readonly loading = signal<boolean>(false);
  readonly meta = signal<LibraryRootMeta>({ page: 1, pageSize: 20, total: 0 });

  private currentPage = 1;
  private currentPageSize = 20;
  private currentKind: LibraryRootKind | undefined;
  private currentEnabledOnly: boolean | undefined;

  getRoots(page: number, pageSize: number, kind?: LibraryRootKind, enabledOnly?: boolean): void {
    this.currentPage = page;
    this.currentPageSize = pageSize;
    this.currentKind = kind;
    this.currentEnabledOnly = enabledOnly;

    this.loading.set(true);

    const params: Record<string, string | number | boolean | null | undefined> = {
      page,
      pageSize,
    };
    if (kind !== undefined) {
      params['kind'] = kind;
    }
    if (enabledOnly !== undefined) {
      params['enabledOnly'] = enabledOnly;
    }

    this.api.get<LibraryRoot[]>('admin/library-roots', params).subscribe({
      next: (response) => {
        this.roots.set(response.data ?? []);
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

  addRoot(path: string, kind: LibraryRootKind, label?: string): void {
    const body: Record<string, unknown> = { path, kind };
    if (label !== undefined) {
      body['label'] = label;
    }

    this.api.post<LibraryRoot>('admin/library-roots', body).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  removeRoot(id: string): void {
    this.api.delete<void>(`admin/library-roots/${id}`).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  setEnabled(id: string, isEnabled: boolean): void {
    this.api.put<void>(`admin/library-roots/${id}/enabled`, { isEnabled }).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  private refresh(): void {
    this.getRoots(
      this.currentPage,
      this.currentPageSize,
      this.currentKind,
      this.currentEnabledOnly,
    );
  }
}
