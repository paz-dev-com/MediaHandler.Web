# Research: Media Collection Manager

**Date**: 2026-03-05  
**Feature**: 001-media-collection-manager

## 1. UI Component Library — PrimeNG + PrimeFlex

**Decision**: PrimeNG v21.x + PrimeFlex v4.x

**Rationale**: PrimeNG now version-locks with Angular (v21 for Angular 21), ensuring full compatibility. It provides a comprehensive set of standalone components (data tables, cards, dialogs, sidebars, menus, paginator, toast) needed for the collection manager UI. PrimeFlex provides utility CSS classes for responsive layout without adding Angular-specific overhead. Since PrimeNG v17+, the library moved to standalone component imports and a design token system via `@primeuix/themes`.

**Alternatives considered**:
- Angular Material: Heavier bundle, more opinionated design. PrimeNG offers richer data-display components (DataView, DataTable with built-in filtering/pagination) needed for the media grid.
- Custom components only: Would require building card grids, pagination, sidebar, responsive utilities from scratch — excessive for a personal project.

**Key setup notes**:
- Install: `primeng`, `@primeuix/themes`, `primeflex`
- Configure `providePrimeNG()` in `app.config.ts` with a theme preset (Aura or Lara)
- Each component imported individually for tree-shaking
- PrimeFlex used purely as CSS utility classes (no Angular peer dependency)

**Constitution compliance**:
- Tree-shakeable: only imported components enter the bundle (respects bundle budget)
- Standalone components: all PrimeNG components are standalone since v17+
- Bundle impact per component: 5–30 kB gzipped; theme preset: ~15–25 kB gzipped

---

## 2. Authentication — Okta Integration

**Decision**: `@okta/okta-auth-js` (framework-agnostic) with a thin custom Angular service wrapper, rather than `@okta/okta-angular`

**Rationale**: `@okta/okta-angular` v7.0.0 is only officially tested with Angular 16–19, not Angular 21. It also uses the legacy `NgModule` pattern (`OktaAuthModule.forRoot()`). By using the framework-agnostic `@okta/okta-auth-js` directly, we avoid compatibility risks and align with the constitution's standalone component mandate. The custom wrapper is minimal (auth service + functional guard + functional interceptor) and gives full control over the authentication flow.

**Alternatives considered**:
- `@okta/okta-angular` v7.0.0: Not officially tested with Angular 21; uses NgModule imports which contradict the standalone-only constitution principle. Higher risk.
- Custom OAuth2/OIDC implementation: Unnecessary complexity when okta-auth-js provides the OIDC client.

**Key setup notes**:
- Install: `@okta/okta-auth-js`
- Create `AuthService` wrapping OktaAuth instance (login, logout, token management, user info)
- Create functional `authGuard` for route protection
- Create functional `authInterceptor` for Bearer token injection
- Create callback route for Okta OIDC redirect
- Store auth configuration in environment files

**Constitution compliance**:
- Signals-first: AuthService exposes `isAuthenticated` and `user` as signals
- Standalone: no NgModule needed
- Strict typing: all auth types defined (no `any`)
- Dependency justification: okta-auth-js is the official Okta SDK; browser bundle ~40–80 kB gzipped

---

## 3. Internationalization — Bilingual EN/FR

**Decision**: `@jsverse/transloco`

**Rationale**: The spec requires runtime language switching (English default, French for France-based users, toggleable at any time). Angular's built-in `@angular/localize` is build-time only and cannot switch at runtime without separate deployments. Transloco supports runtime switching, lazy-loaded translation files, signals, standalone components, and has active maintenance with Angular CLI schematics.

**Alternatives considered**:
- `@angular/localize`: Build-time only — requires deploying separate bundles per language and server-side redirects. Not feasible for in-app language switching.
- `@ngx-translate/core` v17.0.0: Published 7 months ago with uncertain Angular 21 compatibility. No signal support. Less actively maintained.

**Key setup notes**:
- Install: `@jsverse/transloco`
- Create `assets/i18n/en.json` and `assets/i18n/fr.json` translation files
- Configure `provideTransloco()` in `app.config.ts` with default language detection
- Use `transloco` directive in templates for translation keys
- Language preference synced with user's backend profile (`PreferredLanguage`)
- Detect initial language from browser locale or user profile

**Constitution compliance**:
- Signals-first: Transloco provides signal-based API
- Lazy loading: translation files loaded on demand (not in initial bundle)
- Bundle impact: ~12 kB gzipped core; translation JSON files loaded separately

---

## 4. HTTP Client & API Integration

**Decision**: Angular built-in `provideHttpClient` with functional interceptors and `withFetch()`

**Rationale**: Angular 21 provides a mature functional interceptor API. No external library needed. The auth token interceptor, error handling interceptor, and base URL interceptor are standard functional interceptors composed in `app.config.ts`.

**Alternatives considered**:
- Class-based `HttpInterceptor`: Legacy pattern, still works but not recommended for new code.
- External HTTP client (axios, etc.): Unnecessary — Angular's HttpClient is fully featured with typed responses, interceptors, and RxJS integration.

**Key setup notes**:
- Add `provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch())` to app config
- Create typed API service per domain (MediaApiService, WishlistApiService, TmdbApiService, AuthApiService)
- All API responses wrapped in `ApiResponse<T>` envelope matching backend pattern
- Environment-based API base URL configuration

**Constitution compliance**:
- Zero additional dependencies
- Strict typing: all request/response types defined
- Observable-based: HTTP streams are the appropriate use of RxJS per constitution

---

## 5. State Management

**Decision**: Angular signals with services — no external state management library

**Rationale**: The constitution mandates signals-first state management. The application's state is straightforward: media list with filters, media detail, wishlist items, user profile, and auth state. Each feature area has a service holding signals that components consume. No global store is needed for this scale.

**Alternatives considered**:
- NgRx: Heavyweight for this application's scope. Adds ~50 kB+ to the bundle and introduces boilerplate (actions, reducers, effects, selectors). The app has at most 5 feature areas with independent state.
- NgRx Signal Store: Lighter than full NgRx but still an unnecessary dependency when plain service + signals suffice.

**Key setup notes**:
- One service per feature area: `CollectionService`, `MediaDetailService`, `WishlistService`, `TmdbSearchService`, `UserService`
- Each service exposes reactive state via `signal()` and `computed()`
- HTTP calls in services, results stored in signals
- Components use signals directly in templates (no async pipe needed for signals)

**Constitution compliance**:
- Signals-first: direct compliance
- No additional dependencies: zero bundle impact
- Single responsibility: one service per domain
- Testability: services easily mocked in component tests

---

## 6. Routing & Lazy Loading

**Decision**: File-based lazy-loaded routes using Angular's `loadComponent` / `loadChildren`

**Rationale**: The constitution mandates lazy loading for all feature routes. Only the shell (sidebar + auth) is in the initial bundle. Each feature area (collection, media detail, TMDB search, wishlist, profile) is a separate lazy-loaded route chunk.

**Key setup notes**:
- Shell layout component in the initial bundle (sidebar navigation)
- Feature routes use `loadComponent` for single-component routes or `loadChildren` for feature areas with sub-routes
- Auth callback route is eager (needed for Okta redirect flow)
- Route guards: `authGuard` on all protected routes

**Constitution compliance**:
- Lazy loading: all feature routes lazy-loaded
- Bundle budget: initial bundle contains only shell + auth
- OnPush: all components use OnPush change detection

---

## 7. Clipboard API for NAS Paths

**Decision**: Browser Clipboard API (`navigator.clipboard.writeText()`)

**Rationale**: Modern browsers all support the Clipboard API. No library needed. The spec requires copying NAS file paths to clipboard with a single click.

**Alternatives considered**:
- `ngx-clipboard`: Unnecessary wrapper around the native API. Adds a dependency for no benefit on modern browsers.

**Key setup notes**:
- Create a small `ClipboardService` utility wrapping `navigator.clipboard.writeText()`
- Show toast notification on copy success/failure using PrimeNG Toast

**Constitution compliance**:
- No additional dependency
- Accessible: button with clear label ("Copy path")
