import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { MediaType } from '@shared/models/enums';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CollectionFilters } from './collection.service';

@Component({
  selector: 'app-collection-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './collection-filters.component.html',
  styleUrl: './collection-filters.component.scss',
})
export class CollectionFiltersComponent {
  readonly filters = input.required<CollectionFilters>();
  readonly filtersChange = output<Partial<CollectionFilters>>();

  readonly typeOptions = [
    { label: 'Film', value: MediaType.Film },
    { label: 'TV Show', value: MediaType.TvShow },
  ];

  readonly watchedOptions = [
    { label: 'Watched', value: true },
    { label: 'Unwatched', value: false },
  ];

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  onSearchChange(value: string): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.filtersChange.emit({ search: value }), 300);
  }

  onTypeChange(value: MediaType | null): void {
    this.filtersChange.emit({ type: value });
  }

  onWatchedChange(value: boolean | null): void {
    this.filtersChange.emit({ isWatched: value });
  }
}
