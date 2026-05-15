import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CollectionStats } from '@core/api/api-response.model';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-collection-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  templateUrl: './collection-stats.component.html',
  styleUrl: './collection-stats.component.scss',
})
export class CollectionStatsComponent {
  readonly stats = input<CollectionStats | null>(null);
}
