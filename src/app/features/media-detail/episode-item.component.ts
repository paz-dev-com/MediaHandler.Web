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
  templateUrl: './episode-item.component.html',
  styleUrl: './episode-item.component.scss',
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
