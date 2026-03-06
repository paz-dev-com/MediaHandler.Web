export interface WishlistItem {
  id: string;
  userId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  isAcquired: boolean;
  acquiredAt: string | null;
  notes: string | null;
  createdAt: string;
}
