# Feature Specification: NAS File Scanner

**Feature Branch**: `002-nas-file-scanner`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Add a frontend page to scan existing NAS files. The backend API endpoint (POST /api/v1/files/scan) already exists and is Admin-only. The page should let the admin trigger a scan, optionally specifying a base path, and display the scan results (new files found, existing files, total scanned)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Trigger NAS File Scan (Priority: P1)

As an admin, I want to trigger a scan of my NAS file system from the web interface so that new media files are discovered and added to the database without manual intervention. I can navigate to a "NAS Scanner" page from the sidebar. I see a form where I can optionally enter a base path to scope the scan. I click a "Scan" button to start the process. While the scan is running, I see a loading indicator. When the scan completes, I see the results: number of new files found, number of existing files, and total files scanned.

**Why this priority**: This is the core and only feature — without being able to trigger a scan from the UI, the feature has no value.

**Independent Test**: Can be tested by navigating to the NAS Scanner page, clicking "Scan", and verifying results are displayed after the API call completes.

**Acceptance Scenarios**:

1. **Given** the user is an authenticated admin, **When** they click the NAS Scanner link in the sidebar, **Then** they navigate to the NAS scan page.
2. **Given** the admin is on the NAS scan page, **When** the page loads, **Then** they see a scan form with an optional base path input and a "Scan" button.
3. **Given** the admin clicks the "Scan" button without a base path, **When** the API responds successfully, **Then** the scan results are displayed showing new files, existing files, and total scanned.
4. **Given** the admin enters a specific base path and clicks "Scan", **When** the API responds successfully, **Then** the scan results reflect only the files within that base path.
5. **Given** the admin clicks "Scan", **When** the scan is in progress, **Then** the button is disabled and a loading/progress indicator is shown.
6. **Given** the API returns an error (e.g., 403 forbidden for non-admin, path validation failure), **When** the scan fails, **Then** an error message is displayed to the user.

---

### User Story 2 - Scan History Display (Priority: P2)

As an admin, after running a scan, I want to see a summary of scan results on the page so I can review what was found. The most recent scan result stays visible until a new scan is triggered. If no scan has been run in the current session, the results area shows an empty/informational state.

**Why this priority**: Enhances the scan experience by showing results clearly, but the core scan trigger (US1) works independently.

**Independent Test**: Can be tested by running a scan and verifying the results panel displays correctly with new/existing/total counts.

**Acceptance Scenarios**:

1. **Given** no scan has been run yet in the current session, **When** the page loads, **Then** an informational empty state is shown in the results area.
2. **Given** a scan has completed, **When** the results are displayed, **Then** the admin sees cards/stats for "New Files", "Existing Files", and "Total Scanned".
3. **Given** the admin runs a new scan, **When** it completes, **Then** the previous results are replaced with the new ones.

---

### Edge Cases

- What happens when a non-admin user tries to access the NAS scanner page? They should be blocked by the route guard and redirected.
- What happens when the API is unreachable? An error toast is shown.
- What happens when the base path is invalid? The API returns a 403/400 error and the UI shows a meaningful message.
- What happens when the scan finds 0 new files? Results display normally, showing 0 new, N existing, N total.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a dedicated NAS Scanner page accessible from the sidebar navigation (admin only).
- **FR-002**: System MUST allow the admin to trigger a NAS file scan via a "Scan" button.
- **FR-003**: System MUST allow the admin to optionally specify a base path to scope the scan.
- **FR-004**: System MUST display a loading indicator while the scan is in progress.
- **FR-005**: System MUST display scan results (new files, existing files, total scanned) after a successful scan.
- **FR-006**: System MUST handle and display API errors gracefully (forbidden, validation errors, network errors).
- **FR-007**: System MUST restrict access to the NAS Scanner page to admin users only.
- **FR-008**: System MUST support bilingual UI (English and French) for all NAS Scanner page text.

### Key Entities

- **ScanNasResult**: The result returned by the scan API. Contains `newFiles` (number), `existingFiles` (number), `totalScanned` (number).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admin can trigger a NAS scan and see results within the time it takes the API to respond (no extra frontend delay).
- **SC-002**: Non-admin users cannot access the scanner page.
- **SC-003**: Scan page loads within 1 second.

## Assumptions

- The backend `POST /api/v1/files/scan` endpoint is fully implemented and operational.
- The endpoint requires Admin role authorization.
- The endpoint accepts an optional `basePath` query parameter.
- The endpoint returns `ApiResponse<ScanNasResult>` with `{ newFiles, existingFiles, totalScanned }`.
- The existing `ApiService`, `AuthService`, error interceptor, and i18n infrastructure are available and working.
