<!--
Sync Impact Report
- Version change: N/A → 1.0.0 (initial ratification)
- Added principles:
  - I. Code Quality & Maintainability
  - II. Testing Standards
  - III. User Experience Consistency
  - IV. Performance Requirements
- Added sections:
  - Technical Decision Framework
  - Implementation Standards
  - Governance
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no update needed (Constitution Check section already generic)
  - .specify/templates/spec-template.md ✅ no update needed (success criteria align with principles)
  - .specify/templates/tasks-template.md ✅ no update needed (phase structure supports principle-driven workflow)
- Follow-up TODOs: none
-->

# MediaHandler.Web Constitution

## Core Principles

### I. Code Quality & Maintainability

All code MUST adhere to the following non-negotiable standards:

- **Single Responsibility**: Every component, service, and function MUST have one
  clear purpose. Components exceeding 200 lines MUST be refactored into smaller units.
- **Angular Signals-First**: New state management MUST use Angular signals.
  Observable-based state is permitted only for async streams (HTTP, WebSocket).
- **Strict Typing**: TypeScript strict mode MUST remain enabled. `any` type is
  forbidden unless justified in a code review comment. All public APIs MUST have
  explicit return types.
- **Prettier Compliance**: All committed code MUST pass the project Prettier
  configuration (100 char width, single quotes, Angular HTML parser).
- **Standalone Components**: All new components MUST be standalone. NgModules
  MUST NOT be introduced.
- **Reactive Patterns**: RxJS operators MUST be used for stream composition.
  Manual subscriptions MUST be avoided; use `async` pipe or `toSignal()` instead.

**Rationale**: Consistent, readable code reduces onboarding time, minimizes bugs,
and enables confident refactoring.

### II. Testing Standards

Testing is mandatory for all delivered features:

- **Unit Tests Required**: Every service, pipe, and non-trivial component MUST
  have unit tests using Vitest. Minimum coverage target: 80% of statements for
  new code.
- **Component Tests**: Components with user interaction logic MUST have tests
  verifying DOM behavior (inputs, outputs, user events).
- **Test Isolation**: Each test MUST be independent. Shared mutable state between
  tests is forbidden. Use `beforeEach` for fresh setup.
- **Descriptive Test Names**: Test names MUST describe the expected behavior in
  plain language (e.g., `should display error message when upload fails`).
- **No Implementation Testing**: Tests MUST verify behavior, not implementation
  details. Avoid testing private methods or internal state directly.
- **Test-First Encouraged**: For bug fixes, a failing test reproducing the bug
  SHOULD be written before the fix is applied.

**Rationale**: Comprehensive tests are the safety net that enables fast iteration
and prevents regressions.

### III. User Experience Consistency

All user-facing features MUST deliver a coherent, predictable experience:

- **Responsive Design**: All views MUST function correctly on viewports from
  360px to 2560px wide. Mobile-first SCSS MUST be the default approach.
- **Loading States**: Every asynchronous operation visible to the user MUST
  display a loading indicator. Empty states MUST show meaningful guidance.
- **Error Feedback**: All user-facing errors MUST display a clear, actionable
  message. Technical details (stack traces, HTTP codes) MUST NOT be shown to
  end users.
- **Accessibility Baseline**: Interactive elements MUST be keyboard-navigable.
  Images MUST have `alt` attributes. Color MUST NOT be the sole indicator of
  state.
- **Consistent Styling**: All UI elements MUST use shared SCSS variables/mixins
  for colors, spacing, and typography. Hard-coded values are forbidden in
  component styles.
- **Animation Restraint**: Animations MUST serve a functional purpose (feedback,
  orientation). Decorative animations MUST respect `prefers-reduced-motion`.

**Rationale**: Users trust software that behaves predictably. Consistency reduces
cognitive load and support requests.

### IV. Performance Requirements

The application MUST meet the following performance targets:

- **Bundle Budget**: Initial bundle MUST NOT exceed 500kB (warning) / 1MB (error).
  Component styles MUST NOT exceed 4kB (warning) / 8kB (error). These budgets
  are enforced in `angular.json` and MUST NOT be relaxed without governance review.
- **Lazy Loading**: Feature routes MUST be lazy-loaded. Only the shell and
  authentication components are permitted in the initial bundle.
- **Change Detection**: Components MUST use `OnPush` change detection strategy.
  Default change detection is forbidden for new components.
- **Image Optimization**: Images MUST use Angular's `NgOptimizedImage` directive
  with proper `width`/`height` attributes. Unoptimized `<img>` tags are forbidden.
- **Memory Management**: Subscriptions and event listeners MUST be cleaned up on
  component destroy. Use `DestroyRef` or `takeUntilDestroyed()` for RxJS streams.
- **Core Web Vitals**: Production deployments SHOULD target LCP < 2.5s,
  FID < 100ms, CLS < 0.1 on a 4G mobile connection.

**Rationale**: Performance directly impacts user retention. Budget enforcement
prevents gradual degradation that is costly to reverse.

## Technical Decision Framework

All technical decisions MUST be evaluated against these criteria, in order:

1. **Correctness**: Does it produce the right result in all defined scenarios?
2. **Simplicity**: Is it the simplest solution that satisfies the requirement?
   Complexity MUST be justified in the PR description.
3. **Testability**: Can the implementation be verified through automated tests
   without excessive mocking?
4. **Performance Impact**: Does it respect bundle budgets and runtime targets?
   New dependencies MUST document their bundle size impact.
5. **Maintainability**: Will a developer unfamiliar with this code understand
   it within 5 minutes?

New third-party dependencies MUST be justified in writing with:
- Problem being solved
- Bundle size cost (checked via `npx bundlephobia <package>` or equivalent)
- Alternatives considered and why they were rejected
- Active maintenance status (last release < 6 months, no critical open issues)

## Implementation Standards

Development workflow MUST follow these practices:

- **Branch Strategy**: Feature branches MUST be created from `main`. Branch names
  MUST follow the pattern `<type>/<description>` (e.g., `feat/upload-gallery`,
  `fix/thumbnail-loading`).
- **Commit Messages**: MUST follow Conventional Commits format
  (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `perf:`, `chore:`).
- **Code Review**: All changes MUST be reviewed before merge. Reviewers MUST
  verify compliance with this constitution's principles.
- **No Dead Code**: Unused imports, commented-out code, and unreachable branches
  MUST be removed before merge.

## Governance

This constitution is the authoritative guide for all technical decisions in
the MediaHandler.Web project. It supersedes informal conventions and individual
preferences.

### Amendment Procedure

1. Propose the change with a rationale in a dedicated PR modifying this file.
2. All active contributors MUST review the proposal.
3. Approval requires consensus (no unresolved objections).
4. The constitution version MUST be incremented per semantic versioning:
   - **MAJOR**: Principle removal or incompatible redefinition.
   - **MINOR**: New principle or material expansion of existing guidance.
   - **PATCH**: Clarification, wording fix, non-semantic refinement.

### Compliance

- Every pull request reviewer MUST check the change against applicable
  principles before approving.
- Violations discovered post-merge MUST be addressed in the next sprint.
- Bundle budget overrides or principle exceptions MUST be documented in an
  Architecture Decision Record (ADR) and approved by the team.

### Versioning Policy

Version numbers follow `MAJOR.MINOR.PATCH`. The current version and dates
are recorded at the bottom of this document.

**Version**: 1.0.0 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
