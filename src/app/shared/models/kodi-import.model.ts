import {
  ImportItemStatus,
  ImportLinkStatus,
  ImportRunStatus,
  KodiImportMode,
  KodiItemKind,
  MediaType,
} from './enums';

export interface ImportCounts {
  totalItems: number;
  moviesCreated: number;
  showsCreated: number;
  episodesCreated: number;
  itemsReused: number;
  itemsUnchanged: number;
  filesLinked: number;
  unmatchedPaths: number;
  noScannedFiles: number;
  unsupportedLocations: number;
  conflicts: number;
  noLongerInKodi: number;
  needsReview: number;
  identityLookupFailures: number;
  skippedMusicVideos: number;
}

export interface ImportRun {
  id: string;
  mode: KodiImportMode;
  status: ImportRunStatus;
  sourceFileName: string;
  schemaVersion: number;
  startedAt: string;
  finishedAt: string | null;
  failureReason: string | null;
  counts: ImportCounts;
}

export interface ImportRunDetail extends ImportRun {
  unmatchedPrefixes: string[];
}

export interface ImportItemOutcome {
  id: string;
  itemKind: KodiItemKind;
  kodiItemId: number;
  title: string;
  mediaKind: MediaType | null;
  outcome: ImportItemStatus;
  linkOutcome: ImportLinkStatus | null;
  linkedFileCount: number;
  reason: string | null;
  kodiPathPrefix: string | null;
  mediaId: string | null;
}

export interface KodiPathMapping {
  id: string;
  kodiPrefix: string;
  nasPrefix: string;
  sortOrder: number;
}
