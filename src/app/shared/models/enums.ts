export enum MediaType {
  Film = 'Film',
  TvShow = 'TvShow',
}

export enum UserRole {
  User = 'User',
  Admin = 'Admin',
}

export enum LibraryRootKind {
  Movies = 'Movies',
  TvShows = 'TvShows',
  Mixed = 'Mixed',
}

export enum ScanMode {
  Full = 'Full',
  Incremental = 'Incremental',
}

export enum ScanStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
}

export enum ReviewStatus {
  Open = 'Open',
  Resolved = 'Resolved',
  Dismissed = 'Dismissed',
}

export enum ReviewReason {
  NoTmdbResult = 'NoTmdbResult',
  MultipleCandidates = 'MultipleCandidates',
  YearMismatch = 'YearMismatch',
  UnparseableEpisode = 'UnparseableEpisode',
  NfoMalformed = 'NfoMalformed',
  UnknownFormat = 'UnknownFormat',
  OrphanedAfterMissing = 'OrphanedAfterMissing',
}

export enum ReviewResolutionAction {
  Assign = 'Assign',
  Dismiss = 'Dismiss',
  Delete = 'Delete',
  Reopen = 'Reopen',
}

export enum ScanDecisionType {
  Added = 'Added',
  Updated = 'Updated',
  Unchanged = 'Unchanged',
  Removed = 'Removed',
  Excluded = 'Excluded',
  NeedsReview = 'NeedsReview',
}

export enum EnrichmentStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum KodiImportMode {
  Import = 'Import',
  Preview = 'Preview',
}

export enum ImportRunStatus {
  Pending = 'Pending',
  Running = 'Running',
  Completed = 'Completed',
  Failed = 'Failed',
}

export enum KodiItemKind {
  Movie = 'Movie',
  TvShow = 'TvShow',
  Episode = 'Episode',
  MusicVideo = 'MusicVideo',
}

export enum ImportItemStatus {
  Created = 'Created',
  Reused = 'Reused',
  Unchanged = 'Unchanged',
  NeedsReview = 'NeedsReview',
  RequiresIdentityLookup = 'RequiresIdentityLookup',
  IdentityLookupFailed = 'IdentityLookupFailed',
  Conflict = 'Conflict',
  SkippedMusicVideo = 'SkippedMusicVideo',
  NoLongerInKodi = 'NoLongerInKodi',
}

export enum ImportLinkStatus {
  Linked = 'Linked',
  AlreadyLinked = 'AlreadyLinked',
  PartiallyLinked = 'PartiallyLinked',
  UnmatchedPath = 'UnmatchedPath',
  NoScannedFile = 'NoScannedFile',
  UnsupportedLocation = 'UnsupportedLocation',
  Conflict = 'Conflict',
}
