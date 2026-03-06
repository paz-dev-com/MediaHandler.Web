import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ErrorMessageComponent } from '@shared/components/error-message.component';
import { LoadingSkeletonComponent } from '@shared/components/loading-skeleton.component';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { WishlistCardComponent } from './wishlist-card.component';
import { WishlistService } from './wishlist.service';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [
    TranslocoModule,
    PaginatorModule,
    WishlistCardComponent,
    LoadingSkeletonComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPageComponent implements OnInit {
  readonly wishlistService = inject(WishlistService);

  readonly pageSize = 20;

  ngOnInit(): void {
    this.wishlistService.loadItems(1, this.pageSize);
  }

  onPageChange(event: PaginatorState): void {
    this.wishlistService.loadItems((event.page ?? 0) + 1, this.pageSize);
  }

  onAcquiredToggle(event: { id: string; isAcquired: boolean }): void {
    this.wishlistService.markAcquired(event.id, event.isAcquired);
  }

  onRemove(id: string): void {
    this.wishlistService.removeItem(id);
  }

  onRetry(): void {
    this.wishlistService.loadItems(1, this.pageSize);
  }
}
