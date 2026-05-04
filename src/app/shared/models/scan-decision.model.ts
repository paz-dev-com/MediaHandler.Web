import { MediaType } from './enums';
import { ScanDecisionType } from './enums';
import { TmdbCandidate } from './review.model';

export interface ScanItemDecision {
  id: string;
  scanRunId: string;
  filePath: string;
  decisionType: ScanDecisionType;
  mediaType: MediaType | null;
  libraryRootId: string;
  parsedTitle: string | null;
  parsedYear: number | null;
  parsedSeason: number | null;
  parsedEpisode: number | null;
  candidates: TmdbCandidate[];
  assignedTmdbId: number | null;
  assignedKind: MediaType | null;
  assignedTitle: string | null;
  assignedYear: number | null;
  assignedPosterPath: string | null;
  decidedAt: string;
}

export interface TvShowGroup {
  groupId: string;
  scanRunId: string;
  parsedShowName: string;
  episodeCount: number;
  assignedTmdbId: number | null;
  assignedTitle: string | null;
  assignedPosterPath: string | null;
}
