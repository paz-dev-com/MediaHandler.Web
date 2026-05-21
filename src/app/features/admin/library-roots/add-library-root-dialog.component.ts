import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AdminLibraryRootService } from './admin-library-root.service';
import { AdminFilesService } from '@shared/services/admin-files.service';
import { LibraryRoot } from '@shared/models/library-root.model';
import { LibraryRootKind } from '@shared/models/enums';

interface KindOption {
  label: string;
  value: LibraryRootKind;
}

@Component({
  selector: 'app-add-library-root-dialog',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
  ],
  templateUrl: './add-library-root-dialog.component.html',
  styleUrl: './add-library-root-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLibraryRootDialogComponent implements OnInit {
  private readonly rootService = inject(AdminLibraryRootService);
  private readonly filesService = inject(AdminFilesService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Output() closed = new EventEmitter<void>();

  readonly visible = signal(false);
  /** Non-null when in edit mode */
  editingRoot: LibraryRoot | null = null;

  // Root folder dropdown state
  readonly locations = signal<string[]>([]);
  readonly isLoadingLocations = signal(false);
  readonly hasNoLocations = signal(false);
  readonly selectedRoot = signal<string | null>(null);
  readonly subPath = signal('');
  /** Composed full path: selectedRoot + subPath, or subPath alone in fallback mode */
  readonly composedPath = computed(() => {
    const root = this.selectedRoot();
    const sub = this.subPath();
    if (!root) return sub;
    // Ensure exactly one slash between root and sub-path
    const normalizedSub = sub.startsWith('/') ? sub : sub ? '/' + sub : '';
    return root + normalizedSub;
  });

  selectedKind: LibraryRootKind | null = null;
  label = '';

  get isEditMode(): boolean {
    return this.editingRoot !== null;
  }

  kindOptions: KindOption[] = [];

  private buildKindOptions(): void {
    this.kindOptions = [
      {
        label: this.transloco.translate('admin.libraryRoots.kinds.Movies'),
        value: LibraryRootKind.Movies,
      },
      {
        label: this.transloco.translate('admin.libraryRoots.kinds.TvShows'),
        value: LibraryRootKind.TvShows,
      },
      {
        label: this.transloco.translate('admin.libraryRoots.kinds.Mixed'),
        value: LibraryRootKind.Mixed,
      },
    ];
  }

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildKindOptions();
        this.cdr.markForCheck();
      });
  }

  open(): void {
    this.editingRoot = null;
    this.selectedRoot.set(null);
    this.subPath.set('');
    this.selectedKind = null;
    this.label = '';
    this.visible.set(true);
    this.loadLocations();
  }

  openForEdit(root: LibraryRoot): void {
    this.editingRoot = root;
    this.selectedRoot.set(null);
    this.subPath.set(root.path);
    this.selectedKind = root.kind;
    this.label = root.label ?? '';
    this.visible.set(true);
    this.loadLocations();
  }

  onVisibleChange(v: boolean): void {
    if (!v) {
      this.visible.set(false);
      this.editingRoot = null;
      this.closed.emit();
    }
  }

  onCancel(): void {
    this.visible.set(false);
    this.editingRoot = null;
    this.closed.emit();
  }

  onSubmit(t: (key: string) => string): void {
    if (!this.selectedKind) return;

    if (this.isEditMode) {
      if (!this.editingRoot) return;
      const newPath = this.composedPath() || this.subPath();
      this.rootService.updateRoot(
        this.editingRoot.id,
        this.selectedKind,
        this.label || undefined,
        newPath || undefined,
      );
      this.messageService.add({
        severity: 'success',
        summary: t('admin.libraryRoots.editedSuccess'),
        life: 3000,
      });
    } else {
      const path = this.composedPath();
      if (!path) return;
      this.rootService.addRoot(path, this.selectedKind, this.label || undefined);
      this.messageService.add({
        severity: 'success',
        summary: t('admin.libraryRoots.addedSuccess'),
        life: 3000,
      });
    }

    this.visible.set(false);
    this.editingRoot = null;
    this.closed.emit();
  }

  private loadLocations(): void {
    this.isLoadingLocations.set(true);
    this.hasNoLocations.set(false);
    this.filesService
      .getLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (locs) => {
          this.locations.set(locs);
          this.hasNoLocations.set(locs.length === 0);
          this.isLoadingLocations.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.locations.set([]);
          this.hasNoLocations.set(true);
          this.isLoadingLocations.set(false);
          this.cdr.markForCheck();
        },
      });
  }
}
