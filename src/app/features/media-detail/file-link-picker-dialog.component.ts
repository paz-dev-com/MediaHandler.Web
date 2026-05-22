import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { AdminMediaFileLinkService } from '@core/services/admin-media-file-link.service';
import { UnlinkedFile } from '@shared/models/media.model';
import { FileSizePipe } from '@shared/pipes/file-size.pipe';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PaginationMeta } from '@core/api/api-response.model';

@Component({
  selector: 'app-file-link-picker-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, ButtonModule, DialogModule, TableModule, TagModule, FileSizePipe],
  templateUrl: './file-link-picker-dialog.component.html',
  styleUrl: './file-link-picker-dialog.component.scss',
})
export class FileLinkPickerDialogComponent implements OnInit {
  /** Controls dialog visibility */
  readonly visible = input<boolean>(false);
  /** Emitted when the dialog should be closed */
  readonly visibleChange = output<boolean>();
  /** Emitted when a file is chosen to be linked, carries the fileId */
  readonly fileLinkRequested = output<string>();

  private readonly linkService = inject(AdminMediaFileLinkService);
  private readonly destroyRef = inject(DestroyRef);

  readonly files = signal<UnlinkedFile[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly meta = signal<PaginationMeta | null>(null);

  ngOnInit(): void {
    this.loadFiles();
  }

  loadFiles(): void {
    this.loading.set(true);
    this.error.set(null);
    this.linkService
      .getUnlinkedFiles(this.page(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.files.set(response.data ?? []);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('mediaDetail.filePicker.loadError');
          this.loading.set(false);
        },
      });
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.page.set(Math.floor(event.first / event.rows) + 1);
    this.pageSize.set(event.rows);
    this.loadFiles();
  }

  onLinkClick(fileId: string): void {
    this.fileLinkRequested.emit(fileId);
  }

  close(): void {
    this.visibleChange.emit(false);
  }
}
