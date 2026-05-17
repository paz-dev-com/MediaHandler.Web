import { MediaType } from './enums';
import { ScanDecisionType } from './enums';
import { TmdbCandidate } from './review.model';

export interface ScanItemDecision {
  id: string;
  scanRunId: string;
  filePath: string;
  /** Maps to API field `decisionType` (ScanDecisionKind enum). */
  decisionType: ScanDecisionType;
  reason: string | null;
  parsedTitle: string | null;
  parsedYear: number | null;
  parsedSeason: number | null;
  parsedEpisode: number | null;
  /** Maps to API field `mediaType` (parsed media type inferred by the scanner). */
  kind: MediaType | null;
  candidates: TmdbCandidate[];
  assignedTmdbId: number | null;
  /** Maps to API field `assignedKind`. */
  assignedKind: MediaType | null;
  assignedTitle: string | null;
  assignedYear: number | null;
  assignedPosterPath: string | null;
  libraryRootId: string | null;
  /** UUID of the linked MediaFile — used for the file rename endpoint. */
  mediaFileId: string | null;
  /** Maps to API field `decidedAt` (row creation timestamp). */
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

/** Maps to backend `ScanDecisionShowGroupDto` — server-side grouped endpoint */
export interface ScanDecisionShowGroup {
  /** Deterministic UUID from SHA-256(scanId|parsedTitle). Null for single-item movie groups. */
  groupId?: string | null;
  showName: string;
  episodeCount: number;
  assignedTmdbId: number | null;
  assignedKind: string | null;
  assignedTitle: string | null;
  assignedYear: number | null;
  assignedPosterPath: string | null;
  episodes: ScanItemDecision[];
  /** Aggregated TMDB candidates at show level (from episodes[0] if not provided by backend). */
  candidates?: TmdbCandidate[];
}
