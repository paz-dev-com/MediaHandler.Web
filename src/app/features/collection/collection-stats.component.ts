import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CollectionStats } from '@core/api/api-response.model';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-collection-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    @if (stats()) {
      <div class="stats-bar">
        <div class="stats-bar__item">
          <span class="stats-bar__value">{{ stats()!.totalMedia }}</span>
          <span class="stats-bar__label">{{ 'collection.stats.total' | transloco }}</span>
        </div>
        <div class="stats-bar__item">
          <span class="stats-bar__value">{{ stats()!.totalFilms }}</span>
          <span class="stats-bar__label">{{ 'collection.stats.films' | transloco }}</span>
        </div>
        <div class="stats-bar__item">
          <span class="stats-bar__value">{{ stats()!.totalTvShows }}</span>
          <span class="stats-bar__label">{{ 'collection.stats.tvShows' | transloco }}</span>
        </div>
        <div class="stats-bar__item">
          <span class="stats-bar__value">{{ stats()!.totalWatched }}</span>
          <span class="stats-bar__label">{{ 'collection.stats.watched' | transloco }}</span>
        </div>
        <div class="stats-bar__item">
          <span class="stats-bar__value">{{ stats()!.totalUnwatched }}</span>
          <span class="stats-bar__label">{{ 'collection.stats.unwatched' | transloco }}</span>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .stats-bar {
        display: flex;
        gap: 1.5rem;
        padding: 0.75rem 1rem;
        background: var(--p-surface-0);
        border: 1px solid var(--p-surface-200);
        border-radius: 8px;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;

        &__item {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          text-align: center;
        }

        &__value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--p-primary-color);
        }

        &__label {
          font-size: 0.75rem;
          color: var(--p-text-color-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      }
    `,
  ],
})
export class CollectionStatsComponent {
  readonly stats = input<CollectionStats | null>(null);
}
