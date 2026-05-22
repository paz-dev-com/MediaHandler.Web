import { SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  signal,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
import { WishlistItem } from '@shared/models/wishlist.model';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { LocaleDatePipe } from '@shared/pipes/locale-date.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-wishlist-card',
  standalone: true,
  imports: [TranslocoModule, ButtonModule, TagModule, TmdbImagePipe, SlicePipe, LocaleDatePipe],
  templateUrl: './wishlist-card.component.html',
  styleUrl: './wishlist-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class WishlistCardComponent {
  readonly item = input.required<WishlistItem>();
  readonly hovered = signal(false);

  @Output() acquiredToggle = new EventEmitter<{ id: string; isAcquired: boolean }>();
  @Output() remove = new EventEmitter<string>();

  onMarkAcquired(): void {
    this.acquiredToggle.emit({ id: this.item().id, isAcquired: !this.item().isAcquired });
  }

  onRemove(): void {
    this.remove.emit(this.item().id);
  }
}
