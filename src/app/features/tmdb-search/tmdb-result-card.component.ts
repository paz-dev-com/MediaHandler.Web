import { DecimalPipe, SlicePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { TmdbImagePipe } from '@shared/pipes/tmdb-image.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TmdbSearchResult } from './tmdb-search.service';

@Component({
  selector: 'app-tmdb-result-card',
  standalone: true,
  imports: [TranslocoModule, ButtonModule, TagModule, TooltipModule, TmdbImagePipe, SlicePipe, DecimalPipe],
  templateUrl: './tmdb-result-card.component.html',
  styleUrl: './tmdb-result-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TmdbResultCardComponent {
  @Input({ required: true }) result!: TmdbSearchResult;
  @Input() importing = false;
  @Input() wishlisting = false;

  @Output() importClick = new EventEmitter<TmdbSearchResult>();
  @Output() wishlistClick = new EventEmitter<TmdbSearchResult>();

  onImport(): void {
    this.importClick.emit(this.result);
  }

  onWishlist(): void {
    this.wishlistClick.emit(this.result);
  }
}
