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
  imports: [TranslocoModule, AccordionModule, ButtonModule, ProgressBarModule, TagModule, EpisodeItemComponent, SlicePipe],
  template: `
    <div class="season-list">
      <h3>{{ 'media.seasons' | transloco }}</h3>

      @if (!seasons().length) {
        <p class="text-color-secondary">{{ 'media.noSeasons' | transloco }}</p>
      } @else {
        <p-accordion [multiple]="true">
          @for (season of seasons(); track season.id) {
            <p-accordion-panel [value]="season.id">
              <p-accordion-header>
                <div class="season-header">
                  <span class="season-header__name">{{ season.name }}</span>
                  <div class="season-header__meta">
                    <span class="season-header__progress">
                      {{ season.watchedCount }}/{{ season.episodeCount ?? season.tvEpisodes.length }}
                      {{ 'season.watchedCount' | transloco: { watched: season.watchedCount, total: season.episodeCount ?? season.tvEpisodes.length } }}
                    </span>
                    @if (season.airDate) {
                      <span class="season-header__date">{{ season.airDate | slice: 0 : 4 }}</span>
                    }
                    <p-button
                      [icon]="isSeasonFullyWatched(season) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                      [label]="(isSeasonFullyWatched(season) ? 'season.markAllUnwatched' : 'season.markAllWatched') | transloco"
                      size="small"
                      severity="secondary"
                      variant="text"
                      (onClick)="onBatchToggle($event, season)"
                    />
                  </div>
                </div>
                @if ((season.episodeCount ?? season.tvEpisodes.length) > 0) {
                  <p-progressbar
                    [value]="getSeasonProgress(season)"
                    styleClass="season-progress"
                  />
                }
              </p-accordion-header>
              <p-accordion-content>
                @for (episode of season.tvEpisodes; track episode.id) {
                  <app-episode-item
                    [episode]="episode"
                    [season]="season.seasonNumber"
                    (watchedToggle)="onEpisodeToggle($event, season.id)"
                  />
                }
              </p-accordion-content>
            </p-accordion-panel>
          }
        </p-accordion>
      }
    </div>
  `,
  styles: [`
    .season-list {
      h3 {
        margin: 0 0 1rem;
        color: var(--p-text-color);
      }
    }

    .season-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 1rem;
      flex-wrap: wrap;

      &__name {
        font-weight: 600;
        color: var(--p-text-color);
      }

      &__meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      &__progress,
      &__date {
        font-size: 0.8rem;
        color: var(--p-text-color-secondary);
      }
    }

    :host ::ng-deep .season-progress {
      height: 4px;
      margin-top: 0.4rem;
    }
  `],
})
export class SeasonListComponent {
  readonly seasons = input.required<TvSeason[]>();
  readonly mediaId = input.required<string>();
  readonly episodeWatchedToggle = output<{ mediaId: string; seasonId: string; episodeId: string; isWatched: boolean }>();
  readonly seasonBatchToggle = output<{ mediaId: string; seasonId: string; episodeIds: string[]; isWatched: boolean }>();

  isSeasonFullyWatched(season: TvSeason): boolean {
    const total = season.episodeCount ?? season.tvEpisodes.length;
    return total > 0 && season.watchedCount >= total;
  }

  getSeasonProgress(season: TvSeason): number {
    const total = season.episodeCount ?? season.tvEpisodes.length;
    if (total === 0) return 0;
    return Math.round((season.watchedCount / total) * 100);
  }

  onEpisodeToggle(event: { episodeId: string; isWatched: boolean }, seasonId: string): void {
    this.episodeWatchedToggle.emit({ mediaId: this.mediaId(), seasonId, ...event });
  }

  onBatchToggle(clickEvent: Event, season: TvSeason): void {
    clickEvent.stopPropagation();
    const isWatched = !this.isSeasonFullyWatched(season);
    const episodeIds = season.tvEpisodes.map((ep) => ep.id);
    this.seasonBatchToggle.emit({ mediaId: this.mediaId(), seasonId: season.id, episodeIds, isWatched });
  }
}
