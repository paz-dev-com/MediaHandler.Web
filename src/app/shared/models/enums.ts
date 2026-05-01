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
