# Data Model: Media Collection Manager

**Feature**: 001-media-collection-manager  
**Date**: 2026-03-05  
**Source**: MediaHandler.API domain entities + feature spec

## Enums

### MediaType

| Value | Description |
|-------|-------------|
| `Film` | A movie / film |
| `TvShow` | A television series |

### UserRole

| Value | Description |
|-------|-------------|
| `User` | Standard authenticated user |
| `Admin` | Administrator with elevated privileges |

## Entities

### Media

Represents a film or TV show in the user's collection.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `tmdbId` | `number` | Yes | TMDB external identifier (used for deduplication) |
| `title` | `string` | Yes | Display title |
| `originalTitle` | `string \| null` | No | Title in original language |
| `overview` | `string \| null` | No | Synopsis / description |
| `type` | `MediaType` | Yes | Film or TvShow |
| `releaseDate` | `string \| null` | No | ISO date string |
| `runtime` | `number \| null` | No | Duration in minutes |
| `posterPath` | `string \| null` | No | TMDB poster image path |
| `backdropPath` | `string \| null` | No | TMDB backdrop image path |
| `voteAverage` | `number \| null` | No | TMDB average rating |
| `voteCount` | `number \| null` | No | TMDB vote count |
| `language` | `string \| null` | No | Original language code |
| `genres` | `MediaGenre[]` | Yes | Associated genres |
| `mediaFiles` | `MediaFile[]` | Yes | NAS files linked to this media |
| `userMedia` | `UserMedia \| null` | No | Current user's watch status (populated per-request) |
| `tvSeasons` | `TvSeason[]` | No | Seasons (only for TvShow type) |
| `createdAt` | `string` | Yes | ISO datetime |
| `updatedAt` | `string` | Yes | ISO datetime |

### MediaGenre

Value object representing a genre assigned to a media item.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mediaId` | `string` (UUID) | Yes | Parent media ID |
| `name` | `string` | Yes | Genre name (e.g., "Action", "Comedy") |

### MediaFile

Represents a physical file on the NAS linked to a media item.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `mediaId` | `string \| null` | No | Parent media ID (null = unlinked file from NAS scan) |
| `filePath` | `string` | Yes | Full NAS path to the file |
| `fileSizeBytes` | `number \| null` | No | File size in bytes |
| `format` | `string \| null` | No | File format (e.g., "mkv", "mp4") |
| `resolution` | `string \| null` | No | Video resolution (e.g., "1080p", "4K") |

### TvSeason

Represents a season within a TV show.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `mediaId` | `string` (UUID) | Yes | Parent media ID |
| `seasonNumber` | `number` | Yes | Season number |
| `name` | `string` | Yes | Season display name |
| `overview` | `string \| null` | No | Season synopsis |
| `airDate` | `string \| null` | No | ISO date of first episode |
| `posterPath` | `string \| null` | No | TMDB poster path |
| `episodeCount` | `number \| null` | No | Total number of episodes |
| `tvEpisodes` | `TvEpisode[]` | Yes | Episodes in this season |
| `watchedCount` | `number` | Yes | Number of episodes watched by current user |

### TvEpisode

Represents a single episode within a TV season.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `seasonId` | `string` (UUID) | Yes | Parent season ID |
| `episodeNumber` | `number` | Yes | Episode number within the season |
| `name` | `string` | Yes | Episode title |
| `overview` | `string \| null` | No | Episode synopsis |
| `stillPath` | `string \| null` | No | TMDB still image path |
| `airDate` | `string \| null` | No | ISO air date |
| `runtime` | `number \| null` | No | Duration in minutes |
| `userEpisode` | `UserEpisode \| null` | No | Current user's watch status for this episode |

### UserMedia

Per-user watch tracking for a media item (film or TV show).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `userId` | `string` (UUID) | Yes | User ID |
| `mediaId` | `string` (UUID) | Yes | Media ID |
| `isWatched` | `boolean` | Yes | Whether the user has watched this media |
| `watchedAt` | `string \| null` | No | ISO datetime when marked watched (null if unwatched) |
| `personalRating` | `number \| null` | No | User's personal rating |
| `notes` | `string \| null` | No | User's personal notes |

### UserEpisode

Per-user watch tracking for a single TV episode.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `userId` | `string` (UUID) | Yes | User ID |
| `episodeId` | `string` (UUID) | Yes | Episode ID |
| `isWatched` | `boolean` | Yes | Whether the user has watched this episode |
| `watchedAt` | `string \| null` | No | ISO datetime when marked watched |

### User

Authenticated user profile.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `oktaId` | `string` | Yes | External Okta identity provider ID |
| `email` | `string` | Yes | User email address |
| `displayName` | `string \| null` | No | User display name |
| `preferredLanguage` | `string` | Yes | Language code ("en" or "fr"), default "en" |
| `role` | `UserRole` | Yes | User or Admin |
| `isActive` | `boolean` | Yes | Whether the account is active |

### WishlistItem

A media the user wants to acquire (references TMDB, not local collection).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `userId` | `string` (UUID) | Yes | Owner user ID |
| `tmdbId` | `number` | Yes | TMDB external identifier |
| `title` | `string` | Yes | Media title |
| `posterPath` | `string \| null` | No | TMDB poster image path |
| `releaseDate` | `string \| null` | No | ISO date string |
| `isAcquired` | `boolean` | Yes | Whether the media has been obtained |
| `acquiredAt` | `string \| null` | No | ISO datetime when acquired |
| `notes` | `string \| null` | No | User's personal notes |
| `createdAt` | `string` | Yes | ISO datetime |

## Entity Relationships

```
User 1 ──* UserMedia *── 1 Media
User 1 ──* UserEpisode *── 1 TvEpisode
User 1 ──* WishlistItem

Media 1 ──* MediaFile       (MediaFile.mediaId nullable = "unlinked")
Media 1 ──* MediaGenre
Media 1 ──* TvSeason 1 ──* TvEpisode
```

## API Response Envelope

All API endpoints return responses wrapped in a standard envelope:

### ApiResponse\<T\>

| Field | Type | Description |
|-------|------|-------------|
| `data` | `T` | Response payload |
| `meta` | `PaginationMeta \| null` | Pagination metadata (for list endpoints) |
| `errors` | `ApiError[]` | Error details (empty on success) |

### PaginationMeta

| Field | Type | Description |
|-------|------|-------------|
| `page` | `number` | Current page (1-based) |
| `pageSize` | `number` | Items per page |
| `totalCount` | `number` | Total items across all pages |
| `totalPages` | `number` | Total number of pages |

### CollectionStats

| Field | Type | Description |
|-------|------|-------------|
| `totalMedia` | `number` | Total media items |
| `totalFilms` | `number` | Film count |
| `totalTvShows` | `number` | TV show count |
| `totalWatched` | `number` | Watched media count |
| `totalUnwatched` | `number` | Unwatched media count |
| `totalFiles` | `number` | Total NAS files |
| `totalUnlinkedFiles` | `number` | NAS files not linked to any media |

## State Transitions

### Watch Status (Media)

```
Unwatched → [toggle watched] → Watched (watchedAt = now)
Watched   → [toggle unwatched] → Unwatched (watchedAt = null)
```

### Wishlist Item

```
Added → [mark acquired] → Acquired (acquiredAt = now)
Acquired → [mark not acquired] → Added (acquiredAt = null)
Added/Acquired → [remove] → Deleted
```
