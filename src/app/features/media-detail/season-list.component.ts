import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { TvSeason } from '@shared/models/tv.model';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { EpisodeItemComponent } from './episode-item.component';

@Component({
  selector: 'app-season-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    ButtonModule,
    ProgressBarModule,
    TagModule,
    EpisodeItemComponent,
    SlicePipe,
  ],
  templateUrl: './season-list.component.html',
  styleUrl: './season-list.component.scss',
  animations: [
    /**
     * @accordionExpand — state-based height animation (no :enter flash).
     * The content div is always in the DOM, starting in 'collapsed' state.
     * Transitioning to 'expanded' avoids the 1-frame visibility flash
     * that `:enter` animations produce.
     */
    trigger('accordionExpand', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'visible', opacity: 1 })),
      transition('collapsed => expanded', animate(ANIMATION_TIMINGS.NORMAL)),
      transition('expanded => collapsed', animate(ANIMATION_TIMINGS.FAST)),
    ]),
  ],
})
export class SeasonListComponent {
  /** Accept null/undefined gracefully — defaults to empty array. */
  readonly seasons = input<TvSeason[]>([]);
  readonly mediaId = input.required<string>();
  /**
   * Total number of seasons from TMDB (media.numberOfSeasons).
   * Used to compute missing season numbers.
   */
  readonly numberOfSeasons = input<number | null>(null);

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

  /**
   * Season numbers that are in TMDB's total count but not in the user's collection.
   * Only computed when numberOfSeasons is provided and > 0.
   */
  readonly missingSeasonNumbers = computed(() => {
    const total = this.numberOfSeasons() ?? 0;
    if (total <= 0) return [];
    const owned = new Set(this.seasons().map((s) => s.seasonNumber));
    return Array.from({ length: total }, (_, i) => i + 1).filter((n) => !owned.has(n));
  });

  /** Set of currently expanded season IDs. */
  private readonly expandedSeasonIds = signal<Set<string>>(new Set());

  isExpanded(seasonId: string): boolean {
    return this.expandedSeasonIds().has(seasonId);
  }

  toggleSeason(seasonId: string): void {
    this.expandedSeasonIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(seasonId)) {
        next.delete(seasonId);
      } else {
        next.add(seasonId);
      }
      return next;
    });
  }

  isSeasonFullyWatched(season: TvSeason): boolean {
    const total = season.episodeCount ?? (season.episodes ?? []).length;
    return total > 0 && season.watchedCount >= total;
  }

  getSeasonProgress(season: TvSeason): number {
    const total = season.episodeCount ?? (season.episodes ?? []).length;
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
