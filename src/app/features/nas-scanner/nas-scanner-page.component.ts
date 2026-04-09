import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { NasScannerService } from './nas-scanner.service';
import { ScanResultsComponent } from './scan-results.component';
import { ImportResultsComponent } from './import-results.component';

@Component({
  selector: 'app-nas-scanner-page',
  templateUrl: './nas-scanner-page.component.html',
  styleUrl: './nas-scanner-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    ProgressSpinnerModule,
    TooltipModule,
    ScanResultsComponent,
    ImportResultsComponent,
  ],
})
export class NasScannerPageComponent implements OnInit {
  readonly service = inject(NasScannerService);
  readonly basePath = signal('');
  readonly locations = signal<string[]>([]);

  ngOnInit(): void {
    this.service.getLocations().subscribe({
      next: (paths) => this.locations.set(paths),
      error: () => {
        /* locations not critical, silently ignore */
      },
    });
  }

  selectLocation(path: string): void {
    this.basePath.set(path);
  }

  triggerScan(): void {
    this.service.scan(this.basePath() || undefined);
  }

  triggerScanAndImport(): void {
    this.service.scanAndImport(this.basePath() || undefined);
  }

  triggerAutoImport(): void {
    this.service.autoImport();
  }
}
