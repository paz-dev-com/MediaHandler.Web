# Feature Specification: Media Collection Manager Web Interface

**Feature Branch**: `001-media-collection-manager`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "Web interface for an application that manages stored films and TV shows on a NAS. The user can see all of his collection and what he already saw. He can access directly to the folder where each file is stored on his NAS. He can also add medias he doesn't have yet to a list."

## Clarifications

### Session 2026-03-05

- Q: Should the collection page use a card grid, a list with thumbnails, or a switchable view? → A: Card grid — poster image cards in a responsive grid (like Plex/Netflix).
- Q: How should users navigate between sections (collection, TMDB search, wishlist, profile)? → A: Collapsible vertical sidebar with navigation icons and labels.
- Q: What should users see when their collection is empty (new user) or data is loading? → A: Onboarding prompt — empty state shows a friendly message with a call-to-action to search and import from TMDB.
- Q: Should users be able to mark an entire TV season as watched/unwatched in one action, or only individual episodes? → A: Mark all per season — a "mark season as watched/unwatched" toggle on each season header.
- Q: Should the application UI support multiple languages or be English-only? → A: Bilingual (English + French). English by default; French for users located in France. Users can switch language at any time.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse Media Collection (Priority: P1)

As a user, I want to browse my entire collection of films and TV shows stored on my NAS so I can see what I own at a glance. The collection page is the main landing page after login. I can see a responsive card grid of all my media with poster images, titles, and type indicators (film or TV show). I can search by title, filter by type (films/TV shows), filter by genre, and filter by watched/unwatched status. Results are paginated so large collections load efficiently. A collection statistics summary (total media count, films count, TV shows count, watched/unwatched counts) is displayed for quick overview.

**Why this priority**: This is the core value proposition — without a way to browse the collection, no other feature is useful. It provides immediate visibility into what the user owns.

**Independent Test**: Can be fully tested by logging in and verifying the media list loads with correct filtering, searching, and pagination. Delivers the primary value of seeing one's entire collection.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and has media in their collection, **When** they navigate to the collection page, **Then** they see a paginated list of all media items with poster images, titles, release dates, and type indicators.
2. **Given** the user is on the collection page, **When** they type a search term, **Then** the list filters in real time to show only media whose title matches the search.
3. **Given** the user is on the collection page, **When** they select a type filter (films or TV shows), **Then** only media of that type is displayed.
4. **Given** the user is on the collection page, **When** they select a genre filter, **Then** only media matching that genre is displayed.
5. **Given** the user is on the collection page, **When** they filter by "unwatched", **Then** only media they have not marked as watched is displayed.
6. **Given** the user has a large collection, **When** they scroll to the bottom of the current page, **Then** they can navigate to the next page of results.
7. **Given** the user is on the collection page, **When** the page loads, **Then** they see a statistics summary showing total media, films, TV shows, watched, and unwatched counts.

---

### User Story 2 - View Media Details & NAS File Access (Priority: P1)

As a user, I want to view detailed information about a specific film or TV show and directly access the folder on my NAS where the file is stored. When I click on a media item, I see its full details: title, original title, overview/description, release date, runtime, genres, ratings, poster and backdrop images, and my personal watch status. I can see all associated files stored on the NAS with their file paths, sizes, and formats. I can click a file path to open or copy the NAS folder location for direct access.

**Why this priority**: Viewing details and accessing files on the NAS is the second most essential feature — it's the reason the user stores media information in the first place: to find and play their files.

**Independent Test**: Can be tested by clicking any media item and verifying detail information loads correctly and file paths are displayed with clickable/copyable NAS paths.

**Acceptance Scenarios**:

1. **Given** the user is on the collection page, **When** they click on a media item, **Then** they see a detail view with title, original title, overview, release date, runtime, genres, rating, and poster/backdrop images.
2. **Given** the user is viewing a media detail, **When** the media has associated NAS files, **Then** each file is listed with its path, file size, and format.
3. **Given** the user is viewing a media detail with NAS file paths, **When** they click a file path, **Then** the NAS folder path is copied to their clipboard so they can navigate to it.
4. **Given** the user is viewing a TV show detail, **When** the show has seasons and episodes, **Then** they can browse seasons and see all episodes within each season with episode names, numbers, and air dates.

---

### User Story 3 - Track Watch Status (Priority: P2)

As a user, I want to mark films and TV show episodes as watched or unwatched so I can track what I've already seen. For films, I can toggle watched/unwatched directly from the collection list or the detail page. For TV shows, I can mark individual episodes as watched from the season/episode view. The season view shows progress (e.g., "5/12 episodes watched") so I can quickly see how far into a series I am.

**Why this priority**: Watch tracking is highly valuable for managing large collections — it prevents re-watching by accident and helps the user pick up where they left off, especially for TV series.

**Independent Test**: Can be tested by marking a film as watched and verifying the status persists, then marking episodes in a TV show and verifying the watch count updates per season.

**Acceptance Scenarios**:

1. **Given** the user is viewing the collection page, **When** they click a watch toggle on a film, **Then** the film is marked as watched and the UI updates immediately.
2. **Given** the user is viewing a film's detail page, **When** they click the "Mark as watched" button, **Then** the film's watch status updates and displays the watched date.
3. **Given** the user is viewing a film marked as watched, **When** they click the "Mark as unwatched" button, **Then** the film returns to unwatched status.
4. **Given** the user is viewing a TV show's seasons, **When** they mark an episode as watched, **Then** the episode shows as watched and the season's watched count increments (e.g., "6/12 episodes watched").
5. **Given** the user is viewing a TV show's season, **When** all episodes are marked as watched, **Then** the season is visually indicated as fully completed.
6. **Given** the user is viewing a TV show's season, **When** they click "Mark season as watched" on the season header, **Then** all episodes in that season are marked as watched and the season progress shows full completion.
7. **Given** the user is viewing a fully watched TV season, **When** they click "Mark season as unwatched" on the season header, **Then** all episodes in that season are reset to unwatched.

---

### User Story 4 - Search & Add Media from TMDB (Priority: P2)

As a user, I want to search for films and TV shows on TMDB (The Movie Database) and import them into my collection so I can keep my library up to date when I acquire new media. I can search TMDB by title from within the application. Search results display poster, title, release date, and overview. I can import a selected result which creates the media entry in my collection along with its metadata (genres, seasons/episodes for TV shows, images, ratings).

**Why this priority**: Being able to add new media is essential for growing the collection. TMDB integration provides rich metadata without manual entry, which saves significant time.

**Independent Test**: Can be tested by searching for a known film/show on TMDB, importing it, and verifying it appears in the collection with correct metadata.

**Acceptance Scenarios**:

1. **Given** the user navigates to the TMDB search feature, **When** they enter a search query, **Then** they see a list of matching results from TMDB with posters, titles, release dates, and overviews.
2. **Given** the user sees TMDB search results, **When** they select a result and click "Import", **Then** the media is added to their collection with full metadata.
3. **Given** the user imports a media that already exists in the collection (same TMDB ID), **When** the import completes, **Then** the system notifies them that the media already exists and navigates to it instead of duplicating it.
4. **Given** the user imports a TV show, **When** the import completes, **Then** all seasons and episodes are imported with their metadata.

---

### User Story 5 - Manage Wishlist (Priority: P3)

As a user, I want to maintain a wishlist of films and TV shows I don't own yet but want to acquire so I can keep track of what to look for. I can add media to my wishlist from TMDB search results. The wishlist displays all items with their poster, title, release date, and any personal notes. I can mark a wishlist item as "acquired" when I obtain the media. I can remove items from my wishlist.

**Why this priority**: The wishlist is a nice-to-have feature that adds value by helping users plan future acquisitions but is not essential for managing the existing collection.

**Independent Test**: Can be tested by adding a TMDB search result to the wishlist, verifying it appears in the wishlist view, marking it as acquired, and removing it.

**Acceptance Scenarios**:

1. **Given** the user is viewing TMDB search results, **When** they click "Add to wishlist" on a result, **Then** the media is added to their personal wishlist.
2. **Given** the user navigates to their wishlist, **When** it loads, **Then** they see all wishlist items with posters, titles, release dates, and personal notes.
3. **Given** the user is viewing their wishlist, **When** they mark an item as acquired, **Then** the item shows an "acquired" badge with the date.
4. **Given** the user tries to add a media already on their wishlist, **When** they click "Add to wishlist", **Then** the system notifies them the item is already on their wishlist.
5. **Given** the user is viewing their wishlist, **When** they delete an item, **Then** it is removed from the wishlist.

---

### User Story 6 - User Authentication & Profile (Priority: P1)

As a user, I want to log in securely so my collection, watch history, and wishlist are personal and protected. The application uses Auth0 for authentication. On first login, my user profile is automatically created. I can view my profile and update my preferred language.

**Why this priority**: Authentication is a prerequisite for all user-specific features (watch tracking, wishlist, personalized collection views). Without it, no personalized functionality works.

**Independent Test**: Can be tested by logging in with Auth0 credentials, verifying the profile sync completes, and updating the preferred language.

**Acceptance Scenarios**:

1. **Given** the user is not authenticated, **When** they access the application, **Then** they are redirected to the Auth0 login page.
2. **Given** the user successfully authenticates via Auth0, **When** they return to the application, **Then** their profile is automatically synced and they land on the collection page.
3. **Given** the user is authenticated, **When** they access their profile, **Then** they see their display name, email, and preferred language.
4. **Given** the user is on their profile page, **When** they update their preferred language, **Then** the preference is saved, the UI language switches immediately, and TMDB metadata is fetched in the selected language.

---

### Edge Cases

- What happens when a media item has no poster image? The UI displays a placeholder image.
- What happens when a media item has no associated NAS files? The detail page indicates "No files found on NAS" clearly.
- What happens when TMDB search returns no results? A "No results found" message is displayed.
- What happens when the user's session expires? They are redirected to the Auth0 login page seamlessly.
- What happens when a media file path points to a NAS location that no longer exists? The path is still displayed but can be visually flagged as potentially unavailable.
- What happens when the API is unreachable? The user sees a clear error message suggesting they retry later.
- What happens when the user's collection is empty (new user)? The collection page displays an onboarding prompt with a friendly message and a call-to-action directing the user to search and import media from TMDB.
- What happens when pagination reaches the last page? The "next page" control is disabled.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display a paginated card grid of all media items (films and TV shows) with poster images, titles, types, and watched indicators.
- **FR-002**: System MUST allow filtering media by type (film/TV show), watched status, genre, and text search on title.
- **FR-003**: System MUST display a statistics overview of the collection (total count, films count, TV shows count, watched count, unwatched count, file counts).
- **FR-004**: System MUST display full media details when a user selects an item (title, original title, overview, release date, runtime, genres, rating, poster, backdrop).
- **FR-005**: System MUST display all NAS file paths associated with a media item, with their file size and format.
- **FR-006**: System MUST allow the user to copy a NAS file path to their clipboard with a single click.
- **FR-007**: System MUST allow a user to toggle the watched/unwatched status of a film from the collection list and from the detail page.
- **FR-008**: System MUST display TV show seasons and episodes with per-episode watch status tracking.
- **FR-009**: System MUST display per-season watched progress (e.g., "5/12 episodes watched").
- **FR-010**: System MUST allow a user to toggle the watched/unwatched status of individual TV episodes.
- **FR-011**: System MUST allow a user to mark all episodes of a TV season as watched or unwatched via a single toggle on the season header.
- **FR-012**: System MUST allow the user to search TMDB for films and TV shows by title.
- **FR-013**: System MUST allow the user to import a media from TMDB into their collection (with deduplication by TMDB ID).
- **FR-014**: System MUST allow the user to add TMDB search results to a personal wishlist.
- **FR-015**: System MUST display the user's wishlist with pagination, poster images, titles, release dates, and notes.
- **FR-016**: System MUST allow the user to mark a wishlist item as acquired or remove it.
- **FR-017**: System MUST authenticate users via Auth0 and automatically sync user profiles on login.
- **FR-018**: System MUST redirect unauthenticated users to the Auth0 login page.
- **FR-019**: System MUST allow the user to view and update their preferred language in their profile.
- **FR-020**: System MUST support bilingual UI in English and French. English is the default language; French is applied automatically for users located in France. The user can switch language at any time and the UI updates immediately.
- **FR-021**: System MUST handle API errors gracefully, displaying user-friendly error messages.
- **FR-022**: System MUST provide responsive design that works on desktop and tablet screen sizes.
- **FR-023**: System MUST provide a collapsible vertical sidebar for navigation between sections (collection, TMDB search, wishlist, profile), with icons and labels.
- **FR-024**: System MUST display an onboarding prompt with a call-to-action to import from TMDB when the user's collection is empty.

### Key Entities

- **Media**: A film or TV show in the user's collection. Identified by TMDB ID. Contains metadata: title, original title, overview, release date, runtime, poster/backdrop paths, rating, vote count, language, and type (film or TV show). Has associated genres, NAS files, and seasons (for TV shows).
- **MediaFile**: A physical file on the NAS linked to a media item. Contains file path, size, and format. Can be unlinked (not associated with any media) when freshly scanned.
- **TV Season**: A season belonging to a TV show. Contains season number, name, overview, air date, poster, and episode count.
- **TV Episode**: An episode within a season. Contains episode number, name, overview, air date, runtime, and still image.
- **User**: An authenticated person identified via Auth0. Has a display name, email, preferred language, and role (User or Admin).
- **UserMedia**: The relationship between a user and a media item that tracks watch status, watched date, personal rating, and notes.
- **UserEpisode**: The relationship between a user and a TV episode that tracks per-episode watch status.
- **WishlistItem**: A reference to a TMDB media entry that the user wants to acquire. Tracks TMDB ID, title, poster, release date, acquisition status, and personal notes. Independent from the local media collection.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can find any specific media in their collection within 10 seconds using search and filters.
- **SC-002**: Users can view a media's NAS file path and copy it to clipboard in under 3 clicks from the collection page.
- **SC-003**: Users can mark a film as watched/unwatched with a single interaction (one click).
- **SC-004**: Users can see their TV show watch progress (episodes watched per season) at a glance without additional navigation.
- **SC-005**: Users can import a new media from TMDB into their collection in under 30 seconds.
- **SC-006**: Users can add a media to their wishlist directly from TMDB search results in under 2 clicks.
- **SC-007**: The collection page loads and displays the first page of results within 2 seconds on a standard connection.
- **SC-008**: 90% of users successfully complete their first collection browse, media detail view, and watch status toggle on their first session without assistance.

## Assumptions

- The backend service is fully operational and provides all necessary data and operations (media listing, watch tracking, wishlist, TMDB search/import, authentication).
- Users authenticate via Auth0. On first login, the user profile is automatically created.
- NAS file paths are displayed as text that users can copy; the application does not directly open file explorer windows on the user's machine (browser security limitation).
- TMDB search and import operations are handled by the backend; the web interface sends user requests and displays results.
- The application targets modern evergreen browsers (Chrome, Firefox, Edge, Safari latest 2 versions).
- The preferred language setting affects both the application UI language and the language used for TMDB metadata fetching. Supported languages: English (default) and French.
- Admin-specific features (NAS scanning, user management, media deletion) are out of scope for this initial specification and will be addressed in a separate feature.

## Out of Scope

- Admin panel (user management, NAS file scanning, media deletion).
- Offline mode or progressive web app (PWA) capabilities.
- Media playback directly from the browser.
- Automatic matching of unlinked NAS files to media entries.
- Push notifications.
- Social features (sharing collections between users).
- Mobile-native application (responsive web only).
