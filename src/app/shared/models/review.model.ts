import { MediaType, ReviewReason, ReviewStatus } from './enums';

export interface TmdbCandidate {
  tmdbId: number;
  kind: MediaType;
  title: string;
  year: number | null;
  score: number | null;
  posterPath: string | null;
}

export interface ReviewItem {
  id: string;
  filePath: string;
  reason: ReviewReason;
  status: ReviewStatus;
  parsedTitle: string | null;
  parsedYear: number | null;
  parsedSeason: number | null;
  parsedEpisode: number | null;
  candidates: TmdbCandidate[];
  resolvedTmdbId: number | null;
  resolvedKind: MediaType | null;
  resolvedAt: string | null;
  createdAt: string;
}
