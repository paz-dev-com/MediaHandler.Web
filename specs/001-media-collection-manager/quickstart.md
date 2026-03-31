# Quickstart: Media Collection Manager

**Feature**: 001-media-collection-manager  
**Date**: 2026-03-05

## Prerequisites

- Node.js 20+ and npm 11+
- Angular CLI 21.x (`npm install -g @angular/cli`)
- Running instance of MediaHandler.API (local or remote)
- Okta developer account with OIDC application configured

## Install Dependencies

```bash
cd MediaHandler.Web

# Core dependencies (already installed)
# @angular/core, @angular/router, @angular/common, rxjs

# UI components & responsive layout
npm install primeng @primeuix/themes primeflex

# Authentication
npm install @okta/okta-auth-js

# Internationalization
npm install @jsverse/transloco
```

## Environment Configuration

Create environment files:

**`src/environments/environment.ts`** (development):

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'https://localhost:7001/api/v1',
  okta: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}',
    redirectUri: 'http://localhost:4200/auth/callback',
    scopes: ['openid', 'profile', 'email'],
  },
};
```

**`src/environments/environment.prod.ts`** (production):

```typescript
export const environment = {
  production: true,
  apiBaseUrl: '{productionApiUrl}/api/v1',
  okta: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}',
    redirectUri: '{productionUrl}/auth/callback',
    scopes: ['openid', 'profile', 'email'],
  },
};
```

## Run Development Server

```bash
npm start
# Application available at http://localhost:4200
```

## Run Tests

```bash
npm test
```

## Backend API

The application consumes all data from the MediaHandler.API backend. Ensure the API is running and accessible at the URL configured in `environment.apiBaseUrl`.

API source: `C:\Users\tibo.pfeifer\source\repos\MediaHandler\MediaHandler.API`  
GitHub: https://github.com/paz-dev-com/MediaHandler.API

## Key Configuration Files

| File                              | Purpose                                                 |
| --------------------------------- | ------------------------------------------------------- |
| `angular.json`                    | Build config, bundle budgets, SCSS                      |
| `src/app/app.config.ts`           | Root providers (router, HTTP, PrimeNG, Transloco, auth) |
| `src/app/app.routes.ts`           | Top-level routes with lazy loading                      |
| `src/environments/environment.ts` | API URL, Okta config                                    |
| `src/assets/i18n/en.json`         | English translations                                    |
| `src/assets/i18n/fr.json`         | French translations                                     |
