import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { TranslocoModule } from '@jsverse/transloco';
import { ANIMATION_TIMINGS } from '@shared/animations/animation.config';
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
  animations: [
    /**
     * @listEnter — staggered card entrance matching collection grid behaviour.
     * Cards slide up 16px + fade in, staggered by 50ms.
     */
    trigger('listEnter', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(16px)' }),
            stagger(50, [
              animate(ANIMATION_TIMINGS.NORMAL, style({ opacity: 1, transform: 'translateY(0)' })),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
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
