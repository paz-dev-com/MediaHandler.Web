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
  template: `
    <p-dialog
      *transloco="let t"
      [header]="t('admin.libraryRoots.addDialog.title')"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      [modal]="true"
      [style]="{ width: '32rem' }"
      [closable]="true"
      [draggable]="false"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="flex flex-column gap-1">
          <label for="lr-path" class="font-semibold">
            {{ t('admin.libraryRoots.addDialog.pathLabel') }}
          </label>
          <input
            id="lr-path"
            pInputText
            type="text"
            [placeholder]="t('admin.libraryRoots.addDialog.pathPlaceholder')"
            [(ngModel)]="path"
          />
        </div>

        <div class="flex flex-column gap-1">
          <label for="lr-kind" class="font-semibold">
            {{ t('admin.libraryRoots.addDialog.kindLabel') }}
          </label>
          <p-select
            inputId="lr-kind"
            [options]="kindOptions"
            [(ngModel)]="selectedKind"
            optionLabel="label"
            optionValue="value"
            [placeholder]="t('admin.libraryRoots.addDialog.kindPlaceholder')"
            [style]="{ width: '100%' }"
          />
        </div>

        <div class="flex flex-column gap-1">
          <label for="lr-label" class="font-semibold">
            {{ t('admin.libraryRoots.addDialog.labelLabel') }}
            <span class="text-color-secondary font-normal text-sm ml-1">
              ({{ t('admin.libraryRoots.addDialog.optional') }})
            </span>
          </label>
          <input
            id="lr-label"
            pInputText
            type="text"
            [placeholder]="t('admin.libraryRoots.addDialog.labelPlaceholder')"
            [(ngModel)]="label"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button [label]="t('common.cancel')" severity="secondary" (onClick)="onCancel()" />
        <p-button
          [label]="t('admin.libraryRoots.addDialog.submit')"
          [disabled]="!path || !selectedKind"
          (onClick)="onSubmit(t)"
        />
      </ng-template>
    </p-dialog>
  `,
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

  path = '';
  selectedKind: LibraryRootKind | null = null;
  label = '';

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
    this.path = '';
    this.selectedKind = null;
    this.label = '';
    this.visible.set(true);
  }

  onVisibleChange(v: boolean): void {
    if (!v) {
      this.visible.set(false);
      this.closed.emit();
    }
  }

  onCancel(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  onSubmit(t: (key: string) => string): void {
    if (!this.path || !this.selectedKind) return;

    this.rootService.addRoot(this.path, this.selectedKind, this.label || undefined);

    this.messageService.add({
      severity: 'success',
      summary: t('admin.libraryRoots.addedSuccess'),
      life: 3000,
    });

    this.visible.set(false);
    this.closed.emit();
  }
}
