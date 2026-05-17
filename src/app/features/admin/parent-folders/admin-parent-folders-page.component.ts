import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AdminParentFolderService } from './admin-parent-folder.service';
import { ParentFolderGroup, ParentFolderStatus } from '@shared/models/parent-folder.model';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';

interface StatusFilterOption {
  label: string;
  value: ParentFolderStatus | null;
}

@Component({
  selector: 'app-admin-parent-folders-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    DialogModule,
    ProgressSpinnerModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    TmdbSearchPanelComponent,
  ],
  templateUrl: './admin-parent-folders-page.component.html',
  styleUrl: './admin-parent-folders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminParentFoldersPageComponent implements OnInit {
  private readonly parentFolderService = inject(AdminParentFolderService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly folders = this.parentFolderService.folders;
  readonly loading = this.parentFolderService.loading;
  readonly meta = this.parentFolderService.meta;

  readonly selectedStatusFilter = signal<ParentFolderStatus | null>(null);
  readonly assignDialogVisible = signal(false);
  readonly selectedFolder = signal<ParentFolderGroup | null>(null);

  statusFilterOptions: StatusFilterOption[] = [];

  private buildFilterOptions(): void {
    this.statusFilterOptions = [
      { label: this.transloco.translate('admin.parentFolders.statusAll'), value: null },
      {
        label: this.transloco.translate('admin.parentFolders.statusNotAssigned'),
        value: 'NotAssigned',
      },
      {
        label: this.transloco.translate('admin.parentFolders.statusAssigned'),
        value: 'Assigned',
      },
      {
        label: this.transloco.translate('admin.parentFolders.statusInCollection'),
        value: 'InCollection',
      },
    ];
  }

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildFilterOptions();
        this.cdr.markForCheck();
      });

    this.parentFolderService.getFolders(1, 20);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.parentFolderService.getFolders(page, pageSize, this.selectedStatusFilter() ?? undefined);
  }

  onStatusFilterChange(status: ParentFolderStatus | null): void {
    this.selectedStatusFilter.set(status);
    this.parentFolderService.getFolders(1, this.meta().pageSize, status ?? undefined);
  }

  onAssignTmdb(folder: ParentFolderGroup): void {
    this.selectedFolder.set(folder);
    this.assignDialogVisible.set(true);
  }

  onTmdbSelected(result: TmdbSearchResult): void {
    const folder = this.selectedFolder();
    if (!folder) return;
    this.parentFolderService.assignFolder(folder.id, result.id, result.mediaType);
    this.assignDialogVisible.set(false);
    this.selectedFolder.set(null);
  }

  onAssignDialogClose(): void {
    this.assignDialogVisible.set(false);
    this.selectedFolder.set(null);
  }

  getStatusSeverity(
    status: ParentFolderStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'NotAssigned':
        return 'warn';
      case 'Assigned':
        return 'success';
      case 'InCollection':
        return 'info';
      default:
        return 'secondary';
    }
  }
}
