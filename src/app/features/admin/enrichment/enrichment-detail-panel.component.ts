import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { ProgressBarModule } from 'primeng/progressbar';
import { EnrichmentRunDetails } from '@shared/models/enrichment.model';

@Component({
  selector: 'app-enrichment-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, ProgressBarModule],
  templateUrl: './enrichment-detail-panel.component.html',
  styleUrl: './enrichment-detail-panel.component.scss',
})
export class EnrichmentDetailPanelComponent {
  readonly details = input<EnrichmentRunDetails | null>(null);

  readonly progressPercent = computed(() => {
    const d = this.details();
    if (!d || d.totalCount === 0) return 0;
    return Math.round((d.processedCount / d.totalCount) * 100);
  });

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Completed':
        return 'pi pi-check-circle';
      case 'InProgress':
        return 'pi pi-spinner pi-spin';
      case 'Failed':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-clock';
    }
  }
}
