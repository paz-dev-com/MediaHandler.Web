import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
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
    trigger('accordionExpand', [
      state('closed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('open', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('closed <=> open', animate(ANIMATION_TIMINGS.NORMAL)),
    ]),
  ],
})
export class MediaDetailPageComponent implements OnInit {
  readonly service = inject(MediaDetailService);

  private readonly route = inject(ActivatedRoute);

  readonly MediaType = MediaType;

  /** Controls the files accordion open/closed state. */
  readonly filesOpen = signal(false);

  toggleFiles(): void {
    this.filesOpen.update((v) => !v);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.loadMedia(id);
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
