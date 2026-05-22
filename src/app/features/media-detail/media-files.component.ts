import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ClipboardService } from '@core/services/clipboard.service';
import { TranslocoModule } from '@jsverse/transloco';
import { MediaFile } from '@shared/models/media.model';
import { FileSizePipe } from '@shared/pipes/file-size.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-media-files',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, ButtonModule, TagModule, TooltipModule, FileSizePipe, FormsModule],
  templateUrl: './media-files.component.html',
  styleUrl: './media-files.component.scss',
})
export class MediaFilesComponent {
  /** T120: Accept null/undefined gracefully — defaults to empty array. */
  readonly files = input<MediaFile[]>([]);
  /** Whether the current user is admin — controls Unlink/Link buttons visibility. */
  readonly isAdmin = input<boolean>(false);

  /** Emitted when the admin clicks "Link File" (open picker dialog). */
  readonly linkFileRequested = output<void>();
  /** Emitted when the admin clicks "Unlink" on a specific file. */
  readonly unlinkFileRequested = output<string>();

  private readonly clipboard = inject(ClipboardService);

  /** Tracks which file paths are showing the fallback textarea */
  readonly fallbackPaths = signal<Record<string, boolean>>({});
  /** Tracks which folder paths are showing the folder-copy fallback textarea */
  readonly fallbackFolders = signal<Record<string, boolean>>({});

  async copyPath(path: string): Promise<void> {
    const success = await this.clipboard.copy(path);
    if (!success) {
      this.fallbackPaths.update((m) => ({ ...m, [path]: true }));
    }
  }

  clearFallback(path: string): void {
    this.fallbackPaths.update((m) => {
      const next = { ...m };
      delete next[path];
      return next;
    });
  }

  getFolderPath(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash > 0 ? filePath.substring(0, lastSlash) : filePath;
  }

  async copyFolder(filePath: string): Promise<void> {
    const folder = this.getFolderPath(filePath);
    const success = await this.clipboard.copy(folder);
    if (!success) {
      this.fallbackFolders.update((m) => ({ ...m, [filePath]: true }));
    }
  }

  clearFolderFallback(filePath: string): void {
    this.fallbackFolders.update((m) => {
      const next = { ...m };
      delete next[filePath];
      return next;
    });
  }

  onUnlinkClick(fileId: string): void {
    this.unlinkFileRequested.emit(fileId);
  }

  onLinkFileClick(): void {
    this.linkFileRequested.emit();
  }
}
