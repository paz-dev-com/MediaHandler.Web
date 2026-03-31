import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TvEpisode } from '@shared/models/tv.model';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-episode-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CheckboxModule, TagModule, SlicePipe],
  template: `
    <div class="episode-item" [class.episode-item--watched]="episode().userEpisode?.isWatched">
      <label class="episode-item__check">
        <input
          type="checkbox"
          [checked]="episode().userEpisode?.isWatched ?? false"
          (change)="onToggle($event)"
          [attr.aria-label]="'S' + season() + 'E' + episode().episodeNumber + ' ' + episode().name"
        />
      </label>
      <div class="episode-item__info">
        <span class="episode-item__number">E{{ episode().episodeNumber }}</span>
        <span class="episode-item__name">{{ episode().name }}</span>
        @if (episode().airDate) {
          <span class="episode-item__date">{{ episode().airDate | slice: 0 : 10 }}</span>
        }
        @if (episode().runtime) {
          <span class="episode-item__runtime"
            >{{ episode().runtime }} {{ 'media.minutes' | transloco }}</span
          >
        }
      </div>
    </div>
  `,
  styles: [
    `
      .episode-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--p-surface-100);

        &:last-child {
          border-bottom: none;
        }

        &--watched {
          .episode-item__name {
            text-decoration: line-through;
            color: var(--p-text-color-secondary);
          }
        }

        &__check {
          cursor: pointer;
          flex-shrink: 0;

          input[type='checkbox'] {
            cursor: pointer;
            width: 16px;
            height: 16px;
          }
        }

        &__info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          flex-wrap: wrap;
        }

        &__number {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--p-primary-color);
          min-width: 2.5rem;
        }

        &__name {
          font-size: 0.875rem;
          color: var(--p-text-color);
          flex: 1;
        }

        &__date,
        &__runtime {
          font-size: 0.75rem;
          color: var(--p-text-color-secondary);
        }
      }
    `,
  ],
})
export class EpisodeItemComponent {
  readonly episode = input.required<TvEpisode>();
  readonly season = input<number>(0);
  readonly watchedToggle = output<{ episodeId: string; isWatched: boolean }>();

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.watchedToggle.emit({ episodeId: this.episode().id, isWatched: checked });
  }
}
