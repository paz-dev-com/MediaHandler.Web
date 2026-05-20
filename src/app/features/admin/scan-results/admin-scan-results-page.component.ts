import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AdminScanService } from '../scanner/admin-scan.service';
import { AdminLibraryRootService } from '../library-roots/admin-library-root.service';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { ScanDecisionTableComponent } from './scan-decision-table.component';
import { ScanRunSummary } from '@shared/models/admin-scan.model';
import { ScanItemDecision } from '@shared/models/scan-decision.model';

interface ScanRunOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-admin-scan-results-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    SelectModule,
    ToolbarModule,
    ProgressSpinnerModule,
    MessageModule,
    ScanDecisionTableComponent,
  ],
  templateUrl: './admin-scan-results-page.component.html',
  styleUrl: './admin-scan-results-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScanResultsPageComponent implements OnInit {
  private readonly scanService = inject(AdminScanService);
  private readonly libraryRootService = inject(AdminLibraryRootService);
  private readonly scanDecisionService = inject(AdminScanDecisionService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedScanId = signal<string | null>(null);
  readonly scanRunOptions = signal<ScanRunOption[]>([]);
  readonly historyLoading = this.scanService.historyLoading;
  readonly libraryRoots = this.libraryRootService.roots;
  readonly scanIdForTable = computed(() => this.selectedScanId() ?? '');

  private savedScrollY = 0;

  // toObservable must be created in injection context (field initializer)
  private readonly scanHistory$: Observable<ScanRunSummary[]> = toObservable(
    this.scanService.scanHistory,
  );

  ngOnInit(): void {
    // Check for scanId route param first
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['scanId']) {
        this.selectedScanId.set(params['scanId']);
      }
    });

    // Load scan history and default to most recent
    this.scanService.getScanHistory(1, 100);
    this.scanHistory$
      .pipe(
        filter((history) => history.length > 0),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((history) => {
        const options = this.buildScanOptions(history);
        this.scanRunOptions.set(options);
        if (!this.selectedScanId()) {
          this.selectedScanId.set(history[0].id);
        }
      });

    // Load library roots for filters
    this.libraryRootService.getRoots(1, 100);
  }

  private buildScanOptions(history: ScanRunSummary[]): ScanRunOption[] {
    return history.map((scan, index) => ({
      label: `${scan.mode} — ${new Date(scan.startedAt).toLocaleString()}${index === 0 ? ' ★' : ''}`,
      value: scan.id,
    }));
  }

  onScanRunChange(scanId: string | null): void {
    this.selectedScanId.set(scanId);
  }

  onItemAssigned(updated: ScanItemDecision): void {
    // Save scroll before update (actual scroll save happens at assignment time in the table)
    this.savedScrollY = window.scrollY;
    // Update the decision in-place in the service signal
    this.scanDecisionService.decisions.update((list) =>
      list.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
    );
    // Restore scroll position
    window.scrollTo({ top: this.savedScrollY, behavior: 'instant' });
  }
}
