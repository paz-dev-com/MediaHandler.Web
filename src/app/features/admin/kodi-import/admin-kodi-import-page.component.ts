import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { KodiImportLauncherComponent } from './kodi-import-launcher.component';
import { KodiImportStatusComponent } from './kodi-import-status.component';
import { KodiImportHistoryTableComponent } from './kodi-import-history-table.component';
import { KodiImportMappingsComponent } from './kodi-import-mappings.component';

@Component({
  selector: 'app-admin-kodi-import-page',
  standalone: true,
  imports: [
    TranslocoModule,
    KodiImportLauncherComponent,
    KodiImportStatusComponent,
    KodiImportHistoryTableComponent,
    KodiImportMappingsComponent,
  ],
  templateUrl: './admin-kodi-import-page.component.html',
  styleUrl: './admin-kodi-import-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminKodiImportPageComponent implements OnInit {
  private readonly importService = inject(AdminKodiImportService);

  readonly activeRun = this.importService.activeRun;
  readonly isRunActive = this.importService.isRunActive;

  ngOnInit(): void {
    this.importService.getActiveRun();
  }
}
