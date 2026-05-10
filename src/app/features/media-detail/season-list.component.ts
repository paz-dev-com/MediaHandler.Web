import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TvSeason } from '@shared/models/tv.model';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { EpisodeItemComponent } from './episode-item.component';

@Component({
  selector: 'app-season-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    AccordionModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    EpisodeItemComponent,
    SlicePipe,
  ],
  templateUrl: './season-list.component.html',
  styleUrl: './season-list.component.scss',
})
export class SeasonListComponent {
  /** T121: Accept null/undefined gracefully — defaults to empty array. */
  readonly seasons = input<TvSeason[]>([]);
  readonly mediaId = input.required<string>();
  readonly episodeWatchedToggle = output<{
    mediaId: string;
    seasonId: string;
    episodeId: string;
    isWatched: boolean;
  }>();
  readonly seasonBatchToggle = output<{
    mediaId: string;
    seasonId: string;
    episodeIds: string[];
    isWatched: boolean;
  }>();

  isSeasonFullyWatched(season: TvSeason): boolean {
    const episodes = season.episodes ?? [];
    const total = season.episodeCount ?? episodes.length;
    return total > 0 && season.watchedCount >= total;
  }

  getSeasonProgress(season: TvSeason): number {
    const episodes = season.episodes ?? [];
    const total = season.episodeCount ?? episodes.length;
    if (total === 0) return 0;
    return Math.round((season.watchedCount / total) * 100);
  }

  onEpisodeToggle(event: { episodeId: string; isWatched: boolean }, seasonId: string): void {
    this.episodeWatchedToggle.emit({ mediaId: this.mediaId(), seasonId, ...event });
  }

  onBatchToggle(clickEvent: Event, season: TvSeason): void {
    clickEvent.stopPropagation();
    const isWatched = !this.isSeasonFullyWatched(season);
    const episodeIds = (season.episodes ?? []).map((ep) => ep.id);
    this.seasonBatchToggle.emit({
      mediaId: this.mediaId(),
      seasonId: season.id,
      episodeIds,
      isWatched,
    });
  }
}
