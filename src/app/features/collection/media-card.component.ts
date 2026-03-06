import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { MediaType } from '@shared/models/enums';
import { Media } from '@shared/models/media.model';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-media-card',
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoModule, ButtonModule, TagModule, CardModule, TooltipModule, SlicePipe],
})
export class MediaCardComponent {
  readonly media = input.required<Media>();
  readonly watchedToggle = output<{ mediaId: string; isWatched: boolean }>();

  readonly MediaType = MediaType;

  get posterUrl(): string | null {
    return new TmdbImagePipe().transform(this.media().posterPath, 'w342');
  }

  onToggleWatched(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const item = this.media();
    const currentlyWatched = item.userMedia?.isWatched ?? false;
    this.watchedToggle.emit({ mediaId: item.id, isWatched: !currentlyWatched });
  }
}
