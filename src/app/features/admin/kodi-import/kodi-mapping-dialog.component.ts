import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AdminKodiPathMappingService } from './admin-kodi-path-mapping.service';
import { KodiPathMapping } from '@shared/models/kodi-import.model';

@Component({
  selector: 'app-kodi-mapping-dialog',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './kodi-mapping-dialog.component.html',
  styleUrl: './kodi-mapping-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiMappingDialogComponent implements OnInit {
  readonly mappingService = inject(AdminKodiPathMappingService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly saved = output<void>();

  readonly visible = signal(false);
  readonly kodiPrefix = signal('');
  readonly nasPrefix = signal('');
  readonly sortOrder = signal<number | null>(null);
  readonly attemptedSubmit = signal(false);

  private editingId: string | null = null;

  readonly isEditMode = computed(() => this.editingId !== null);

  readonly kodiPrefixInvalid = computed(() => this.attemptedSubmit() && !this.kodiPrefix().trim());
  readonly nasPrefixInvalid = computed(() => this.attemptedSubmit() && !this.nasPrefix().trim());
  readonly nasPrefixSlashInvalid = computed(
    () => this.attemptedSubmit() && !!this.nasPrefix().trim() && !this.nasPrefix().startsWith('/'),
  );
  readonly sortOrderInvalid = computed(
    () => this.attemptedSubmit() && this.isEditMode() && this.sortOrder() === null,
  );
  readonly canSubmit = computed(
    () =>
      !!this.kodiPrefix().trim() &&
      !!this.nasPrefix().trim() &&
      this.nasPrefix().startsWith('/') &&
      (!this.isEditMode() || this.sortOrder() !== null),
  );

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  open(): void {
    this.reset();
    this.visible.set(true);
  }

  openForEdit(mapping: KodiPathMapping): void {
    this.reset();
    this.editingId = mapping.id;
    this.kodiPrefix.set(mapping.kodiPrefix);
    this.nasPrefix.set(mapping.nasPrefix);
    this.sortOrder.set(mapping.sortOrder);
    this.visible.set(true);
  }

  openWithPrefix(prefix: string): void {
    this.reset();
    this.kodiPrefix.set(prefix);
    this.visible.set(true);
  }

  onVisibleChange(v: boolean): void {
    if (!v) {
      this.close();
    }
  }

  onCancel(): void {
    this.close();
  }

  onSubmit(t: (key: string) => string): void {
    this.attemptedSubmit.set(true);
    if (!this.canSubmit()) return;

    const kodiPrefix = this.kodiPrefix().trim();
    const nasPrefix = this.nasPrefix().trim();
    const sortOrder = this.sortOrder();

    const successHandler = (): void => {
      this.messageService.add({
        severity: 'success',
        summary: this.transloco.translate(
          this.isEditMode()
            ? 'admin.kodiImport.mappings.updated'
            : 'admin.kodiImport.mappings.saved',
        ),
        life: 3000,
      });
      this.saved.emit();
      this.close();
    };

    if (this.isEditMode() && this.editingId) {
      this.mappingService
        .update(this.editingId, kodiPrefix, nasPrefix, sortOrder ?? 0)
        .subscribe({ next: successHandler, error: () => undefined });
    } else {
      this.mappingService
        .create(kodiPrefix, nasPrefix, sortOrder ?? undefined)
        .subscribe({ next: successHandler, error: () => undefined });
    }
  }

  private reset(): void {
    this.editingId = null;
    this.kodiPrefix.set('');
    this.nasPrefix.set('');
    this.sortOrder.set(null);
    this.attemptedSubmit.set(false);
    this.mappingService.clearSaveError();
  }

  private close(): void {
    this.visible.set(false);
    this.reset();
  }
}
