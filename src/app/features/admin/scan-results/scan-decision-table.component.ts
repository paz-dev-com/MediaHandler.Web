import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { ScanDecisionDetailComponent } from './scan-decision-detail.component';
import { ScanItemDecision } from '@shared/models/scan-decision.model';
import { LibraryRoot } from '@shared/models/library-root.model';
import { MediaType, ScanDecisionType } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface FilterOption<T> {
  label: string;
  value: T | null;
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

@Component({
  selector: 'app-scan-decision-table',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    SelectModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    ScanDecisionDetailComponent,
  ],
  templateUrl: './scan-decision-table.component.html',
  styleUrl: './scan-decision-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanDecisionTableComponent implements OnInit, OnChanges {
  private readonly decisionService = inject(AdminScanDecisionService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) scanId!: string;
  @Input() libraryRoots: LibraryRoot[] = [];
  @Output() filtersChanged = new EventEmitter<void>();

  readonly decisions = this.decisionService.decisions;
  readonly loading = this.decisionService.loading;
  readonly meta = this.decisionService.meta;

  selectedDecisionType: ScanDecisionType | null = null;
  selectedMediaType: MediaType | null = null;
  selectedLibraryRootId: string | null = null;

  decisionTypeOptions: FilterOption<ScanDecisionType>[] = [];
  mediaTypeOptions: FilterOption<MediaType>[] = [];
  libraryRootOptions: FilterOption<string>[] = [];

  expandedRows: Record<string, boolean> = {};

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildFilterOptions();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(): void {
    this.buildLibraryRootOptions();
    if (this.scanId) {
      this.loadDecisions(1, 20);
    }
  }

  private buildFilterOptions(): void {
    this.decisionTypeOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...Object.values(ScanDecisionType).map((v) => ({
        label: this.transloco.translate(`admin.scanResults.decisionType.${v}`),
        value: v,
      })),
    ];
    this.mediaTypeOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      {
        label: this.transloco.translate('admin.scanResults.mediaType.Film'),
        value: MediaType.Film,
      },
      {
        label: this.transloco.translate('admin.scanResults.mediaType.TvShow'),
        value: MediaType.TvShow,
      },
    ];
    this.buildLibraryRootOptions();
  }

  private buildLibraryRootOptions(): void {
    this.libraryRootOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...this.libraryRoots.map((r) => ({
        label: r.label ?? r.path,
        value: r.id,
      })),
    ];
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.loadDecisions(page, pageSize);
  }

  onDecisionTypeChange(value: ScanDecisionType | null): void {
    this.selectedDecisionType = value;
    this.loadDecisions(1, this.meta().pageSize);
  }

  onMediaTypeChange(value: MediaType | null): void {
    this.selectedMediaType = value;
    this.loadDecisions(1, this.meta().pageSize);
  }

  onLibraryRootChange(value: string | null): void {
    this.selectedLibraryRootId = value;
    this.loadDecisions(1, this.meta().pageSize);
  }

  private loadDecisions(page: number, pageSize: number): void {
    if (!this.scanId) return;
    this.decisionService.getDecisions(
      this.scanId,
      this.selectedDecisionType ?? undefined,
      this.selectedMediaType ?? undefined,
      this.selectedLibraryRootId ?? undefined,
      page,
      pageSize,
    );
  }

  getDecisionTypeSeverity(type: ScanDecisionType): TagSeverity {
    switch (type) {
      case ScanDecisionType.Added:
        return 'success';
      case ScanDecisionType.Updated:
        return 'info';
      case ScanDecisionType.Unchanged:
        return 'secondary';
      case ScanDecisionType.Removed:
        return 'danger';
      case ScanDecisionType.Excluded:
        return 'warn';
      case ScanDecisionType.NeedsReview:
        return 'warn';
      default:
        return undefined;
    }
  }

  getAssignedPosterUrl(decision: ScanItemDecision): string | null {
    if (!decision.assignedPosterPath) return null;
    return `${TMDB_IMAGE_BASE}${decision.assignedPosterPath}`;
  }

  trackByDecisionId(_: number, item: ScanItemDecision): string {
    return item.id;
  }

  toggleRow(id: string, currentlyExpanded: boolean): void {
    this.expandedRows = currentlyExpanded ? {} : { [id]: true };
  }
}
