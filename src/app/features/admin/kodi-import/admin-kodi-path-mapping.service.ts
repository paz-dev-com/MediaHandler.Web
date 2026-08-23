import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '@core/api/api.service';
import { KodiPathMapping } from '@shared/models/kodi-import.model';

export type KodiPathMappingSaveErrorCode = 'DUPLICATE_MAPPING' | 'VALIDATION_ERROR' | 'UNKNOWN';

const API_URL = 'admin/kodi-import/path-mappings';

@Injectable({ providedIn: 'root' })
export class AdminKodiPathMappingService {
  private readonly api = inject(ApiService);

  readonly mappings = signal<KodiPathMapping[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saveErrorCode = signal<KodiPathMappingSaveErrorCode | null>(null);

  loadMappings(): void {
    this.loading.set(true);
    this.api.get<KodiPathMapping[]>(API_URL).subscribe({
      next: (resp) => {
        this.mappings.set(resp.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  create(
    kodiPrefix: string,
    nasPrefix: string,
    sortOrder?: number | null,
  ): Observable<KodiPathMapping> {
    this.saving.set(true);
    this.saveErrorCode.set(null);

    const body: Record<string, unknown> = { kodiPrefix, nasPrefix };
    if (sortOrder !== undefined && sortOrder !== null) {
      body['sortOrder'] = sortOrder;
    }

    return this.api.post<KodiPathMapping>(API_URL, body).pipe(
      map((resp) => resp.data),
      tap({
        next: () => {
          this.saving.set(false);
          this.loadMappings();
        },
        error: (err: HttpErrorResponse) => this.handleSaveError(err),
      }),
    );
  }

  update(
    id: string,
    kodiPrefix: string,
    nasPrefix: string,
    sortOrder: number,
  ): Observable<KodiPathMapping> {
    this.saving.set(true);
    this.saveErrorCode.set(null);

    return this.api
      .put<KodiPathMapping>(`${API_URL}/${id}`, { kodiPrefix, nasPrefix, sortOrder })
      .pipe(
        map((resp) => resp.data),
        tap({
          next: () => {
            this.saving.set(false);
            this.loadMappings();
          },
          error: (err: HttpErrorResponse) => this.handleSaveError(err),
        }),
      );
  }

  remove(id: string): Observable<object> {
    return this.api.delete<object>(`${API_URL}/${id}`).pipe(
      tap({
        next: () => this.loadMappings(),
      }),
    );
  }

  clearSaveError(): void {
    this.saveErrorCode.set(null);
  }

  private handleSaveError(err: HttpErrorResponse): void {
    this.saving.set(false);
    const code = err.error?.errors?.[0]?.code as string | undefined;
    if (code === 'DUPLICATE_MAPPING') {
      this.saveErrorCode.set('DUPLICATE_MAPPING');
    } else if (err.status === 400 || err.status === 422) {
      this.saveErrorCode.set('VALIDATION_ERROR');
    } else {
      this.saveErrorCode.set('UNKNOWN');
    }
  }
}
