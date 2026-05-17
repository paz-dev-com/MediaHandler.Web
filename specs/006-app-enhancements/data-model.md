# Data Model: Application Enhancements

**Feature**: 006-app-enhancements  
**Date**: 2025-07-24

## Entity Changes

### 1. Media (extended — frontend model only)

The backend `Media` entity already has `Status` and `NumberOfSeasons`. The change is adding them to `MediaDto` (API) and `Media` interface (frontend).

**Backend DTO change** (`MediaDto.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Status` | `string?` | TMDB production status: "Returning Series", "Ended", "Released", etc. |
| `NumberOfSeasons` | `int?` | Total season count from TMDB. Null for films. |

**Frontend model change** (`media.model.ts`):
| Field | Type | Description |
|-------|------|-------------|
| `status` | `string \| null` | Production status from TMDB metadata |
| `numberOfSeasons` | `number \| null` | Total season count from TMDB. Null for films |

### 2. User (extended — requires API change)

**Backend entity change** (`User.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `ProfilePicturePath` | `string?` | Relative path to server-stored custom profile picture. Null when using auth provider default. |

**Backend DTO change** (`UserDto.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `ProfilePicturePath` | `string?` | URL/path to custom profile picture, or null |

**Frontend model change** (`user.model.ts`):
| Field | Type | Description |
|-------|------|-------------|
| `profilePicturePath` | `string \| null` | Server-stored custom profile picture path |

### 3. StartScanRequest (extended — requires API change)

**Backend request change** (`ScanRequests.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Language` | `string?` | Optional TMDB language code (e.g., "en", "fr"). Null falls back to API default. |

**Backend command change** (`StartScanCommand.cs`):
| Field | Type | Description |
|-------|------|-------------|
| `Language` | `string?` | Passed through to TMDB matcher during scan |

## New Frontend Types

### ProfilePictureUploadResponse

```typescript
// No new model needed — the upload endpoint returns the updated User object
```

### WishlistLookup (computed, not stored)

```typescript
// Computed signal in TmdbSearchPageComponent
// wishlistTmdbIds: Signal<Set<number>>
// Derived from wishlistService.items().map(i => i.tmdbId)
```

### MissingSeason (computed, not stored)

```typescript
interface MissingSeason {
  seasonNumber: number;
  /** True if this season exists on TMDB but is not in the user's collection */
  isMissing: true;
}
```

## Relationships

```text
User 1──* ProfilePicture (0..1 custom, default from Auth0 ID token `picture` claim)
Media 1──* TvSeason (existing)
Media.numberOfSeasons ──> compared against TvSeason[] count for missing detection
WishlistItem.tmdbId ──> cross-referenced with TmdbSearchResult.id for indicator
StartScanRequest ──> StartScanCommand ──> ScanStartParameters ──> ITmdbMatcher (language)
```

## Validation Rules

| Entity                 | Field     | Rule                                                                        |
| ---------------------- | --------- | --------------------------------------------------------------------------- |
| Profile Picture Upload | file type | Must be JPEG, PNG, or WebP                                                  |
| Profile Picture Upload | file size | Must be ≤ 2 MB                                                              |
| StartScanRequest       | Language  | Optional; if provided, must be a valid IETF language tag (e.g., "en", "fr") |

## State Transitions

### Profile Picture State

```text
[No Custom Picture] ──upload──> [Custom Picture Active]
[Custom Picture Active] ──remove──> [No Custom Picture]
[No Custom Picture] ──display──> Auth0 picture or generic avatar
[Custom Picture Active] ──display──> Custom uploaded picture
```

### TV Show Production Status Display

```text
Media.status == "Returning Series" ──> Show "Still in Production" badge
Media.status == "Ended" ──> Show "Ended" badge
Media.status == null/unknown ──> Show "Unknown" badge
```
