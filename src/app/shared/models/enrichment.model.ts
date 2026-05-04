import { EnrichmentStatus } from './enums';

export interface EnrichmentError {
  fileId: string;
  filePath: string;
  reason: string;
}

export interface EnrichmentRun {
  id: string;
  status: EnrichmentStatus;
  startedAt: string;
  finishedAt: string | null;
  enriched: number;
  failed: number;
  skipped: number;
  errors: EnrichmentError[];
}

export interface EnrichmentSummary {
  newEntries: number;
  changedEntries: number;
  skippedEntries: number;
}
