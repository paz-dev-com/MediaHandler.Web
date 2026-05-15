import { DecimalPipe, SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  signal,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TmdbSearchResult } from './tmdb-search.service';

@Component({
  selector: 'app-tmdb-result-card',
  standalone: true,
  imports: [
    TranslocoModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    TmdbImagePipe,
    SlicePipe,
    DecimalPipe,
  ],
  templateUrl: './tmdb-result-card.component.html',
  styleUrl: './tmdb-result-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    /** @cardEnter — opacity + slight slide from bottom when card enters DOM */
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class TmdbResultCardComponent {
  readonly result = input.required<TmdbSearchResult>();
  readonly importing = input(false);
  readonly wishlisting = input(false);

  /** Hover state drives CSS micro-interactions (glow, overlay). */
  readonly hovered = signal(false);

  @Output() importClick = new EventEmitter<TmdbSearchResult>();
  @Output() wishlistClick = new EventEmitter<TmdbSearchResult>();

  onImport(): void {
    this.importClick.emit(this.result());
  }

  onWishlist(): void {
    this.wishlistClick.emit(this.result());
  }
}
