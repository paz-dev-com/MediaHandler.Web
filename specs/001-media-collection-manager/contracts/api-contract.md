# API Contract: Media Collection Manager

**Feature**: 001-media-collection-manager  
**Date**: 2026-03-05  
**Backend**: MediaHandler.API (ASP.NET Core, base URL: `/api/v1/`)

All endpoints require Okta JWT Bearer authentication unless noted. All responses use the `ApiResponse<T>` envelope. Rate limit: 100 req/min.

## Authentication Endpoints

### POST /api/v1/auth/sync

Syncs user profile from JWT claims on login. Creates or updates the user record.

- **Auth**: User
- **Request**: Empty body (reads JWT claims: sub, email, name)
- **Response**: `ApiResponse<User>`

### GET /api/v1/auth/me

Returns the current authenticated user's profile.

- **Auth**: User
- **Response**: `ApiResponse<User>`

### PUT /api/v1/auth/preferences

Updates the user's preferred language.

- **Auth**: User
- **Request Body**: `{ preferredLanguage: string }` (e.g., `"en"` or `"fr"`)
- **Response**: `ApiResponse<User>`

## Media Endpoints

### GET /api/v1/media/stats

Returns collection statistics for the current user.

- **Auth**: User
- **Response**: `ApiResponse<CollectionStats>`

### GET /api/v1/media

Returns a paginated, filterable list of media.

- **Auth**: User
- **Query Parameters**:
  - `page` (number, default 1)
  - `pageSize` (number, default 20)
  - `search` (string, optional — filters by title/originalTitle)
  - `type` (string, optional — `"Film"` or `"TvShow"`)
  - `isWatched` (boolean, optional — filter by current user's watch status)
  - `genre` (string, optional — filter by genre name)
- **Response**: `ApiResponse<Media[]>` with `PaginationMeta`

### GET /api/v1/media/{id}

Returns a single media item with genres, files, and the current user's watch status.

- **Auth**: User
- **Path Parameters**: `id` (UUID)
- **Response**: `ApiResponse<Media>` (includes `genres`, `mediaFiles`, `userMedia`)

### PUT /api/v1/media/{id}/watched

Toggles the watched status of a media item for the current user.

- **Auth**: User
- **Path Parameters**: `id` (UUID)
- **Request Body**: `{ isWatched: boolean }`
- **Response**: `ApiResponse<UserMedia>`

## Episode Endpoints

### GET /api/v1/media/{mediaId}/seasons

Returns all seasons for a TV show with episodes and per-episode watch status.

- **Auth**: User
- **Path Parameters**: `mediaId` (UUID)
- **Response**: `ApiResponse<TvSeason[]>` (each season includes `tvEpisodes` with `userEpisode`, and `watchedCount`)

### PUT /api/v1/media/{mediaId}/seasons/{seasonId}/episodes/{episodeId}/watched

Toggles the watched status of a single episode.

- **Auth**: User
- **Path Parameters**: `mediaId` (UUID), `seasonId` (UUID), `episodeId` (UUID)
- **Request Body**: `{ isWatched: boolean }`
- **Response**: `ApiResponse<UserEpisode>`

## TMDB Endpoints

### GET /api/v1/tmdb/search

Searches TMDB for films and TV shows.

- **Auth**: User
- **Query Parameters**:
  - `query` (string, required — search term)
  - `language` (string, optional — e.g., `"en"`, `"fr"`)
- **Response**: `ApiResponse<TmdbSearchResult[]>`

#### TmdbSearchResult

| Field | Type | Description |
|-------|------|-------------|
| `tmdbId` | `number` | TMDB identifier |
| `title` | `string` | Display title |
| `overview` | `string \| null` | Synopsis |
| `posterPath` | `string \| null` | TMDB poster path |
| `releaseDate` | `string \| null` | ISO date |
| `mediaType` | `string` | `"movie"` or `"tv"` |
| `voteAverage` | `number \| null` | Rating |

### POST /api/v1/tmdb/import/{tmdbId}

Imports a media from TMDB into the collection. Deduplicates by TMDB ID.

- **Auth**: User
- **Path Parameters**: `tmdbId` (number)
- **Query Parameters**:
  - `mediaType` (string, required — `"movie"` or `"tv"`)
  - `language` (string, optional)
- **Response**: `ApiResponse<Media>` (the newly created or existing media)

## Wishlist Endpoints

### GET /api/v1/wishlist

Returns the current user's paginated wishlist.

- **Auth**: User
- **Query Parameters**:
  - `page` (number, default 1)
  - `pageSize` (number, default 20)
- **Response**: `ApiResponse<WishlistItem[]>` with `PaginationMeta`

### POST /api/v1/wishlist

Adds an item to the current user's wishlist. Deduplicates by (userId, tmdbId).

- **Auth**: User
- **Request Body**: `{ tmdbId: number, title: string, posterPath?: string, releaseDate?: string, notes?: string }`
- **Response**: `ApiResponse<WishlistItem>`

### PUT /api/v1/wishlist/{id}/acquired

Toggles the acquired status of a wishlist item.

- **Auth**: User
- **Path Parameters**: `id` (UUID)
- **Request Body**: `{ isAcquired: boolean }`
- **Response**: `ApiResponse<WishlistItem>`

### DELETE /api/v1/wishlist/{id}

Removes a wishlist item.

- **Auth**: User
- **Path Parameters**: `id` (UUID)
- **Response**: `ApiResponse<null>`

## TMDB Image URLs

TMDB image paths (posterPath, backdropPath, stillPath) are relative. Construct full URLs as:

```
https://image.tmdb.org/t/p/{size}{path}
```

Common sizes:
- Poster: `w185`, `w342`, `w500`, `original`
- Backdrop: `w780`, `w1280`, `original`
- Still: `w300`, `original`

## Error Response Format

All error responses use the same envelope:

```json
{
  "data": null,
  "meta": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Human-readable error message"
    }
  ]
}
```

HTTP status codes:
- `400` — Validation error
- `401` — Unauthorized (missing or invalid JWT)
- `403` — Forbidden (insufficient role)
- `404` — Resource not found
- `409` — Conflict (duplicate)
- `429` — Rate limited
- `500` — Server error
