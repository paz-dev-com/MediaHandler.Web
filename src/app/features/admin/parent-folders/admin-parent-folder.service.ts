import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import { ParentFolderGroup, ParentFolderStatus } from '@shared/models/parent-folder.model';

export interface ParentFolderMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminParentFolderService {
  private readonly api = inject(ApiService);
  private readonly messageService = inject(MessageService);

  readonly folders = signal<ParentFolderGroup[]>([]);
  readonly loading = signal<boolean>(false);
  readonly meta = signal<ParentFolderMeta>({ page: 1, pageSize: 20, total: 0 });

  private currentPage = 1;
  private currentPageSize = 20;
  private currentStatus: ParentFolderStatus | undefined;

  getFolders(page = 1, pageSize = 20, status?: ParentFolderStatus): void {
    this.currentPage = page;
    this.currentPageSize = pageSize;
    this.currentStatus = status;

    this.loading.set(true);

    const params: Record<string, string | number | null | undefined> = { page, pageSize };
    if (status !== undefined) {
      params['status'] = status;
    }

    this.api.get<ParentFolderGroup[]>('admin/parent-folders', params).subscribe({
      next: (response) => {
        this.folders.set(response.data ?? []);
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

  assignFolder(folderId: string, tmdbId: number, kind: string): void {
    this.api
      .put<ParentFolderGroup>(`admin/parent-folders/${folderId}/assign`, { tmdbId, kind })
      .subscribe({
        next: (response) => {
          const folderName = response.data?.folderPath?.split('/').pop() ?? folderId;
          this.messageService.add({
            severity: 'success',
            summary: `TMDB assigned successfully to ${folderName}`,
            life: 3000,
          });
          this.refresh();
        },
        error: () => {
          /* handled by error interceptor */
        },
      });
  }

  private refresh(): void {
    this.getFolders(this.currentPage, this.currentPageSize, this.currentStatus);
  }
}
