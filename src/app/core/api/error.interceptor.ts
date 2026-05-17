import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '@env/environment';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'error.badRequest',
  401: 'error.unauthorized',
  403: 'error.forbidden',
  404: 'error.notFound',
  409: 'error.conflict',
  429: 'error.tooManyRequests',
  500: 'error.serverError',
};

/**
 * Requests that should NOT display an error toast on specific status codes.
 * Key: URL suffix, Value: set of suppressed HTTP status codes.
 */
const SILENT_ERRORS: Array<{ urlSuffix: string; statuses: number[] }> = [
  // 404 on GET /auth/me is expected for new users — syncUser() handles it silently.
  { urlSuffix: '/auth/me', statuses: [404] },
];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // Only handle errors for our own API — never interfere with Auth0 SDK requests.
  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isSilent = SILENT_ERRORS.some(
        (rule) => req.url.endsWith(rule.urlSuffix) && rule.statuses.includes(error.status),
      );

      if (!isSilent) {
        const summary = ERROR_MESSAGES[error.status] ?? 'error.unknown';
        const detail =
          error.error?.errors?.[0]?.message ?? error.message ?? 'An unexpected error occurred.';

        messageService.add({ severity: 'error', summary, detail, life: 5000 });
      }

      return throwError(() => error);
    }),
  );
};
