import { ScanMode, ScanStatus } from './enums';
import { ReviewItem } from './review.model';

export interface ScanCounts {
  totalDiscovered: number;
  added: number;
  updated: number;
  unchanged: number;
  removed: number;
  excluded: number;
  needsReview: number;
}

export interface ScanRunSummary {
  id: string;
  mode: ScanMode;
  status: ScanStatus;
  startedAt: string;
  finishedAt: string | null;
  libraryRootIds: string[];
  counts: ScanCounts;
}

export interface ScanRunDetail extends ScanRunSummary {
  failureReason: string | null;
  reviewItems: ReviewItem[] | null;
}
