import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { ScanNasResult } from '@shared/models/scan.model';
import { Observable, map } from 'rxjs';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NasScannerService {
  private readonly api = inject(ApiService);

  readonly scanning = signal(false);
  readonly result = signal<ScanNasResult | null>(null);
  readonly error = signal<string | null>(null);

  getLocations(): Observable<string[]> {
    return this.api.get<string[]>('files/locations').pipe(map((response) => response.data ?? []));
  }

  scan(basePath?: string): void {
    this.error.set(null);
    this.scanning.set(true);

    this.api
      .post<ScanNasResult>('files/scan', {}, basePath ? { basePath } : undefined)
      .pipe(finalize(() => this.scanning.set(false)))
      .subscribe({
        next: (response) => this.result.set(response.data),
        error: () => this.error.set('nasScanner.error'),
      });
  }
}
