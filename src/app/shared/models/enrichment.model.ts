import { EnrichmentStatus } from './enums';

/** Maps to backend `EnrichmentErrorDetailDto` */
export interface EnrichmentErrorDetail {
  mediaId: string;
  tmdbId: number | null;
  title: string | null;
  error: string;
}

/** Maps to backend `EnrichmentMediaDetailDto` — per-media details for an enrichment run */
export interface EnrichmentMediaDetail {
  mediaId: string;
  tmdbId: number | null;
  title: string | null;
  type: string;
  status: 'Enriched' | 'Failed' | 'Skipped';
  fileCount: number;
  fileNames: string[];
  error: string | null;
}

/** Legacy interface kept for backward compatibility */
export interface EnrichmentError {
  fileId: string;
  filePath: string;
  reason: string;
}

/** Maps to backend `EnrichmentRunDto` */
export interface EnrichmentRun {
  enrichmentRunId: string;
  status: EnrichmentStatus;
  startedAt: string;
  finishedAt: string | null;
  totalItems: number;
  enrichedCount: number;
  failedCount: number;
  skippedCount: number;
  currentItem: string | null;
  errorDetails: EnrichmentErrorDetail[];
  /** Legacy fields kept for backward compat */
  id?: string;
  enriched?: number;
  failed?: number;
  skipped?: number;
  errors?: EnrichmentError[];
}

/** Maps to backend `EnrichmentSummaryDto` */
export interface EnrichmentSummaryDetail {
  newCount: number;
  changedCount: number;
  skippedCount: number;
  totalEligible: number;
}

/** Legacy summary interface */
export interface EnrichmentSummary {
  newEntries: number;
  changedEntries: number;
  skippedEntries: number;
}
