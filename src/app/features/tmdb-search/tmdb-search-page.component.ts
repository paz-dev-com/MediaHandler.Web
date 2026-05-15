import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { WishlistService } from '@features/wishlist/wishlist.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { TmdbResultCardComponent } from './tmdb-result-card.component';
import { TmdbSearchResult, TmdbSearchService } from './tmdb-search.service';

@Component({
  selector: 'app-tmdb-search-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    InputTextModule,
    TmdbResultCardComponent,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './tmdb-search-page.component.html',
  styleUrl: './tmdb-search-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    /**
     * @resultsEnter — staggered card entrance when results list changes.
     * Each card slides up 16px + fades in, staggered by 50ms.
     */
    trigger('resultsEnter', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(16px)' }),
            stagger(50, [
              animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class TmdbSearchPageComponent implements OnInit, OnDestroy {
  readonly searchService = inject(TmdbSearchService);
  private readonly wishlistService = inject(WishlistService);
  private readonly messageService = inject(MessageService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  readonly searchQuery = signal('');
  /** Tracks input focus state to drive CSS glow class. */
  readonly inputFocused = signal(false);
  private readonly query$ = new Subject<string>();

  ngOnInit(): void {
    this.query$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.searchService.search(q));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(value: string): void {
    this.searchQuery.set(value);
    this.query$.next(value);
  }

  onImport(result: TmdbSearchResult): void {
    const mediaType = result.mediaType === 'movie' ? 'movie' : 'tv';
    this.searchService.import(result.id, mediaType);
    this.messageService.add({
      severity: 'info',
      summary: this.transloco.translate('tmdb.importStarted'),
      detail: result.title,
    });
  }

  onWishlist(result: TmdbSearchResult): void {
    this.wishlistService.addItem({
      tmdbId: result.id,
      title: result.title,
      posterPath: result.posterPath ?? undefined,
      releaseDate: result.releaseDate ?? undefined,
    });
  }

  isImporting(tmdbId: number): boolean {
    return this.searchService.importingIds().has(tmdbId);
  }

  isWishlisting(tmdbId: number): boolean {
    return this.wishlistService.addingIds().has(tmdbId);
  }
}
