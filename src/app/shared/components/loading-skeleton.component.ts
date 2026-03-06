import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-loading-skeleton',
  imports: [SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'card') {
      <div class="grid">
        @for (_ of items(); track $index) {
          <div class="col-12 sm:col-6 md:col-4 lg:col-3 xl:col-2">
            <div class="p-3">
              <p-skeleton height="280px" styleClass="mb-2" />
              <p-skeleton width="70%" styleClass="mb-1" />
              <p-skeleton width="40%" />
            </div>
          </div>
        }
      </div>
    } @else {
      @for (_ of items(); track $index) {
        <div class="flex gap-3 align-items-center mb-3">
          <p-skeleton width="48px" height="48px" shape="square" />
          <div class="flex-1">
            <p-skeleton width="60%" styleClass="mb-1" />
            <p-skeleton width="40%" />
          </div>
        </div>
      }
    }
  `,
})
export class LoadingSkeletonComponent {
  readonly variant = input<'card' | 'list'>('card');
  readonly count = input<number>(8);

  get items(): () => number[] {
    return () => Array.from({ length: this.count() });
  }
}
