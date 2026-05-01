# Feature Specification: Administration Dashboard

**Feature Branch**: `004-admin-dashboard`  
**Created**: 2026-04-10  
**Status**: Clarified
**Input**: User description: "Administration section for admin roles only. Allows configuration of important settings including user management, NAS path global settings, scanner configuration, system health/status, and other practical administration features."

## Clarifications

### Session 2025-07-17

- Q: How should the frontend receive live scan status updates — polling (periodic HTTP requests), server-sent events (SSE), or WebSockets? → A: Polling — periodic HTTP requests every 3–5 seconds for scan status updates.
- Q: What should the Scanner section display — only the active scan, or also a history of recent scan runs? → A: Active scan + compact recent history, last 10–20 runs, paginated.
- Q: Can admins reopen a resolved or dismissed review item? → A: Yes — admins can reopen any resolved or dismissed item back to Open for reassignment.
- Q: Can admins toggle a library root's enabled status without removing it? → A: Yes — admins can toggle a library root enabled/disabled at will; disabled roots are excluded from scan targets but remain configured and are not deleted.
- Q: When selecting scan targets in the scan launcher, should disabled library roots appear as selectable (but inactive) options, or be hidden entirely? → A: Auto-exclude — disabled roots never appear as selectable targets in the scan launcher. "All roots" means all currently enabled roots only.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - User Management (Priority: P1)

As an admin, I want to view all registered users and manage their accounts so I can control who has access to the application and what level of access they have.

The admin navigates to the Administration section and selects "User Management". They see a paginated, searchable list of all users showing display name, email, role (User or Admin), and active status. The admin can change a user's role (promote to Admin or demote to User) and activate or deactivate a user account. Deactivated users cannot log in or use the application.

**Why this priority**: User management is the most critical administration function — controlling who can access the system and with what privileges is foundational to security and governance.

**Independent Test**: Can be tested by navigating to the admin section, viewing the user list, searching for a user, changing their role, and toggling their active status. Delivers immediate value for access governance.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the User Management section, **When** the page loads, **Then** they see a paginated table of all users with columns for display name, email, role, and active status.
2. **Given** the admin is viewing the user list, **When** they type a search term, **Then** the list filters to show only users whose name or email matches the search.
3. **Given** the admin is viewing a user with the "User" role, **When** they change the role to "Admin", **Then** the role is updated and a success confirmation is shown.
4. **Given** the admin is viewing a user with the "Admin" role, **When** they change the role to "User", **Then** the role is updated and a success confirmation is shown.
5. **Given** the admin is viewing an active user, **When** they deactivate the user, **Then** the user's active status changes to inactive and a success confirmation is shown.
6. **Given** the admin is viewing an inactive user, **When** they reactivate the user, **Then** the user's active status changes to active and a success confirmation is shown.
7. **Given** the admin is viewing the user list, **When** they paginate to the next page, **Then** the next set of users is displayed.

---

### User Story 2 - Library Root Management (Priority: P1)

As an admin, I want to manage NAS library root paths so I can configure where the application scans for media files. Library roots define the top-level directories on the NAS that contain media (movies, TV shows, or mixed content).

The admin navigates to the "Library Roots" section within Administration. They see a list of all configured library roots showing path, content kind (Movies, TV Shows, Mixed), optional label, enabled status, and creation date. The admin can add new library roots by specifying a path, content kind, and optional label. The admin can remove library roots that are no longer needed (existing media file records are soft-deleted). The admin can toggle a library root's enabled status at will — disabled roots remain configured and visible in the list but are excluded from all scan targets until re-enabled. The admin can filter roots by kind and enabled status.

**Why this priority**: Library roots are the foundational configuration for the Kodi-like scanner — without configured paths, the scanner has no targets. This is a prerequisite for all scanning operations.

**Independent Test**: Can be tested by navigating to the Library Roots section, viewing existing roots, adding a new root with a path and kind, toggling a root's enabled status, filtering by kind, and removing a root. Delivers the ability to configure scanner targets.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Library Roots section, **When** the page loads, **Then** they see a paginated list of all configured library roots with path, kind, label, enabled status, and creation date.
2. **Given** the admin is on the Library Roots section, **When** they click "Add Library Root", **Then** a form appears to enter a path, select a content kind (Movies, TV Shows, Mixed), and optionally provide a label.
3. **Given** the admin fills in a valid new library root, **When** they submit the form, **Then** the root is added and appears in the list with a success confirmation.
4. **Given** the admin tries to add a library root with a path that already exists, **When** they submit the form, **Then** the system displays a duplicate error message and does not create a second entry.
5. **Given** the admin views a library root, **When** they click "Remove", **Then** a confirmation prompt appears; upon confirming, the root is removed from the list.
6. **Given** a scan is currently running that targets a library root, **When** the admin tries to remove that root, **Then** the system shows an error indicating removal is blocked while a scan is in progress.
7. **Given** the admin is on the Library Roots section, **When** they filter by kind or enabled status, **Then** the list updates to show only matching roots.
8. **Given** the admin views an enabled library root, **When** they click "Disable", **Then** the root's enabled status changes to disabled, a success confirmation is shown, and the root is excluded from future scan targets while remaining configured.
9. **Given** the admin views a disabled library root, **When** they click "Enable", **Then** the root's enabled status changes to enabled, a success confirmation is shown, and the root is included in future scan targets.

---

### User Story 3 - Scanner Operations & Monitoring (Priority: P2)

As an admin, I want to start, monitor, and cancel NAS scan operations from the administration section so I can control when the system scans for new media and track scan progress.

The admin navigates to the "Scanner" section within Administration. They can start a new scan by selecting which library roots to scan (or "All", meaning all currently enabled roots) and choosing a scan mode (Full or Incremental). **Only enabled library roots appear in the scan root selector — disabled roots are automatically excluded and never shown as selectable targets.** While a scan is running, they see live status via polling (HTTP requests every 3–5 seconds) including scan state (Pending, Running, Completed, Failed, Cancelled) and scan counts (total discovered, added, updated, unchanged, removed, excluded, needs review). They can cancel a running scan. They can view details of a completed scan including review items that need attention. Below the active scan panel, a compact paginated scan history table shows the last 10–20 runs per page, displaying scan mode, status, start/finish timestamps, and summary counts for each run.

**Why this priority**: The scanner is the core data ingestion mechanism. Admins need to control scan operations to keep the media library up to date and troubleshoot import issues.

**Independent Test**: Can be tested by navigating to the Scanner section, starting a Full scan on all enabled roots, observing the running status update, then viewing the completed scan results. Can also test cancellation by starting a scan and immediately cancelling it. Verify that any disabled roots do not appear in the root selector.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Scanner section, **When** the page loads, **Then** they see a scan control panel with options to select library roots (only enabled roots are listed), choose scan mode (Full or Incremental), and a "Start Scan" button.
2. **Given** one or more library roots are disabled, **When** the admin opens the scan root selector, **Then** the disabled roots do not appear in the selector at all — only enabled roots are listed as selectable targets.
3. **Given** no scan is currently running, **When** the admin clicks "Start Scan", **Then** the system starts a scan with the selected enabled roots and mode, and shows a running status indicator.
4. **Given** a scan is running, **When** the admin views the Scanner section, **Then** they see the current scan status (Pending/Running), counts (discovered, added, updated, unchanged, removed, excluded, needs review), and a "Cancel Scan" button.
5. **Given** a scan is running, **When** the admin clicks "Cancel Scan", **Then** the scan transitions to Cancelled status and the cancel button is replaced with the start controls.
6. **Given** a scan is already running, **When** the admin tries to start another scan, **Then** the system shows an error indicating a scan is already in progress.
7. **Given** a scan has completed, **When** the admin views its details, **Then** they see final counts, start/finish timestamps, and any failure reason if the scan failed.
8. **Given** a completed scan has review items, **When** the admin views its details, **Then** they see the review items that need attention (items that could not be automatically matched).
9. **Given** the admin navigates to the Scanner section, **When** the page loads, **Then** below the active scan panel they see a paginated scan history table showing recent runs (10–20 per page) with scan mode, status, timestamps, and summary counts.
10. **Given** the admin is viewing the scan history, **When** they click on a completed scan row, **Then** they see the detailed results for that scan run including full counts and any review items.

---

### User Story 4 - Review Queue Management (Priority: P2)

As an admin, I want to review and resolve media files that the scanner could not automatically match to TMDB entries so I can manually assign, dismiss, or delete unresolved items.

The admin navigates to the "Review Queue" section within Administration. They see a paginated list of review items that require attention. Each item shows the file path, the reason it needs review (no TMDB result, multiple candidates, year mismatch, unparseable episode, etc.), its status (Open, Resolved, Dismissed), parsed title/year information, and TMDB candidate suggestions. The admin can resolve an item by assigning a specific TMDB entry from the candidates, dismissing it, deleting the underlying file record, or reopening a previously resolved or dismissed item back to Open for reassignment. The admin can filter review items by status, reason, and scan run.

**Why this priority**: The review queue is the complement to the scanner — it handles edge cases where automatic matching fails. Without it, unmatched files remain orphaned and never appear in users' collections.

**Independent Test**: Can be tested by navigating to the Review Queue, viewing open items, filtering by reason, selecting a review item, and resolving it by assigning a TMDB candidate. Delivers the ability to complete the scan-to-collection pipeline for ambiguous files.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Review Queue, **When** the page loads, **Then** they see a paginated list of open review items showing file path, review reason, parsed title/year, and TMDB candidate suggestions.
2. **Given** the admin views a review item with TMDB candidates, **When** they select a candidate and click "Assign", **Then** the item is resolved, its status changes to Resolved, and the file is linked to the selected TMDB entry.
3. **Given** the admin views a review item, **When** they click "Dismiss", **Then** the item is marked as Dismissed and no TMDB link is created.
4. **Given** the admin views a review item, **When** they click "Delete", **Then** the underlying file record is removed and the item is marked as Dismissed.
5. **Given** the admin views a resolved or dismissed review item, **When** they click "Reopen", **Then** the item's status is reset to Open and it becomes available for reassignment.
6. **Given** the admin is on the Review Queue, **When** they filter by status (Open, Resolved, Dismissed), **Then** only items matching the selected status are displayed.
7. **Given** the admin is on the Review Queue, **When** they filter by review reason (e.g., No TMDB Result, Multiple Candidates), **Then** only items matching that reason are displayed.
8. **Given** the admin is on the Review Queue, **When** they filter by scan run, **Then** only items from that specific scan run are shown.

---

### User Story 5 - System Health Overview (Priority: P3)

As an admin, I want to see the health status of the application at a glance on the administration landing page so I can quickly identify if any services are down or degraded.

The Administration landing page displays a system health panel showing the backend API health status (Healthy/Unhealthy), server timestamp, and application version. This provides a quick operational status check without needing external monitoring tools.

**Why this priority**: Health monitoring is useful for quick diagnostics but is supplementary — dedicated monitoring tools handle deeper issues. This is a convenience for the admin doing day-to-day tasks.

**Independent Test**: Can be tested by navigating to the Administration landing page and verifying the health panel shows the current status, timestamp, and version from the health endpoint.

**Acceptance Scenarios**:

1. **Given** the admin navigates to the Administration landing page, **When** the page loads, **Then** they see a system health panel showing the API status (Healthy or Unhealthy), the server timestamp, and the application version.
2. **Given** the backend API is healthy, **When** the admin views the health panel, **Then** the status is displayed as "Healthy" with a positive visual indicator (e.g., green badge).
3. **Given** the backend API is unhealthy, **When** the admin views the health panel, **Then** the status is displayed as "Unhealthy" with a warning visual indicator (e.g., red badge).
4. **Given** the health endpoint is unreachable, **When** the admin views the health panel, **Then** a clear error message is shown indicating the API is not responding.

---

### User Story 6 - Bilingual Support for Administration (Priority: P3)

As an admin using the application in French or English, I want all administration section labels, buttons, messages, table headers, and status indicators to appear in my chosen language.

**Why this priority**: The app already supports bilingual UI. All new administration text must follow the same pattern, but this is a cross-cutting concern that can be layered on after core functionality works.

**Independent Test**: Can be tested by switching language to French, navigating to each administration sub-section, and verifying all labels and text are displayed in French.

**Acceptance Scenarios**:

1. **Given** the admin's language is set to English, **When** they navigate to the Administration section, **Then** all labels, buttons, table headers, status indicators, and messages appear in English.
2. **Given** the admin's language is set to French, **When** they navigate to the Administration section, **Then** all labels, buttons, table headers, status indicators, and messages appear in French.

---

### Edge Cases

- What happens when a non-admin user attempts to navigate to the Administration route? They are redirected to the collection page by the existing admin guard — the Administration route is not accessible.
- What happens when the admin tries to change their own role from Admin to User? The role change is applied and the admin loses access to the admin section. They are redirected to the collection page on the next navigation. The system does not prevent self-demotion — this is a deliberate action.
- What happens when the admin tries to deactivate their own account? The deactivation is applied. The admin will be unable to log in on the next session.
- What happens when the admin adds a library root with an invalid or inaccessible path? The backend validates the path. If the path is outside allowed boundaries, a validation error is returned. If the path is syntactically valid but does not exist on the NAS, the root is saved — the scanner will report errors when it attempts to scan that root.
- What happens when the admin tries to remove a library root while a scan targeting it is running? The backend returns a conflict error and the UI displays a message indicating removal is blocked.
- What happens when the admin tries to disable a library root while a scan targeting it is currently running? The toggle is allowed — the running scan continues to completion using its originally targeted roots; only future scan runs will exclude the now-disabled root.
- What happens when the review queue is empty (all items resolved)? The Review Queue shows an empty state message indicating there are no items requiring review.
- What happens when the admin starts a scan and the NAS is unreachable? The scan transitions to Failed status with a failure reason describing the NAS connection error.
- What happens when the admin navigates between Administration sub-sections? Each sub-section loads its own data independently. Navigation within the admin section does not affect other sections' state.
- What happens when the health endpoint is slow to respond? The health panel shows a loading indicator until the response arrives. No timeout is enforced on the client side.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an Administration section accessible only to users with the Admin role.
- **FR-002**: System MUST add an "Administration" navigation item to the sidebar, visible only to admin users.
- **FR-003**: System MUST display a paginated, searchable list of all registered users in the User Management sub-section.
- **FR-004**: System MUST allow admins to change a user's role between User and Admin.
- **FR-005**: System MUST allow admins to toggle a user's active status (activate/deactivate).
- **FR-006**: System MUST display a paginated, filterable list of configured library roots in the Library Roots sub-section.
- **FR-007**: System MUST allow admins to add a new library root by specifying a path, content kind (Movies, TV Shows, Mixed), and optional label.
- **FR-008**: System MUST prevent adding a library root with a path that is already registered (duplicate detection).
- **FR-009**: System MUST allow admins to remove a library root, with a confirmation prompt before deletion.
- **FR-009a**: System MUST allow admins to toggle a library root's enabled status at will. Disabled roots are excluded from all scan targets but remain configured and visible in the Library Roots list. Toggling is permitted even while a scan is running; the running scan continues with its original targets and only future scans reflect the change.
- **FR-010**: System MUST block library root removal while a scan targeting that root is in progress, displaying an appropriate error message.
- **FR-011**: System MUST allow admins to start a new scan with a selected scan mode (Full or Incremental) and optionally target specific library roots. Only currently enabled library roots are presented as selectable targets in the scan launcher; disabled roots are automatically excluded and never rendered as options.
- **FR-011a**: When an admin selects "All" roots in the scan launcher, the system MUST interpret this as all currently enabled library roots only. Disabled roots are never included in an "All" scan target selection.
- **FR-012**: System MUST display the current scan status (Pending, Running, Completed, Failed, Cancelled) and scan counts (discovered, added, updated, unchanged, removed, excluded, needs review) while a scan is running or after completion. Status updates are fetched via polling (HTTP GET requests every 3–5 seconds while a scan is active).
- **FR-012a**: System MUST display a paginated scan history table below the active scan panel, showing the last 10–20 scan runs per page with scan mode, status, start/finish timestamps, and summary counts. Admins can click a history row to view full scan details.
- **FR-013**: System MUST allow admins to cancel a running scan.
- **FR-014**: System MUST prevent starting a new scan while another scan is already running.
- **FR-015**: System MUST display a paginated, filterable list of review items in the Review Queue sub-section, showing file path, review reason, status, parsed metadata, and TMDB candidate suggestions.
- **FR-016**: System MUST allow admins to resolve a review item by assigning a TMDB entry from the candidate list.
- **FR-016a**: System MUST allow admins to reopen any resolved or dismissed review item, resetting its status to Open so it can be reassigned.
- **FR-017**: System MUST allow admins to dismiss a review item without assigning TMDB metadata.
- **FR-018**: System MUST allow admins to delete a review item's underlying file record.
- **FR-019**: System MUST allow filtering review items by status (Open, Resolved, Dismissed), review reason, and scan run.
- **FR-020**: System MUST display a system health panel on the Administration landing page showing API health status, server timestamp, and application version.
- **FR-021**: System MUST support bilingual display (English and French) for all administration labels, buttons, messages, table headers, and status indicators.
- **FR-022**: System MUST provide sub-navigation within the Administration section to switch between User Management, Library Roots, Scanner, and Review Queue.
- **FR-023**: System MUST display success confirmations after successful operations (role change, status toggle, root addition/removal/enable/disable, scan start/cancel, review resolution).
- **FR-024**: System MUST display meaningful error messages when operations fail, including backend validation errors and conflict errors.

### Key Entities

- **User**: A registered person in the system. Has display name, email, preferred language, role (User or Admin), and active status. Managed by admins via the User Management section.
- **LibraryRoot**: A configured top-level NAS directory path that the scanner targets. Has path, content kind (Movies, TV Shows, Mixed), optional label, enabled status, and creation/update timestamps.
- **ScanRun**: A record of a scanner execution. Has scan mode (Full or Incremental), status (Pending, Running, Completed, Failed, Cancelled), start/finish timestamps, failure reason, targeted library root IDs, and scan counts. Recent runs (last 10–20 per page) are displayed in the Scanner section's paginated history table.
- **ScanCounts**: Statistics from a scan run. Includes total discovered, added, updated, unchanged, removed, excluded, and needs review counts.
- **ReviewItem**: A media file that could not be automatically matched during scanning. Has file path, review reason, status (Open, Resolved, Dismissed), parsed title/year/season/episode, TMDB candidate suggestions, resolution details, and timestamps.
- **TmdbCandidate**: A potential TMDB match suggested for a review item. Has TMDB ID, media kind, title, year, match score, and poster path.
- **HealthStatus**: The operational status of the backend API. Reports healthy/unhealthy state, server timestamp, and application version.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admins can find and modify a specific user's role or active status within 30 seconds using search and the user list.
- **SC-002**: Admins can add a new library root (path + kind) in under 1 minute.
- **SC-003**: Admins can start a scan and see its live status within 3 clicks from the Administration landing page.
- **SC-004**: Admins can resolve a review item (assign, dismiss, or delete) in under 30 seconds per item.
- **SC-005**: Non-admin users cannot access any part of the Administration section — they are redirected to the collection page.
- **SC-006**: All administration UI elements are displayed correctly in both English and French with no untranslated keys visible.
- **SC-007**: 90% of admins can successfully complete their first user management and library root configuration tasks on their first session without assistance.
- **SC-008**: The system health panel loads and displays the current backend status within 3 seconds.

## Assumptions

- The backend API endpoints for user management (`GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}/role`, `PUT /api/v1/admin/users/{id}/active`), library roots (`GET/POST/DELETE /api/v1/admin/library-roots`), scanning (`POST/GET /api/v1/admin/scan`, `GET /api/v1/admin/scan/active`, `POST /api/v1/admin/scan/{id}/cancel`), review queue (`GET /api/v1/admin/review-items`, `POST /api/v1/admin/review-items/{id}/resolve`), and health (`GET /api/v1/health`) are fully implemented and operational.
- All admin endpoints require Admin role authorization and are guarded server-side.
- The existing `AuthService`, `ApiService`, `adminGuard`, error interceptor, and Transloco i18n infrastructure are available and working.
- The existing sidebar dynamically shows admin-only navigation items when the user has Admin role — this pattern is extended for the new Administration entry.
- The Administration section is a new route/page group, distinct from the existing NAS Scanner page. The NAS Scanner page (`/nas-scanner`) remains as-is for quick scan & import workflows; the Administration section provides fuller control.
- TMDB candidate poster images for review items use the same TMDB image URL pattern as the rest of the application (`https://image.tmdb.org/t/p/{size}{path}`).
- The frontend does not enforce timeouts for admin operations; timeout management is the backend's responsibility.
- Scan status polling is implemented via periodic HTTP GET requests to the active scan endpoint every 3–5 seconds. Polling starts when a scan is initiated and stops when the scan reaches a terminal state (Completed, Failed, or Cancelled).
- Library root path validation (checking if the path exists on the NAS) is the backend's responsibility. The frontend only validates that the path field is not empty.
- The scan launcher's root selector is populated exclusively from enabled library roots. The frontend filters the root list client-side (or requests only enabled roots from the backend) before rendering selector options; disabled roots never appear as selectable scan targets regardless of how many are configured.
- The application targets modern evergreen browsers (Chrome, Firefox, Edge, Safari latest 2 versions).
