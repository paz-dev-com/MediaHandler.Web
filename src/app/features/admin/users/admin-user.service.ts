import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly api = inject(ApiService);

  readonly users = signal<AdminUser[]>([]);
  readonly loading = signal<boolean>(false);
  readonly meta = signal<AdminUserMeta>({ page: 1, pageSize: 20, total: 0 });

  private currentPage = 1;
  private currentPageSize = 20;
  private currentSearch: string | undefined;

  getUsers(page: number, pageSize: number, search?: string): void {
    this.currentPage = page;
    this.currentPageSize = pageSize;
    this.currentSearch = search;

    this.loading.set(true);

    const params: Record<string, string | number | boolean | null | undefined> = { page, pageSize };
    if (search) {
      params['search'] = search;
    }

    this.api.get<AdminUser[]>('admin/users', params).subscribe({
      next: (response) => {
        this.users.set(response.data ?? []);
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

  setRole(userId: string, role: string): void {
    this.api.put<void>(`admin/users/${userId}/role`, { role }).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  setActive(userId: string, isActive: boolean): void {
    this.api.put<void>(`admin/users/${userId}/active`, { isActive }).subscribe({
      next: () => this.refresh(),
      error: () => {
        /* handled by error interceptor */
      },
    });
  }

  private refresh(): void {
    this.getUsers(this.currentPage, this.currentPageSize, this.currentSearch);
  }
}
