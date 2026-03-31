import { DecimalPipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
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
})
export class MediaDetailPageComponent implements OnInit {
  readonly service = inject(MediaDetailService);

  private readonly route = inject(ActivatedRoute);

  readonly MediaType = MediaType;

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
