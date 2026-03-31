import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-empty-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoModule, ButtonModule],
  template: `
    <div class="empty-collection">
      <i class="pi pi-video empty-collection__icon"></i>
      <h2 class="empty-collection__title">{{ 'collection.empty.title' | transloco }}</h2>
      <p class="empty-collection__description">{{ 'collection.empty.description' | transloco }}</p>
      <p-button
        [label]="'collection.empty.cta' | transloco"
        icon="pi pi-search"
        routerLink="/tmdb-search"
      />
    </div>
  `,
  styles: [
    `
      .empty-collection {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        gap: 1rem;

        &__icon {
          font-size: 4rem;
          color: var(--p-text-color-secondary);
          opacity: 0.4;
        }

        &__title {
          margin: 0;
          font-size: 1.5rem;
          color: var(--p-text-color);
        }

        &__description {
          margin: 0;
          color: var(--p-text-color-secondary);
          max-width: 400px;
        }
      }
    `,
  ],
})
export class EmptyCollectionComponent {}
