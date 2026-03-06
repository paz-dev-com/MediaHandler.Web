import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-message',
  imports: [TranslocoModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-column align-items-center justify-content-center gap-3 p-5">
      <i class="pi pi-exclamation-circle text-5xl text-red-500"></i>
      <p class="text-color-secondary m-0">{{ message() || ('common.error' | transloco) }}</p>
      @if (showRetry()) {
        <p-button
          [label]="'common.retry' | transloco"
          icon="pi pi-refresh"
          severity="secondary"
          (onClick)="retry.emit()"
        />
      }
    </div>
  `,
})
export class ErrorMessageComponent {
  readonly message = input<string>('');
  readonly showRetry = input<boolean>(true);
  readonly retry = output<void>();
}
