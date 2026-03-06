import { MediaType } from './enums';
import { TvSeason } from './tv.model';
import { UserMedia } from './user.model';

export interface MediaGenre {
  mediaId: string;
  name: string;
}

export interface MediaFile {
  id: string;
  mediaId: string | null;
  filePath: string;
  fileSizeBytes: number | null;
  format: string | null;
  resolution: string | null;
}

export interface Media {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  type: MediaType;
  releaseDate: string | null;
  runtime: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  language: string | null;
  genres: MediaGenre[];
  mediaFiles: MediaFile[];
  userMedia: UserMedia | null;
  tvSeasons: TvSeason[];
  createdAt: string;
  updatedAt: string;
}
