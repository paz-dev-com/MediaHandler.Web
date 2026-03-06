import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { WishlistItem } from '@shared/models/wishlist.model';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-wishlist-card',
  standalone: true,
  imports: [TranslocoModule, ButtonModule, TagModule, TmdbImagePipe, SlicePipe, DatePipe],
  templateUrl: './wishlist-card.component.html',
  styleUrl: './wishlist-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistCardComponent {
  @Input({ required: true }) item!: WishlistItem;

  @Output() acquiredToggle = new EventEmitter<{ id: string; isAcquired: boolean }>();
  @Output() remove = new EventEmitter<string>();

  onMarkAcquired(): void {
    this.acquiredToggle.emit({ id: this.item.id, isAcquired: !this.item.isAcquired });
  }

  onRemove(): void {
    this.remove.emit(this.item.id);
  }
}
