import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Locale-aware date formatting pipe.
 * Formats dates according to the active UI locale:
 *   - fr → dd/MM/yyyy
 *   - en → MM/dd/yyyy
 *
 * Returns '—' for null, undefined, or invalid date inputs.
 *
 * Marked pure: false so it re-evaluates when the language changes.
 */
@Pipe({
  name: 'localeDate',
  standalone: true,
  pure: false,
})
export class LocaleDatePipe implements PipeTransform {
  private readonly transloco = inject(TranslocoService);

  transform(value: Date | string | null | undefined, format?: string): string {
    if (value === null || value === undefined || value === '') return '—';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '—';

    const lang = this.transloco.getActiveLang();
    const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

    if (format === 'year') {
      return date.getFullYear().toString();
    }

    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }
}
