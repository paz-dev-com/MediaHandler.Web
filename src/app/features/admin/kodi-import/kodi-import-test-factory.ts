import {
  ImportCounts,
  ImportItemOutcome,
  ImportRun,
  ImportRunDetail,
  KodiPathMapping,
} from '@shared/models/kodi-import.model';
import {
  ImportItemStatus,
  ImportLinkStatus,
  ImportRunStatus,
  KodiImportMode,
  KodiItemKind,
  MediaType,
} from '@shared/models/enums';

export function makeImportCounts(overrides: Partial<ImportCounts> = {}): ImportCounts {
  return {
    totalItems: 0,
    moviesCreated: 0,
    showsCreated: 0,
    episodesCreated: 0,
    itemsReused: 0,
    itemsUnchanged: 0,
    filesLinked: 0,
    unmatchedPaths: 0,
    noScannedFiles: 0,
    unsupportedLocations: 0,
    conflicts: 0,
    noLongerInKodi: 0,
    needsReview: 0,
    identityLookupFailures: 0,
    skippedMusicVideos: 0,
    ...overrides,
  };
}

export function makeImportRun(overrides: Partial<ImportRun> = {}): ImportRun {
  return {
    id: 'run-1',
    mode: KodiImportMode.Import,
    status: ImportRunStatus.Running,
    sourceFileName: 'MyVideos121.db',
    schemaVersion: 121,
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: null,
    failureReason: null,
    counts: makeImportCounts(),
    ...overrides,
  };
}

export function makeImportRunDetail(overrides: Partial<ImportRunDetail> = {}): ImportRunDetail {
  return {
    ...makeImportRun(),
    unmatchedPrefixes: [],
    ...overrides,
  };
}

export function makeImportItemOutcome(
  overrides: Partial<ImportItemOutcome> = {},
): ImportItemOutcome {
  return {
    id: 'item-1',
    itemKind: KodiItemKind.Movie,
    kodiItemId: 1,
    title: 'Test Movie',
    mediaKind: MediaType.Film,
    outcome: ImportItemStatus.Created,
    linkOutcome: ImportLinkStatus.Linked,
    linkedFileCount: 1,
    reason: null,
    kodiPathPrefix: null,
    mediaId: null,
    ...overrides,
  };
}

export function makePathMapping(overrides: Partial<KodiPathMapping> = {}): KodiPathMapping {
  return {
    id: 'mapping-1',
    kodiPrefix: 'smb://FREEBOX/Films/',
    nasPrefix: '/nas/Movies/',
    sortOrder: 1,
    ...overrides,
  };
}

export function makeFile(name: string, content = ''): File {
  const file = new File([content], name);
  Object.defineProperty(file, 'arrayBuffer', {
    value: () => Promise.resolve(new ArrayBuffer(content.length)),
    writable: false,
    configurable: true,
  });
  return file;
}
