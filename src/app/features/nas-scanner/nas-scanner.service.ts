import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { AutoImportResult, ScanAndImportNasResult, ScanNasResult } from '@shared/models/scan.model';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, map } from 'rxjs';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NasScannerService {
  private readonly api = inject(ApiService);
  private readonly transloco = inject(TranslocoService);

  readonly loading = signal(false);
  readonly scanResult = signal<ScanNasResult | null>(null);
  readonly error = signal<string | null>(null);
  readonly scanAndImportResult = signal<ScanAndImportNasResult | null>(null);
  readonly autoImportResult = signal<AutoImportResult | null>(null);

  getLocations(): Observable<string[]> {
    return this.api.get<string[]>('files/locations').pipe(map((response) => response.data ?? []));
  }

  scan(basePath?: string): void {
    this.error.set(null);
    this.loading.set(true);

    this.api
      .post<ScanNasResult>('files/scan', {}, basePath ? { basePath } : undefined)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.scanResult.set(response.data),
        error: () => this.error.set('nasScanner.error'),
      });
  }

  scanAndImport(basePath?: string): void {
    this.error.set(null);
    this.loading.set(true);
    const language = this.transloco.getActiveLang();

    this.api
      .post<ScanAndImportNasResult>(
        'files/scan-and-import',
        {},
        { language, ...(basePath ? { basePath } : {}) }
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.scanAndImportResult.set(response.data),
        error: () => this.error.set('nasScanner.scanAndImport.error'),
      });
  }
}
