import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { provideTransloco } from '@jsverse/transloco';
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
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
        preset: Aura,
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
