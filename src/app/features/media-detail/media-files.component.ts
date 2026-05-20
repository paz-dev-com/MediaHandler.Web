import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
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

  private readonly clipboard = inject(ClipboardService);

  /** Tracks which file paths are showing the fallback textarea */
  readonly fallbackPaths = signal<Record<string, boolean>>({});

  async copyPath(path: string): Promise<void> {
    const success = await this.clipboard.copy(path);
    if (!success) {
      // On clipboard rejection, show fallback textarea for manual copying
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
}
