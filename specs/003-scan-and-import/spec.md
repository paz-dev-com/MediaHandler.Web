# Feature Specification: Scan & Import

**Feature Branch**: `003-scan-and-import`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Adjust existing NAS scanner UX so location buttons populate path instead of auto-scanning, add Scan & Import combined action with TMDB matching, and add Auto Import for retrying unlinked files."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Adjusted NAS Scanner Location Selection (Priority: P1)

As an admin, I want clicking a NAS location button to populate the base path input field (instead of immediately triggering a scan), so that I can append a subfolder path (e.g., TV shows or Films folder) before manually deciding when to scan.

Currently, clicking a NAS location button auto-triggers a scan. This must change so the admin has full control over the scan target path before any action is executed.

**Why this priority**: This is the foundational UX change upon which both the existing scan and the new Scan & Import rely. Without this change, neither workflow can support subfolder-level targeting.

**Independent Test**: Can be tested by navigating to the NAS Scanner page, clicking a location button, verifying the path appears in the input field without any scan being triggered, then appending a subfolder and clicking "Scan".

**Acceptance Scenarios**:

1. **Given** the admin is on the NAS Scanner page and locations have loaded, **When** they click a NAS location button, **Then** the base path input field is populated with that location's path and no scan is triggered.
2. **Given** a location button has been clicked and the base path is populated, **When** the admin appends a subfolder path (e.g., `/TV Shows`) to the input, **Then** the full combined path is reflected in the input field.
3. **Given** the admin has populated or edited the base path, **When** they click the "Scan" button, **Then** the scan is triggered with the full path shown in the input field.
4. **Given** the admin is on the NAS Scanner page, **When** no location button has been clicked, **Then** the admin can still manually type a full path in the input field and click "Scan".
5. **Given** a scan is in progress, **When** the admin looks at location buttons and action buttons, **Then** all buttons and the input field are disabled until the operation completes.

---

### User Story 2 - Scan & Import Combined Action (Priority: P1)

As an admin, I want to trigger a "Scan & Import" action that scans NAS files and automatically matches them against TMDB in one step, so that newly discovered media files are immediately linked to their TMDB metadata without requiring a separate import step.

The Scan & Import follows the same UX pattern as the adjusted scan: select a location → optionally specify a subfolder → click "Scan & Import". Results display both scan statistics (new files, existing files, total scanned, folders found) and import statistics (matched, skipped, failed, errors).

**Why this priority**: This is the primary new capability of the feature and delivers the most value — combining two manual steps (scan + import) into one action.

**Independent Test**: Can be tested by selecting a NAS location, specifying a subfolder, clicking "Scan & Import", and verifying both scan and import result statistics are displayed.

**Acceptance Scenarios**:

1. **Given** the admin is on the NAS Scanner page, **When** the page loads, **Then** a "Scan & Import" button is visible alongside the existing "Scan" button.
2. **Given** the admin has set a base path (via location button or manual input), **When** they click "Scan & Import", **Then** the system calls the scan-and-import endpoint with the specified base path.
 3. **Given** the scan-and-import operation completes successfully, **When** results are displayed, **Then** the admin sees scan statistics as stat cards (new files, existing files, total scanned, folders found) AND import statistics (matched, skipped, failed, errors) displayed in a collapsible accordion panel below the stat cards, collapsed by default and expandable on click.
 4. **Given** the scan-and-import operation returns errors in the errors array, **When** results are displayed, **Then** the individual error messages are shown in a collapsible error list within the results area so the admin can expand and review which files failed to import and why.
5. **Given** the admin clicks "Scan & Import" without specifying a base path, **When** the operation executes, **Then** the system scans all NAS locations (same behavior as scan without a path).
6. **Given** a scan-and-import operation is in progress, **When** the admin looks at the page, **Then** a loading indicator is shown and all action buttons are disabled.

---

### User Story 3 - Auto Import Unlinked Files (Priority: P2)

As an admin, I want to trigger an "Auto Import" action that retries TMDB matching for all previously scanned but unlinked media files, so that files that failed or were skipped during a prior import attempt get another chance to be matched without re-scanning.

This is a standalone action that does not require a base path — it operates on all existing unlinked records in the database.

**Why this priority**: Valuable for recovering from transient TMDB API failures or matching improvements, but requires that files have been previously scanned (depends on US1/US2 for initial data).

**Independent Test**: Can be tested by clicking the "Auto Import" button (no path needed) and verifying results show total unlinked, matched, skipped, failed, and errors.

**Acceptance Scenarios**:

 1. **Given** the admin is on the NAS Scanner page, **When** the page loads, **Then** an "Auto Import" button is visible in a visually separate section from the path-dependent actions (Scan, Scan & Import), clearly distinguishing it as an action that does not require a base path.
 2. **Given** the admin clicks "Auto Import", **When** the operation executes, **Then** the system calls the auto-import endpoint without any base path parameter.
 3. **Given** the auto-import operation completes, **When** results are displayed, **Then** the admin sees import statistics (total unlinked files processed, matched, skipped, failed, and any errors) displayed in a collapsible accordion panel, collapsed by default and expandable on click.
 4. **Given** no unlinked files exist in the system, **When** the admin triggers auto-import, **Then** results show zero totals with no errors.
 5. **Given** auto-import encounters errors for some files, **When** results are displayed, **Then** the error details are visible in a collapsible error list within the results area.
6. **Given** an auto-import is in progress, **When** the admin views the page, **Then** a loading indicator is shown and all action buttons are disabled.

---

### User Story 4 - Bilingual Support for New UI Elements (Priority: P3)

As an admin using the application in French or English, I want all new labels, buttons, messages, and result displays for the adjusted scanner and new import features to appear in my chosen language.

**Why this priority**: The app already supports bilingual UI. All new text must follow the same pattern, but this is a cross-cutting concern that can be layered on after core functionality works.

**Independent Test**: Can be tested by switching language to French, navigating to the NAS Scanner page, and verifying all new labels (Scan & Import, Auto Import, import statistics, error messages) are displayed in French.

**Acceptance Scenarios**:

1. **Given** the admin's language is set to English, **When** they view the NAS Scanner page, **Then** all new buttons, labels, and result text appear in English.
2. **Given** the admin's language is set to French, **When** they view the NAS Scanner page, **Then** all new buttons, labels, and result text appear in French.

---

### Edge Cases

- What happens when the admin clicks a NAS location button while a scan or import is already in progress? All buttons and inputs should be disabled during any ongoing operation — no action should be possible.
- What happens when the scan-and-import endpoint returns a mix of successful matches and errors? Both the success stats and error details should be displayed together in the results area.
- What happens when the admin enters an invalid subfolder path? The backend returns an error, and the UI displays a meaningful error message.
- What happens when the TMDB matching service is unavailable during Scan & Import or Auto Import? The operation completes with failed/error counts reflecting the TMDB failures, and the error details are shown.
- What happens when there are zero unlinked files and the admin triggers Auto Import? Results display normally with all counts at zero — no error message.
- What happens when the admin clicks "Scan & Import" with a very long-running scan? The loading state persists until the server responds; there is no client-side timeout. The admin can wait but cannot trigger another action concurrently. Timeout management is the server's responsibility.
- What happens when multiple NAS location buttons are clicked in sequence (before a scan is started)? Each click replaces the previous base path in the input field — only the last selected path is used.
- What happens when a new operation completes while previous results are displayed? The previous results are replaced only upon successful completion of the new operation. During loading, the previous results remain visible to preserve context.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Location buttons MUST populate the base path input field when clicked, without triggering any scan or import operation.
- **FR-002**: The admin MUST be able to edit the base path input field to append or modify subfolder paths after a location button has populated it.
- **FR-003**: The "Scan" action MUST only trigger when the admin explicitly clicks the "Scan" button.
- **FR-004**: System MUST provide a "Scan & Import" action button on the NAS Scanner page that triggers a combined scan and TMDB auto-import operation.
- **FR-005**: The "Scan & Import" action MUST send the current base path (if specified) and language preference to the backend.
- **FR-006**: System MUST display scan-and-import results including scan statistics as stat cards (new files, existing files, total scanned, folders found) and import statistics (matched, skipped, failed, errors) in a collapsible accordion panel below the stat cards, collapsed by default.
- **FR-007**: System MUST provide an "Auto Import" action in a visually separate section from path-dependent actions, that retries TMDB matching for all unlinked media files without requiring a base path.
- **FR-008**: System MUST display auto-import results including total unlinked, matched, skipped, failed, and error details in a collapsible accordion panel, collapsed by default.
- **FR-009**: System MUST disable all action buttons and the path input field while any operation (scan, scan-and-import, or auto-import) is in progress.
- **FR-010**: System MUST display a loading indicator during any ongoing operation.
- **FR-011**: System MUST display error details from the errors array in scan-and-import and auto-import results as a collapsible error list within the results area so the admin can expand and review individual file failures.
- **FR-012**: System MUST restrict all scan and import actions to admin users only.
- **FR-013**: System MUST support bilingual display (English and French) for all new labels, buttons, result statistics, and error messages.
- **FR-014**: The "Scan All" button (scan without a base path) MUST continue to function as before — triggering a full scan when explicitly clicked.
- **FR-015**: System MUST replace previous operation results only upon successful completion of a new operation; during loading, previous results remain visible.
- **FR-016**: System MUST NOT enforce a client-side timeout for scan or import operations; timeout management is the backend's responsibility.

### Key Entities

- **ScanNasResult**: Existing result from the scan endpoint. Contains `newFiles`, `existingFiles`, `totalScanned`, `foldersFound`.
- **ScanAndImportNasResult**: Result from the scan-and-import endpoint. Contains all fields from ScanNasResult plus `matched`, `skipped`, `failed`, `errors` (array of error detail strings).
- **AutoImportResult**: Result from the auto-import endpoint. Contains `totalUnlinked`, `matched`, `skipped`, `failed`, `errors` (array of error detail strings).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admin can select a NAS location and append a subfolder path in under 10 seconds, with no unintended scan triggered during path composition.
- **SC-002**: Admin can trigger a Scan & Import and view combined scan + import results in a single page interaction (no page navigation required).
- **SC-003**: Admin can trigger Auto Import for unlinked files in one click and see results (matched, skipped, failed) without needing to specify a path.
- **SC-004**: All new UI elements are displayed correctly in both English and French with no untranslated keys visible.
- **SC-005**: Non-admin users cannot access or trigger any scan or import actions.
- **SC-006**: 100% of import errors returned by the backend are visible to the admin in the results display.

## Assumptions

- The backend endpoints `POST /api/v1/files/scan`, `GET /api/v1/files/locations`, `POST /api/v1/files/scan-and-import`, and `POST /api/v1/files/auto-import` are fully implemented and operational.
- All endpoints require Admin role authorization and are guarded server-side.
- The `scan-and-import` endpoint accepts optional `basePath` and `language` query parameters.
- The `auto-import` endpoint accepts an optional `language` query parameter.
- The `errors` field in `ScanAndImportNasResult` and `AutoImportResult` is an array of strings describing individual file-level failures.
- The existing `ApiService`, `AuthService`, error interceptor, admin route guard, and Transloco i18n infrastructure are available and working.
- The feature enhances the existing NAS Scanner page — no new route or page is created.
- The language parameter for scan-and-import and auto-import uses BCP-47 format (e.g., `en`, `fr`).
- The current user's language preference is available from the existing i18n/locale service.
- The frontend does not enforce any timeout for scan or import HTTP requests; the backend manages its own operation timeouts.

## Clarifications

### Session 2026-04-09

- Q: How should scan-and-import / auto-import results (import statistics) be displayed on the NAS Scanner page? → A: Collapsible list (accordion/panel) below the stat cards, collapsed by default, expandable on click.
- Q: How should error details from import failures be presented to the admin? → A: Collapsible error list within the results area, consistent with the accordion pattern, keeping errors co-located with results.
- Q: When a new operation completes, what happens to the previous operation's results? → A: Replace previous results only upon new operation completion; previous results remain visible during loading to preserve context.
- Q: Should the frontend enforce a timeout for long-running scan/import operations? → A: No client-side timeout; NAS scanning I/O is inherently variable and a premature timeout could abort valid operations. Server manages its own timeouts.
- Q: How should the "Auto Import" button be positioned relative to path-dependent actions (Scan, Scan & Import)? → A: Separate section below path-dependent actions, visually distinct since Auto Import does not use the base path input.
