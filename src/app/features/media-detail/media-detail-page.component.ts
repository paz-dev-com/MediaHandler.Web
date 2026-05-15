import { DecimalPipe, SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  animate,
  group,
  query,
  stagger,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { MediaType } from '@shared/models/enums';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { MediaDetailService } from './media-detail.service';
import { MediaFilesComponent } from './media-files.component';
import { SeasonListComponent } from './season-list.component';

@Component({
  selector: 'app-media-detail-page',
  templateUrl: './media-detail-page.component.html',
  styleUrl: './media-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoModule,
    ButtonModule,
    TagModule,
    ChipModule,
    MediaFilesComponent,
    SeasonListComponent,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
    TmdbImagePipe,
    SlicePipe,
    DecimalPipe,
  ],
  animations: [
    // Files section accordion
    trigger('accordionExpand', [
      state('closed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('open', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('closed <=> open', animate(ANIMATION_TIMINGS.NORMAL)),
    ]),
    // Hero section entrance: fade in + slight scale from 1.02 → 1
    trigger('heroEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(1.02)' }),
        animate(ANIMATION_TIMINGS.SLOW, style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
    // Content panel entrance: fade up from translateY(16px)
    trigger('contentEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class MediaDetailPageComponent implements OnInit {
  readonly service = inject(MediaDetailService);

  private readonly route = inject(ActivatedRoute);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly MediaType = MediaType;

  /** Controls the files accordion open/closed state. */
  readonly filesOpen = signal(false);

  /** Whether the user explicitly prefers reduced motion. */
  private readonly reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Active rAF handle for scroll throttling. */
  private rafId: number | null = null;

  /**
   * rAF-throttled scroll handler.
   * Updates the `--scroll-offset` CSS custom property on the host element so
   * the hero backdrop can apply a CSS parallax transform referencing it.
   */
  private readonly onScroll = (): void => {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.host.nativeElement.style.setProperty('--scroll-offset', String(window.scrollY));
      this.rafId = null;
    });
  };

  toggleFiles(): void {
    this.filesOpen.update((v) => !v);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.loadMedia(id);

    // Set up parallax scroll listener (disabled when prefers-reduced-motion)
    if (!this.reducedMotion) {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', this.onScroll);
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      });
    }
  }

  onWatchedToggle(): void {
    const current = this.service.media();
    if (!current) return;
    const isWatched = !(current.userMedia?.isWatched ?? false);
    this.service.toggleWatched(isWatched);
  }

  onEpisodeToggle(event: {
    mediaId: string;
    seasonId: string;
    episodeId: string;
    isWatched: boolean;
  }): void {
    this.service.toggleEpisodeWatched(
      event.mediaId,
      event.seasonId,
      event.episodeId,
      event.isWatched,
    );
  }

  onSeasonBatchToggle(event: {
    mediaId: string;
    seasonId: string;
    episodeIds: string[];
    isWatched: boolean;
  }): void {
    for (const episodeId of event.episodeIds) {
      this.service.toggleEpisodeWatched(event.mediaId, event.seasonId, episodeId, event.isWatched);
    }
  }

  reload(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.loadMedia(id);
  }
}
