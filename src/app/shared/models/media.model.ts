import { MediaType } from './enums';
import { UserMedia } from './user.model';

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
  /** Backend returns an array of genre name strings */
  genres: string[] | null;
  /** Backend returns this as "files" (not "mediaFiles") */
  files: MediaFile[] | null;
  userMedia: UserMedia | null;
  createdAt: string;
  updatedAt: string;
  /** TV series production status (e.g. 'Returning Series', 'Ended') */
  status: string | null;
  /** Total number of seasons according to TMDB */
  numberOfSeasons: number | null;
}
