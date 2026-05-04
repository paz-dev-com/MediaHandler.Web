import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { DataView } from 'primeng/dataview';
import { ImageModule } from 'primeng/image';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { TmdbSearchResult, TmdbSearchService } from '@features/tmdb-search/tmdb-search.service';
import { MediaType } from '@shared/models/enums';

export type { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';

@Component({
  selector: 'app-tmdb-search-panel',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    DataView,
    ImageModule,
    InputTextModule,
    ProgressSpinnerModule,
    TagModule,
    MessageModule,
  ],
  templateUrl: './tmdb-search-panel.component.html',
  styleUrl: './tmdb-search-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TmdbSearchPanelComponent implements OnInit {
  private readonly tmdbSearch = inject(TmdbSearchService);

  @Input() initialQuery = '';
  @Input() mediaTypeFilter: MediaType | null = null;
  @Output() selected = new EventEmitter<TmdbSearchResult>();

  readonly query = signal('');
  readonly loading = this.tmdbSearch.loading;
  readonly allResults = this.tmdbSearch.results;

  readonly TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

  ngOnInit(): void {
    if (this.initialQuery) {
      this.query.set(this.initialQuery);
      this.search();
    }
  }

  get filteredResults(): TmdbSearchResult[] {
    const all = this.allResults();
    if (!this.mediaTypeFilter) return all;
    const filterStr = this.mediaTypeFilter === MediaType.Film ? 'movie' : 'tv';
    return all.filter((r) => r.mediaType === filterStr);
  }

  search(): void {
    const q = this.query().trim();
    if (q) {
      this.tmdbSearch.search(q);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.search();
    }
  }

  onSelect(result: TmdbSearchResult): void {
    this.selected.emit(result);
  }

  getPosterUrl(posterPath: string): string {
    return `${this.TMDB_IMAGE_BASE}${posterPath}`;
  }

  getReleaseYear(releaseDate: string | null): string | null {
    if (!releaseDate) return null;
    return releaseDate.substring(0, 4);
  }
}
