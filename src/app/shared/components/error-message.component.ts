import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-message',
  imports: [TranslocoModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-message">
      <i class="pi pi-exclamation-circle error-message__icon" aria-hidden="true"></i>
      <p class="error-message__text">{{ message() || ('common.error' | transloco) }}</p>
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
  styles: [
    `
      .error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 2rem 1.5rem;
        background: var(--color-bg-elevated);
        border: 1px solid var(--color-accent);
        border-radius: 8px;

        &__icon {
          font-size: 2.5rem;
          color: var(--color-accent);
        }

        &__text {
          margin: 0;
          color: var(--color-text-primary);
          font-family: var(--font-body);
          text-align: center;
        }
      }
    `,
  ],
})
export class ErrorMessageComponent {
  readonly message = input<string>('');
  readonly showRetry = input<boolean>(true);
  readonly retry = output<void>();
}
