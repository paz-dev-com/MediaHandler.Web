import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { HealthStatus } from '@shared/models/health.model';

@Injectable({ providedIn: 'root' })
export class AdminHealthService {
  private readonly api = inject(ApiService);

  readonly health = signal<HealthStatus | null>(null);
  readonly loading = signal<boolean>(false);

  getHealth(): void {
    this.loading.set(true);

    this.api.get<HealthStatus>('health').subscribe({
      next: (response) => {
        this.health.set(response.data ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
