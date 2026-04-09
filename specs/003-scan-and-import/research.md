# Research: Scan & Import

**Date**: 2026-04-09  
**Feature**: 003-scan-and-import

## 1. PrimeNG Accordion for Collapsible Import Results

**Decision**: Use PrimeNG `Accordion` component (from `primeng/accordion`) for collapsible import statistics and error details.

**Rationale**: The spec requires import results and error lists displayed in collapsible accordion panels, collapsed by default. PrimeNG's Accordion is already bundled with the project (PrimeNG 21.x is an existing dependency). It supports `activeIndex` binding for programmatic control, supports `multiple` mode for independently collapsible panels, and integrates with the existing Aura theme. No additional dependency or bundle cost.

**Alternatives considered**:

- PrimeNG `Panel` with `toggleable`: Simpler but lacks multi-section collapse behavior. Would require multiple independent panels with individual toggle state — more verbose.
- Custom collapsible `<details>`/`<summary>` HTML: Native and zero-cost, but doesn't match the PrimeNG design language used throughout the app. Would look inconsistent with the rest of the UI.
- PrimeNG `Fieldset` with `toggleable`: Possible, but semantically incorrect (fieldset is for form groups). Accordion better communicates "expandable results section".

**Key usage notes**:

- Import: `import { AccordionModule } from 'primeng/accordion';`
- Template: `<p-accordion [multiple]="true">` with `<p-accordion-panel>`, `<p-accordion-header>`, `<p-accordion-content>` children
- Default collapsed: Do not set `value` binding (panels are collapsed by default when no value is provided)
- Tree-shakeable: only the Accordion component enters the bundle when imported

**Constitution compliance**:

- No new dependency: PrimeNG already installed
- Bundle impact: ~5–10kB gzipped (tree-shaken Accordion component)
- Standalone: PrimeNG Accordion is standalone since v17+

---

## 2. Transloco Active Language for API Parameters

**Decision**: Use `TranslocoService.getActiveLang()` to obtain the current language for the `language` parameter in scan-and-import and auto-import API calls.

**Rationale**: Both new endpoints (`POST /api/v1/files/scan-and-import` and `POST /api/v1/files/auto-import`) accept an optional `language` parameter (BCP-47 format, e.g., `"en"`, `"fr"`) to pass to TMDB for metadata matching in the user's preferred language. The application already uses `@jsverse/transloco` for i18n with available languages `['en', 'fr']`. `TranslocoService.getActiveLang()` returns the current active language as a string — this is the simplest way to get the language without injecting the `AuthService` or reading the user profile.

**Alternatives considered**:

- Read from `AuthService.user().preferredLanguage`: Requires the user profile to be loaded. Could be `null` during initial load. More coupling between the scanner service and auth service.
- Hardcode `'en'` default: Defeats the purpose of bilingual support.
- Read from `navigator.language`: Not reliable — doesn't reflect the user's in-app language choice.

**Key usage notes**:

- Inject `TranslocoService` in `NasScannerService`
- Call `this.transloco.getActiveLang()` when building API request params
- Returns `'en'` or `'fr'` matching the configured `availableLangs`

**Constitution compliance**:

- No new dependency
- Signals-first: language is read synchronously at call time (not a subscription)

---

## 3. Service Signal Design for Multiple Operation Types

**Decision**: Use a unified `loading` signal (renamed from `scanning`) plus a discriminated `lastOperationType` signal to track which operation produced the current results, alongside separate result signals for each result type.

**Rationale**: The page now supports three operations (scan, scan-and-import, auto-import), each returning a different result shape. The existing service has `scanning`, `result`, and `error` signals. The design extends this pattern with:

- `loading: signal(false)` — replaces `scanning`, true during any operation
- `scanResult: signal<ScanNasResult | null>(null)` — result from scan-only
- `scanAndImportResult: signal<ScanAndImportNasResult | null>(null)` — result from combined operation
- `autoImportResult: signal<AutoImportResult | null>(null)` — result from auto-import
- `error: signal<string | null>(null)` — error translation key (preserved)

Each operation method clears only its own result signal and sets the appropriate result on success. The page component uses these signals to conditionally render the correct result components. Previous results from other operations remain visible until replaced by a new operation of the same type, fulfilling the spec requirement (FR-015: previous results remain visible during loading, replaced only on new completion).

**Alternatives considered**:

- Single `result: signal<ScanNasResult | ScanAndImportNasResult | AutoImportResult | null>` with type discrimination: Works but makes the template logic more complex with type narrowing. Three separate signals are simpler to consume.
- NgRx or signal store: Overkill for 3 signals. Constitution principle: simplicity.
- Combined result clearing (clear all on any new operation): Violates FR-015 — previous results should remain visible during loading.

**Constitution compliance**:

- Signals-first: all state as Angular signals
- Single responsibility: service manages scan-related state only
- Strict typing: separate typed signals, no `any` or union discrimination needed in templates

---

## 4. UX Layout for Path-Dependent vs. Path-Independent Actions

**Decision**: Two visually separated sections on the NAS Scanner page:

1. **Path-dependent section** (top): Location buttons, base path input, "Scan" button, "Scan & Import" button — all actions that operate on a specific path.
2. **Path-independent section** (below, separated by a visual divider): "Auto Import" button — operates on all unlinked files globally, no path needed.

**Rationale**: The spec (FR-007) explicitly requires Auto Import to be in a "visually separate section from path-dependent actions". This separation prevents user confusion about whether Auto Import uses the base path input. A horizontal divider (`<hr>` or styled border) with a distinct section label achieves this.

**Alternatives considered**:

- Tabs (path actions vs. import actions): Over-engineers the UI. Both sections should be visible simultaneously.
- Same button row with tooltip explaining no path is needed: Too subtle. Users might enter a path expecting it to be used.

**Key layout notes**:

- "Scan" and "Scan & Import" buttons are side by side in the form row below the path input
- "Auto Import" has its own section with label and description
- All buttons disabled during any loading state (FR-009)

**Constitution compliance**:

- UX Consistency: Clear visual separation; all states (loading, error, results) handled
- Accessibility: buttons are keyboard-navigable; sections have clear labels
- Responsive: flex-wrap for button row, stacks vertically on mobile

---

## 5. Import Results Display Pattern

**Decision**: New `ImportResultsComponent` (standalone, OnPush) renders import statistics in a PrimeNG Accordion panel, collapsed by default. It accepts import stats and an errors array as inputs.

**Rationale**: The spec requires import results (matched, skipped, failed, errors) displayed as a collapsible accordion below the scan stat cards. Extracting this into its own component keeps the page component under the 200-line limit (constitution requirement) and follows the existing pattern where `ScanResultsComponent` is a separate presentational component.

The component supports two modes:
- **Scan & Import results**: Shows import stats (matched, skipped, failed) + errors
- **Auto Import results**: Shows import stats (totalUnlinked, matched, skipped, failed) + errors

Both share the same visual pattern. The component uses `@input()` for the import data and renders:
1. An accordion panel with summary statistics (key-value pairs)
2. A nested accordion panel for errors (only shown when errors exist)

**Constitution compliance**:

- Single responsibility: one component, one purpose (display import results)
- < 200 lines: presentational component with minimal logic
- OnPush + signals: uses `input()` signal-based inputs
- Standalone: no NgModule

