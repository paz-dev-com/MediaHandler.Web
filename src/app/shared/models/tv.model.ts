import { UserEpisode } from './user.model';

export interface TvEpisode {
  id: string;
  seasonId: string;
  episodeNumber: number;
  name: string;
  overview: string | null;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  userEpisode: UserEpisode | null;
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
  tvEpisodes: TvEpisode[];
  watchedCount: number;
}
