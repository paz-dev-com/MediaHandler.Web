import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AdminScanDecisionService } from '../scan-results/admin-scan-decision.service';
import { BatchRenamePreview, RenamePreview } from '@shared/models/rename.model';

@Component({
  selector: 'app-rename-dialog',
  standalone: true,
  imports: [TranslocoModule, ButtonModule, DialogModule, MessageModule, ProgressSpinnerModule],
  templateUrl: './rename-dialog.component.html',
  styleUrl: './rename-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameDialogComponent implements OnChanges {
  private readonly decisionService = inject(AdminScanDecisionService);
  private readonly messageService = inject(MessageService);

  @Input() mode: 'single' | 'batch' = 'single';
  @Input() fileId: string | null = null;
  @Input() groupId: string | null = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() renamed = new EventEmitter<void>();

  readonly preview = signal<RenamePreview | null>(null);
  readonly batchPreview = signal<BatchRenamePreview | null>(null);
  readonly loading = signal(false);
  readonly confirming = signal(false);
  readonly error = signal<string | null>(null);

  ngOnChanges(): void {
    if (!this.visible) {
      this.resetState();
    }
  }

  private resetState(): void {
    this.preview.set(null);
    this.batchPreview.set(null);
    this.loading.set(false);
    this.confirming.set(false);
    this.error.set(null);
  }

  loadPreview(t: (key: string) => string): void {
    this.error.set(null);
    this.loading.set(true);

    if (this.mode === 'single' && this.fileId) {
      this.decisionService.renameFile(this.fileId, true).subscribe({
        next: (result) => {
          this.preview.set(result as RenamePreview);
          this.confirming.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(t('admin.rename.error'));
          this.loading.set(false);
        },
      });
    } else if (this.mode === 'batch' && this.groupId) {
      this.decisionService.renameTvGroup(this.groupId, true).subscribe({
        next: (result) => {
          this.batchPreview.set(result as BatchRenamePreview);
          this.confirming.set(true);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(t('admin.rename.error'));
          this.loading.set(false);
        },
      });
    }
  }

  confirmRename(t: (key: string) => string): void {
    this.error.set(null);
    this.loading.set(true);

    if (this.mode === 'single' && this.fileId) {
      this.decisionService.renameFile(this.fileId).subscribe({
        next: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: t('admin.rename.success'),
            life: 3000,
          });
          this.renamed.emit();
          this.close();
        },
        error: () => {
          this.error.set(t('admin.rename.error'));
          this.loading.set(false);
        },
      });
    } else if (this.mode === 'batch' && this.groupId) {
      this.decisionService.renameTvGroup(this.groupId).subscribe({
        next: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'success',
            summary: t('admin.rename.batchSuccess'),
            life: 3000,
          });
          this.renamed.emit();
          this.close();
        },
        error: () => {
          this.error.set(t('admin.rename.error'));
          this.loading.set(false);
        },
      });
    }
  }

  close(): void {
    this.visibleChange.emit(false);
    this.resetState();
  }
}
