import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AdminKodiPathMappingService } from './admin-kodi-path-mapping.service';
import { KodiMappingDialogComponent } from './kodi-mapping-dialog.component';
import { KodiPathMapping } from '@shared/models/kodi-import.model';

@Component({
  selector: 'app-kodi-import-mappings',
  standalone: true,
  imports: [
    TranslocoModule,
    ButtonModule,
    ConfirmDialogModule,
    TableModule,
    TooltipModule,
    KodiMappingDialogComponent,
  ],
  templateUrl: './kodi-import-mappings.component.html',
  styleUrl: './kodi-import-mappings.component.scss',
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiImportMappingsComponent implements OnInit {
  @ViewChild(KodiMappingDialogComponent) mappingDialog!: KodiMappingDialogComponent;

  private readonly mappingService = inject(AdminKodiPathMappingService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);

  readonly mappings = this.mappingService.mappings;
  readonly loading = this.mappingService.loading;

  ngOnInit(): void {
    this.mappingService.loadMappings();
  }

  onAdd(): void {
    this.mappingDialog.open();
  }

  onEdit(mapping: KodiPathMapping): void {
    this.mappingDialog.openForEdit(mapping);
  }

  onMappingSaved(): void {
    // List is refreshed by the mapping service; toast is shown by the dialog.
  }

  onRemove(mapping: KodiPathMapping): void {
    this.confirmationService.confirm({
      message: this.transloco.translate('admin.kodiImport.mappings.removeConfirm', {
        kodiPrefix: mapping.kodiPrefix,
        nasPrefix: mapping.nasPrefix,
      }),
      header: this.transloco.translate('admin.kodiImport.mappings.removeTitle'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.mappingService.remove(mapping.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.transloco.translate('admin.kodiImport.mappings.removed'),
              life: 3000,
            });
          },
        });
      },
    });
  }
}
