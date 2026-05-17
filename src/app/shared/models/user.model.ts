import { UserRole } from './enums';

export interface UserMedia {
  id: string;
  userId: string;
  mediaId: string;
  isWatched: boolean;
  watchedAt: string | null;
  personalRating: number | null;
  notes: string | null;
}

export interface UserEpisode {
  id: string;
  userId: string;
  episodeId: string;
  isWatched: boolean;
  watchedAt: string | null;
}

export interface User {
  id: string;
  oktaId: string;
  email: string;
  displayName: string | null;
  preferredLanguage: string;
  role: UserRole;
  isActive: boolean;
  /** Custom profile picture path from the backend uploads directory */
  profilePicturePath: string | null;
}
