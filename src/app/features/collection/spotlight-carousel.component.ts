import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { Media } from '@shared/models/media.model';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';

@Component({
  selector: 'app-spotlight-carousel',
  standalone: true,
  imports: [RouterLink, TranslocoModule, TmdbImagePipe],
  templateUrl: './spotlight-carousel.component.html',
  styleUrl: './spotlight-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('carouselEnter', [
      transition(':enter', [
        query(
          '.spotlight-item',
          [
            style({ opacity: 0, transform: 'translateX(32px)' }),
            stagger(ANIMATION_TIMINGS.STAGGER_DELAY, [
              animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
})
export class SpotlightCarouselComponent {
  /** All media items — the carousel slices the 10 most recently added. */
  readonly items = input.required<Media[]>();

  /** Sorted slice: last 10 items by createdAt descending. */
  readonly recentItems = computed(() =>
    [...this.items()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
  );

  readonly trackRef = viewChild<ElementRef<HTMLElement>>('trackRef');
  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(true);

  onScroll(event: Event): void {
    const track = event.target as HTMLElement;
    this.canScrollLeft.set(track.scrollLeft > 0);
    this.canScrollRight.set(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }

  scrollLeft(): void {
    this.trackRef()?.nativeElement.scrollBy({ left: -280, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.trackRef()?.nativeElement.scrollBy({ left: 280, behavior: 'smooth' });
  }

  getPosterUrl(item: Media): string | null {
    return new TmdbImagePipe().transform(item.posterPath, 'w185');
  }
}
