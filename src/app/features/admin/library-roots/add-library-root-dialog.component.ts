import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  OnInit,
  Output,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddLibraryRootDialogComponent implements OnInit {
  private readonly rootService = inject(AdminLibraryRootService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Output() closed = new EventEmitter<void>();

  readonly visible = signal(false);
  /** Non-null when in edit mode */
  editingRoot: LibraryRoot | null = null;

  path = '';
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
    this.path = '';
    this.selectedKind = null;
    this.label = '';
    this.visible.set(true);
  }

  openForEdit(root: LibraryRoot): void {
    this.editingRoot = root;
    this.path = root.path;
    this.selectedKind = root.kind;
    this.label = root.label ?? '';
    this.visible.set(true);
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
      this.rootService.updateRoot(this.editingRoot.id, this.selectedKind, this.label || undefined);
      this.messageService.add({
        severity: 'success',
        summary: t('admin.libraryRoots.editedSuccess'),
        life: 3000,
      });
    } else {
      if (!this.path) return;
      this.rootService.addRoot(this.path, this.selectedKind, this.label || undefined);
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
}
