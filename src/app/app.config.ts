import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideTransloco } from '@jsverse/transloco';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { errorInterceptor } from '@core/api/error.interceptor';
import { authInterceptor } from '@core/auth/auth.interceptor';
import { TranslocoHttpLoader } from '@core/i18n/transloco-loader';
import { environment } from '@env/environment';
import { routes } from './app.routes';

// Only include audience if it's configured — prevents Auth0 "Service not found"
// error when no API is registered in the Auth0 Dashboard yet.
const authParams: Record<string, string> = {
  redirect_uri: environment.auth0.redirectUri,
  scope: 'openid profile email',
};
if (environment.auth0.audience) {
  authParams['audience'] = environment.auth0.audience;
}

// Cinematic dark theme preset based on Aura with Indigo accent palette
const CinematicPreset = definePreset(Aura, {
  primitive: {
    indigo: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
  },
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#0a0a0f',
          100: '#141420',
          200: '#1e1e2e',
          300: '#27273a',
          400: '#313148',
          500: '#3b3b58',
          600: '#a1a1aa',
          700: '#c4c4cc',
          800: '#e0e0e6',
          900: '#f5f5f7',
          950: '#ffffff',
        },
        primary: {
          color: '#6366f1',
          contrastColor: '#ffffff',
          hoverColor: '#818cf8',
          activeColor: '#4f46e5',
        },
        highlight: {
          background: 'rgba(99, 102, 241, 0.16)',
          focusBackground: 'rgba(99, 102, 241, 0.24)',
          color: '#f5f5f7',
          focusColor: '#f5f5f7',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideAuth0({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
      authorizationParams: authParams,
    }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch()),
    providePrimeNG({
      theme: {
        preset: CinematicPreset,
        options: { darkModeSelector: false },
      },
    }),
    provideTransloco({
      config: {
        availableLangs: ['en', 'fr'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    MessageService,
  ],
};
