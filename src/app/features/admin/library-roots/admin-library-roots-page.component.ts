import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DatePipe } from '@angular/common';
import { AdminLibraryRootService } from './admin-library-root.service';
import { AddLibraryRootDialogComponent } from './add-library-root-dialog.component';
import { LibraryRoot } from '@shared/models/library-root.model';
import { LibraryRootKind } from '@shared/models/enums';

interface KindFilterOption {
  label: string;
  value: LibraryRootKind | null;
}

interface EnabledFilterOption {
  label: string;
  value: boolean | null;
}

@Component({
  selector: 'app-admin-library-roots-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    TableModule,
    SelectModule,
    TagModule,
    ToggleSwitchModule,
    ButtonModule,
    ConfirmDialogModule,
    AddLibraryRootDialogComponent,
  ],
  templateUrl: './admin-library-roots-page.component.html',
  styleUrl: './admin-library-roots-page.component.scss',
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLibraryRootsPageComponent implements OnInit {
  @ViewChild(AddLibraryRootDialogComponent) addDialog!: AddLibraryRootDialogComponent;

  private readonly rootService = inject(AdminLibraryRootService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly transloco = inject(TranslocoService);

  readonly roots = this.rootService.roots;
  readonly loading = this.rootService.loading;
  readonly meta = this.rootService.meta;

  readonly selectedKindFilter = signal<LibraryRootKind | null>(null);
  readonly selectedEnabledFilter = signal<boolean | null>(null);

  readonly kindFilterOptions: KindFilterOption[] = [
    { label: 'All', value: null },
    { label: 'Movies', value: LibraryRootKind.Movies },
    { label: 'TV Shows', value: LibraryRootKind.TvShows },
    { label: 'Mixed', value: LibraryRootKind.Mixed },
  ];

  readonly enabledFilterOptions: EnabledFilterOption[] = [
    { label: 'All', value: null },
    { label: 'Enabled', value: true },
    { label: 'Disabled', value: false },
  ];

  ngOnInit(): void {
    this.rootService.getRoots(1, 20);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.rootService.getRoots(
      page,
      pageSize,
      this.selectedKindFilter() ?? undefined,
      this.selectedEnabledFilter() ?? undefined,
    );
  }

  onKindFilterChange(kind: LibraryRootKind | null): void {
    this.selectedKindFilter.set(kind);
    this.rootService.getRoots(
      1,
      this.meta().pageSize,
      kind ?? undefined,
      this.selectedEnabledFilter() ?? undefined,
    );
  }

  onEnabledFilterChange(enabled: boolean | null): void {
    this.selectedEnabledFilter.set(enabled);
    this.rootService.getRoots(
      1,
      this.meta().pageSize,
      this.selectedKindFilter() ?? undefined,
      enabled ?? undefined,
    );
  }

  onEnabledToggle(root: LibraryRoot, isEnabled: boolean): void {
    this.rootService.setEnabled(root.id, isEnabled);
    this.messageService.add({
      severity: 'success',
      summary: this.transloco.translate(
        isEnabled ? 'admin.libraryRoots.enabled' : 'admin.libraryRoots.disabled',
      ),
      life: 3000,
    });
  }

  onRemove(root: LibraryRoot): void {
    this.confirmationService.confirm({
      message: this.transloco.translate('admin.libraryRoots.removeConfirm', { path: root.path }),
      header: this.transloco.translate('admin.libraryRoots.removeTitle'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.rootService.removeRoot(root.id);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate('admin.libraryRoots.removedSuccess'),
          life: 3000,
        });
      },
    });
  }

  onAddRoot(): void {
    this.addDialog.open();
  }

  getEnabledTagSeverity(isEnabled: boolean): 'success' | 'danger' {
    return isEnabled ? 'success' : 'danger';
  }
}
