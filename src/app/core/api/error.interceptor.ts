import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
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

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const summary = ERROR_MESSAGES[error.status] ?? 'error.unknown';
      const detail =
        error.error?.errors?.[0]?.message ?? error.message ?? 'An unexpected error occurred.';

      messageService.add({ severity: 'error', summary, detail, life: 5000 });

      return throwError(() => error);
    }),
  );
};
