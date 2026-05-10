export interface TvEpisode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  name: string;
  overview: string | null;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  /** Backend returns isWatched as a flat boolean (not nested userEpisode) */
  isWatched: boolean;
}

export interface TvSeason {
  id: string;
  mediaId: string;
  seasonNumber: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  posterPath: string | null;
  episodeCount: number | null;
  /** Backend returns episodes as "episodes" (not "tvEpisodes") */
  episodes: TvEpisode[];
  watchedCount: number;
}
