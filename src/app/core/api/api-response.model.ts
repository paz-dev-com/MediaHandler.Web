export interface ApiError {
  code: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: PaginationMeta | null;
  errors: ApiError[];
}

export interface CollectionStats {
  totalMedia: number;
  totalFilms: number;
  totalTvShows: number;
  totalWatched: number;
  totalUnwatched: number;
  totalFiles: number;
  totalUnlinkedFiles: number;
  incompleteTvShowCount: number;
}
