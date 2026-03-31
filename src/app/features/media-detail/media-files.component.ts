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
  template: `
    <div class="media-files">
      <h3>{{ 'media.files' | transloco }}</h3>

      @if (!files().length) {
        <p class="text-color-secondary">{{ 'media.noFiles' | transloco }}</p>
      } @else {
        <ul class="media-files__list">
          @for (file of files(); track file.id) {
            <li class="media-files__item">
              <div class="media-files__path">
                <i class="pi pi-file mr-2 text-color-secondary"></i>
                <span class="media-files__path-text" [title]="file.filePath">{{
                  file.filePath
                }}</span>
              </div>
              <div class="media-files__meta">
                @if (file.format) {
                  <p-tag
                    [value]="file.format.toUpperCase()"
                    severity="secondary"
                    styleClass="text-xs"
                  />
                }
                @if (file.resolution) {
                  <p-tag [value]="file.resolution" severity="info" styleClass="text-xs" />
                }
                <span class="text-sm text-color-secondary">{{
                  file.fileSizeBytes | fileSize
                }}</span>
                <p-button
                  icon="pi pi-copy"
                  size="small"
                  variant="text"
                  severity="secondary"
                  [pTooltip]="'common.copyPath' | transloco"
                  [attr.aria-label]="'common.copyPath' | transloco"
                  (onClick)="copyPath(file.filePath)"
                />
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [
    `
      .media-files {
        h3 {
          margin: 0 0 1rem;
          color: var(--p-text-color);
        }

        &__list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        &__item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.5rem 0.75rem;
          background: var(--p-surface-50);
          border-radius: 6px;
          border: 1px solid var(--p-surface-200);
          flex-wrap: wrap;
        }

        &__path {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
        }

        &__path-text {
          font-family: monospace;
          font-size: 0.85rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--p-text-color);
        }

        &__meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
      }
    `,
  ],
})
export class MediaFilesComponent {
  readonly files = input.required<MediaFile[]>();

  private readonly clipboard = inject(ClipboardService);

  copyPath(path: string): void {
    this.clipboard.copy(path);
  }
}
