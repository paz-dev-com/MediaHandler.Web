import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  /** Attempts to copy text to clipboard. Returns true on success, false on failure. */
  async copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('common.pathCopied'),
        life: 2000,
      });
      return true;
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('common.copyFailed'),
        life: 3000,
      });
      return false;
    }
  }
}
