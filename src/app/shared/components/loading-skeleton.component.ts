import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.scss',
})
export class LoadingSkeletonComponent {
  readonly variant = input<'card' | 'list'>('card');
  readonly count = input<number>(12);

  get items(): () => number[] {
    return () => Array.from({ length: this.count() });
  }
}
