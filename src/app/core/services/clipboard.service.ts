import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly messageService = inject(MessageService);

  async copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.add({
        severity: 'success',
        summary: 'common.pathCopied',
        life: 2000,
      });
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'common.copyFailed',
        life: 3000,
      });
    }
  }
}
