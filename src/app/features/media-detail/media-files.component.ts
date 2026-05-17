import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ClipboardService } from '@core/services/clipboard.service';
import { TranslocoModule } from '@jsverse/transloco';
import { MediaFile } from '@shared/models/media.model';
import { FileSizePipe } from '@shared/pipes/file-size.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-media-files',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, ButtonModule, TagModule, TooltipModule, FileSizePipe],
  templateUrl: './media-files.component.html',
  styleUrl: './media-files.component.scss',
})
export class MediaFilesComponent {
  /** T120: Accept null/undefined gracefully — defaults to empty array. */
  readonly files = input<MediaFile[]>([]);

  private readonly clipboard = inject(ClipboardService);

  copyPath(path: string): void {
    this.clipboard.copy(path);
  }
}
