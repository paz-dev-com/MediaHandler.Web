import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CollectionFiltersComponent } from './collection-filters.component';
import { CollectionStatsComponent } from './collection-stats.component';
import { CollectionFilters, CollectionService } from './collection.service';
import { EmptyCollectionComponent } from './empty-collection.component';
import { MediaCardComponent } from './media-card.component';

@Component({
  selector: 'app-collection-page',
  templateUrl: './collection-page.component.html',
  styleUrl: './collection-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    PaginatorModule,
    MediaCardComponent,
    CollectionFiltersComponent,
    CollectionStatsComponent,
    EmptyCollectionComponent,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
  ],
})
export class CollectionPageComponent implements OnInit {
  readonly service = inject(CollectionService);

  ngOnInit(): void {
    this.service.loadStats();
    this.service.loadMedia();
  }

  onFiltersChange(partial: Partial<CollectionFilters>): void {
    this.service.updateFilters(partial);
  }

  onPageChange(event: PaginatorState): void {
    this.service.setPage((event.page ?? 0) + 1);
  }

  onWatchedToggle(event: { mediaId: string; isWatched: boolean }): void {
    this.service.toggleWatched(event.mediaId, event.isWatched);
  }
}
