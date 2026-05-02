import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
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
  templateUrl: './scan-launcher.component.html',
  styleUrl: './scan-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanLauncherComponent implements OnInit {
  private readonly rootService = inject(AdminLibraryRootService);
  private readonly scanService = inject(AdminScanService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly roots = this.rootService.roots;
  readonly rootsLoading = this.rootService.loading;
  readonly scanLoading = this.scanService.loading;

  readonly selectedRootIds = signal<string[]>([]);
  readonly selectedMode = signal<ScanMode>(ScanMode.Full);

  modeOptions: ScanModeOption[] = [];

  private buildModeOptions(): void {
    this.modeOptions = [
      { label: this.transloco.translate('admin.scanner.modes.Full'), value: ScanMode.Full },
      {
        label: this.transloco.translate('admin.scanner.modes.Incremental'),
        value: ScanMode.Incremental,
      },
    ];
  }

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildModeOptions();
        this.cdr.markForCheck();
      });

    this.rootService.getRoots(1, 100, undefined, true);
  }

  onStartScan(): void {
    const rootIds = this.selectedRootIds();
    if (!rootIds.length) return;
    this.scanService.startScan(rootIds, this.selectedMode());
  }
}
