import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { AdminLibraryRootService } from '../library-roots/admin-library-root.service';
import { AdminScanService } from './admin-scan.service';
import { ScanMode } from '@shared/models/enums';

interface ScanModeOption {
  label: string;
  value: ScanMode;
}

@Component({
  selector: 'app-scan-launcher',
  standalone: true,
  imports: [FormsModule, TranslocoModule, MultiSelectModule, SelectModule, ButtonModule],
  template: `
    <div class="scan-launcher" *transloco="let t">
      <h3 class="scan-launcher__title">{{ t('admin.scanner.launcherTitle') }}</h3>

      <div class="scan-launcher__controls">
        <p-multiselect
          [options]="roots()"
          [ngModel]="selectedRootIds()"
          optionLabel="path"
          optionValue="id"
          [placeholder]="t('admin.scanner.selectRoots')"
          [loading]="rootsLoading()"
          [style]="{ 'min-width': '20rem' }"
          (ngModelChange)="selectedRootIds.set($event)"
        />

        <p-select
          [options]="modeOptions"
          [ngModel]="selectedMode()"
          optionLabel="label"
          optionValue="value"
          [placeholder]="t('admin.scanner.selectMode')"
          [style]="{ 'min-width': '12rem' }"
          (ngModelChange)="selectedMode.set($event)"
        />

        <p-button
          [label]="t('admin.scanner.startScan')"
          icon="pi pi-play"
          [loading]="scanLoading()"
          [disabled]="!selectedRootIds().length || scanLoading()"
          (onClick)="onStartScan()"
        />
      </div>
    </div>
  `,
  styles: [
    `
      .scan-launcher__title {
        margin: 0 0 1rem;
      }
      .scan-launcher__controls {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanLauncherComponent implements OnInit {
  private readonly rootService = inject(AdminLibraryRootService);
  private readonly scanService = inject(AdminScanService);

  readonly roots = this.rootService.roots;
  readonly rootsLoading = this.rootService.loading;
  readonly scanLoading = this.scanService.loading;

  readonly selectedRootIds = signal<string[]>([]);
  readonly selectedMode = signal<ScanMode>(ScanMode.Full);

  readonly modeOptions: ScanModeOption[] = [
    { label: 'Full', value: ScanMode.Full },
    { label: 'Incremental', value: ScanMode.Incremental },
  ];

  ngOnInit(): void {
    this.rootService.getRoots(1, 100, undefined, true);
  }

  onStartScan(): void {
    const rootIds = this.selectedRootIds();
    if (!rootIds.length) return;
    this.scanService.startScan(rootIds, this.selectedMode());
  }
}
