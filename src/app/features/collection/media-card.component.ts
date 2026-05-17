import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { MediaType } from '@shared/models/enums';
import { Media } from '@shared/models/media.model';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-media-card',
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoModule, ButtonModule, TagModule, TooltipModule],
  animations: [
    trigger('cardEnter', [
      state('hidden', style({ opacity: 0, transform: 'translateY(24px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', animate(ANIMATION_TIMINGS.NORMAL)),
    ]),
  ],
})
export class MediaCardComponent {
  readonly media = input.required<Media>();
  readonly watchedToggle = output<{ mediaId: string; isWatched: boolean }>();

  readonly MediaType = MediaType;

  /** Tracks whether the card has entered the viewport (one-shot). */
  readonly inViewport = signal(false);
  /** Tracks hover state for CSS micro-interactions. */
  readonly hovered = signal(false);

  private observer: IntersectionObserver | null = null;

  constructor() {
    const el = inject(ElementRef<HTMLElement>);
    const destroyRef = inject(DestroyRef);

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.inViewport.set(true);
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(el.nativeElement);

    destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }

  get posterUrl(): string | null {
    return new TmdbImagePipe().transform(this.media().posterPath, 'w342');
  }

  get releaseYear(): string {
    return this.media().releaseDate?.slice(0, 4) ?? '';
  }

  get rating(): string {
    const v = this.media().voteAverage;
    return v != null ? v.toFixed(1) : '';
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.hovered.set(true);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hovered.set(false);
  }

  onToggleWatched(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.media();
    const currentlyWatched = item.userMedia?.isWatched ?? false;
    this.watchedToggle.emit({ mediaId: item.id, isWatched: !currentlyWatched });
  }
}
