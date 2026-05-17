import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Register French locale data for Intl.DateTimeFormat locale-aware formatting
registerLocaleData(localeFr, 'fr');
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

// Cinematic dark theme preset based on Aura with Indigo accent palette.
// All semantic colorScheme.light tokens are overridden to dark values so that
// PrimeNG's runtime CSS variable injection produces dark backgrounds/text,
// regardless of CSS cascade order.
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
        // Surface scale remapped to cinematic dark palette
        surface: {
          0: '#141420',
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
        // Text tokens — overridden so all components get light text on dark bg
        text: {
          color: '#f5f5f7',
          hoverColor: '#f5f5f7',
          mutedColor: '#a1a1aa',
          hoverMutedColor: '#f5f5f7',
        },
        // Content background — this is what accordion, panels, overlays use
        content: {
          background: '#141420',
          hoverBackground: '#1e1e2e',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          color: '#f5f5f7',
        },
        // Form fields (inputs, selects, textareas)
        formField: {
          background: '#1e1e2e',
          disabledBackground: '#0a0a0f',
          filledBackground: '#1e1e2e',
          filledFocusBackground: '#1e1e2e',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          hoverBorderColor: '#818cf8',
          focusBorderColor: '#6366f1',
          invalidBorderColor: '#ef4444',
          color: '#f5f5f7',
          disabledColor: '#a1a1aa',
          placeholderColor: '#a1a1aa',
          iconColor: '#a1a1aa',
          shadow: 'none',
        },
        // Overlay panels (select dropdown, popover, dialog)
        overlay: {
          select: {
            background: '#141420',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
          },
          popover: {
            background: '#141420',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: '#f5f5f7',
          },
          modal: {
            background: '#141420',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: '#f5f5f7',
          },
          navigation: {
            background: '#141420',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            color: '#f5f5f7',
          },
        },
        // List options (dropdown items, multiselect, autocomplete)
        list: {
          option: {
            focusBackground: '#1e1e2e',
            selectedBackground: 'rgba(99, 102, 241, 0.15)',
            selectedFocusBackground: 'rgba(99, 102, 241, 0.25)',
            color: '#f5f5f7',
            focusColor: '#f5f5f7',
            selectedColor: '#818cf8',
            selectedFocusColor: '#818cf8',
          },
          optionGroup: {
            background: '#0a0a0f',
            color: '#a1a1aa',
          },
        },
        // Navigation items (menubar, breadcrumb, etc.)
        navigation: {
          item: {
            focusBackground: '#1e1e2e',
            activeBackground: 'rgba(99, 102, 241, 0.1)',
            color: '#a1a1aa',
            focusColor: '#f5f5f7',
            activeColor: '#6366f1',
            icon: {
              color: '#a1a1aa',
              focusColor: '#f5f5f7',
              activeColor: '#6366f1',
            },
          },
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
