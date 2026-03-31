import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ScanNasResult } from '@shared/models/scan.model';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-scan-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CardModule],
  template: `
    <div class="scan-results">
      <h2>{{ 'nasScanner.results.title' | transloco }}</h2>
      <div class="scan-results__grid">
        <p-card styleClass="scan-results__card scan-results__card--folders">
          <div class="scan-results__stat">
            <i class="pi pi-folder-open scan-results__icon"></i>
            <span class="scan-results__value">{{ result().foldersFound }}</span>
            <span class="scan-results__label">{{
              'nasScanner.results.foldersFound' | transloco
            }}</span>
          </div>
        </p-card>
        <p-card styleClass="scan-results__card scan-results__card--new">
          <div class="scan-results__stat">
            <i class="pi pi-file-plus scan-results__icon"></i>
            <span class="scan-results__value">{{ result().newFiles }}</span>
            <span class="scan-results__label">{{ 'nasScanner.results.newFiles' | transloco }}</span>
          </div>
        </p-card>
        <p-card styleClass="scan-results__card">
          <div class="scan-results__stat">
            <i class="pi pi-check-circle scan-results__icon"></i>
            <span class="scan-results__value">{{ result().existingFiles }}</span>
            <span class="scan-results__label">{{
              'nasScanner.results.existingFiles' | transloco
            }}</span>
          </div>
        </p-card>
        <p-card styleClass="scan-results__card">
          <div class="scan-results__stat">
            <i class="pi pi-chart-bar scan-results__icon"></i>
            <span class="scan-results__value">{{ result().totalScanned }}</span>
            <span class="scan-results__label">{{
              'nasScanner.results.totalScanned' | transloco
            }}</span>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [
    `
      .scan-results {
        &__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        &__stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0;
        }
        &__icon {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
          color: var(--text-color-secondary);
        }
        &__value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--primary-color);
        }
        &__card--folders .scan-results__value,
        &__card--folders .scan-results__icon {
          color: var(--blue-500);
        }
        &__card--new .scan-results__value,
        &__card--new .scan-results__icon {
          color: var(--green-600);
        }
        &__label {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          text-align: center;
        }
      }
    `,
  ],
})
export class ScanResultsComponent {
  readonly result = input.required<ScanNasResult>();
}
