import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@core/api/api.service';
import { AdminMediaFileLinkService } from '@core/services/admin-media-file-link.service';
import { Media, SeasonCompleteness } from '@shared/models/media.model';
import { TvSeason } from '@shared/models/tv.model';
import { UserMedia } from '@shared/models/user.model';
import { MediaType } from '@shared/models/enums';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MediaDetailService {
  private readonly api = inject(ApiService);
  private readonly fileLinkService = inject(AdminMediaFileLinkService);

  readonly media = signal<Media | null>(null);
  readonly seasons = signal<TvSeason[]>([]);
  readonly loading = signal(false);
  readonly seasonsLoading = signal(false);
  readonly error = signal<string | null>(null);
  /** Set when seasons endpoint fails */
  readonly seasonsError = signal<string | null>(null);
  /** Set when media files data is missing or malformed */
  readonly filesError = signal<string | null>(null);
  /** Season completeness data (TV shows only) */
  readonly completeness = signal<SeasonCompleteness[]>([]);
  /** Loading state for completeness data */
  readonly completenessLoading = signal(false);
  /** Error state for completeness data */
  readonly completenessError = signal<string | null>(null);

  loadMedia(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.seasonsError.set(null);
    this.filesError.set(null);
    this.api
      .get<Media>(`media/${id}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          // T117: Apply null-safety for all array fields from API response
          const data = response.data;
          const safeMedia: Media = {
            ...data,
            genres: data.genres ?? [],
            files: data.files ?? [],
          };
          this.media.set(safeMedia);
          if (safeMedia.type === MediaType.TvShow) {
            this.loadSeasons(id);
            this.loadCompleteness(id);
          }
        },
        error: () => this.error.set('Failed to load media details'),
      });
  }

  loadSeasons(mediaId: string): void {
    this.seasonsLoading.set(true);
    this.seasonsError.set(null);
    this.api
      .get<TvSeason[]>(`media/${mediaId}/seasons`)
      .pipe(finalize(() => this.seasonsLoading.set(false)))
      .subscribe({
        next: (response) => this.seasons.set(response.data ?? []),
        error: () => this.seasonsError.set('Failed to load seasons'),
      });
  }

  /** T034: Load per-season completeness for a TV show. */
  loadCompleteness(mediaId: string): void {
    this.completenessLoading.set(true);
    this.completenessError.set(null);
    this.api
      .get<SeasonCompleteness[]>(`media/${mediaId}/completeness`)
      .pipe(finalize(() => this.completenessLoading.set(false)))
      .subscribe({
        next: (response) => this.completeness.set(response.data ?? []),
        error: () => this.completenessError.set('Failed to load completeness data'),
      });
  }

  toggleWatched(isWatched: boolean): void {
    const current = this.media();
    if (!current) return;

    this.api.put<UserMedia>(`media/${current.id}/watched`, { isWatched }).subscribe({
      next: (response) => {
        this.media.update((m) => (m ? { ...m, userMedia: response.data } : m));
      },
    });
  }

  toggleEpisodeWatched(
    mediaId: string,
    seasonId: string,
    episodeId: string,
    isWatched: boolean,
  ): void {
    this.api
      .put(`media/${mediaId}/seasons/${seasonId}/episodes/${episodeId}/watched`, { isWatched })
      .subscribe({
        next: () => {
          this.seasons.update((seasons) =>
            seasons.map((s) =>
              s.id === seasonId
                ? {
                    ...s,
                    watchedCount: isWatched ? s.watchedCount + 1 : Math.max(0, s.watchedCount - 1),
                    episodes: s.episodes.map((ep) =>
                      ep.id === episodeId ? { ...ep, isWatched } : ep,
                    ),
                  }
                : s,
            ),
          );
        },
      });
  }

  /** T017: Link an unlinked MediaFile to this media, then refresh. */
  linkFile(mediaId: string, fileId: string): void {
    this.fileLinkService.linkFile(mediaId, fileId).subscribe({
      next: () => this.loadMedia(mediaId),
      error: () => this.filesError.set('Failed to link file'),
    });
  }

  /** T017: Unlink a MediaFile from this media, then refresh. */
  unlinkFile(mediaId: string, fileId: string): void {
    this.fileLinkService.unlinkFile(mediaId, fileId).subscribe({
      next: () => this.loadMedia(mediaId),
      error: () => this.filesError.set('Failed to unlink file'),
    });
  }

  /** T027: Update the root folder override for this media, then refresh. */
  updateRootFolder(mediaId: string, path: string | null): void {
    this.fileLinkService.updateRootFolder(mediaId, path).subscribe({
      next: () => this.loadMedia(mediaId),
      error: () => this.error.set('Failed to update root folder'),
    });
  }
}
