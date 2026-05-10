import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { ScanDecisionDetailComponent } from './scan-decision-detail.component';
import { TmdbSearchPanelComponent } from '../shared/tmdb-search-panel.component';
import { TmdbSearchResult } from '@features/tmdb-search/tmdb-search.service';
import { ScanDecisionShowGroup, ScanItemDecision } from '@shared/models/scan-decision.model';
import { TmdbCandidate } from '@shared/models/review.model';
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
    DecimalPipe,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    ChipModule,
    DialogModule,
    SelectModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule,
    ScanDecisionDetailComponent,
    TmdbSearchPanelComponent,
  ],
  templateUrl: './scan-decision-table.component.html',
  styleUrl: './scan-decision-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScanDecisionTableComponent implements OnInit, OnChanges {
  private readonly decisionService = inject(AdminScanDecisionService);
  private readonly transloco = inject(TranslocoService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) scanId!: string;
  @Input() libraryRoots: LibraryRoot[] = [];

  readonly decisions = this.decisionService.decisions;
  readonly groupedDecisions = this.decisionService.groupedDecisions;
  readonly loading = this.decisionService.loading;
  readonly meta = this.decisionService.meta;

  // T109: Reassign is always enabled — backend (T057) handles already-enriched media correctly.
  // The UI does not disable reassignment based on enrichment status.
  readonly assigningGroup = signal<string | null>(null);
  readonly groupSearchFor = signal<ScanDecisionShowGroup | null>(null);

  selectedDecisionType: ScanDecisionType | null = null;
  selectedMediaType: MediaType | null = null;
  selectedLibraryRootId: string | null = null;

  /** Toggle between grouped view (default) and flat table view */
  useGroupedView = true;

  decisionTypeOptions: FilterOption<ScanDecisionType>[] = [];
  mediaTypeOptions: FilterOption<MediaType>[] = [];
  libraryRootOptions: FilterOption<string>[] = [];

  expandedRows: Record<string, boolean> = {};
  expandedGroups: Record<string, boolean> = {};

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
      this.loadData(1, 20);
    }
  }

  private buildFilterOptions(): void {
    this.decisionTypeOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...Object.values(ScanDecisionType).map((v) => ({
        label: this.transloco.translate(`admin.scanResults.decisionTypes.${v}`),
        value: v,
      })),
    ];
    this.mediaTypeOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      {
        label: this.transloco.translate('admin.scanResults.mediaTypes.Film'),
        value: MediaType.Film,
      },
      {
        label: this.transloco.translate('admin.scanResults.mediaTypes.TvShow'),
        value: MediaType.TvShow,
      },
    ];
    this.buildLibraryRootOptions();
  }

  private buildLibraryRootOptions(): void {
    this.libraryRootOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...this.libraryRoots.map((r) => ({ label: r.label ?? r.path, value: r.id })),
    ];
  }

  private loadData(page: number, pageSize: number): void {
    if (!this.scanId) return;
    if (this.useGroupedView) {
      this.decisionService.getGroupedDecisions(
        this.scanId,
        this.selectedDecisionType ?? undefined,
        this.selectedMediaType ?? undefined,
        this.selectedLibraryRootId ?? undefined,
      );
    } else {
      this.decisionService.getDecisions(
        this.scanId,
        this.selectedDecisionType ?? undefined,
        this.selectedMediaType ?? undefined,
        this.selectedLibraryRootId ?? undefined,
        page,
        pageSize,
      );
    }
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    if (!this.useGroupedView) this.loadData(page, pageSize);
  }

  onDecisionTypeChange(v: ScanDecisionType | null): void {
    this.selectedDecisionType = v;
    this.loadData(1, this.meta().pageSize);
  }
  onMediaTypeChange(v: MediaType | null): void {
    this.selectedMediaType = v;
    this.loadData(1, this.meta().pageSize);
  }
  onLibraryRootChange(v: string | null): void {
    this.selectedLibraryRootId = v;
    this.loadData(1, this.meta().pageSize);
  }

  toggleViewMode(): void {
    this.useGroupedView = !this.useGroupedView;
    this.expandedRows = {};
    this.expandedGroups = {};
    this.loadData(1, this.meta().pageSize);
  }

  toggleGroup(showName: string): void {
    this.expandedGroups = this.expandedGroups[showName]
      ? (({ [showName]: _, ...rest }) => rest)(this.expandedGroups)
      : { ...this.expandedGroups, [showName]: true };
  }

  isGroupExpanded(showName: string): boolean {
    return !!this.expandedGroups[showName];
  }

  /** Returns show-level candidates: from group.candidates if available, else from first episode. */
  getGroupCandidates(group: ScanDecisionShowGroup): TmdbCandidate[] {
    return group.candidates ?? group.episodes[0]?.candidates ?? [];
  }

  /** Assign all episodes in a group to a TMDB entry.
   *  - For TV show groups (groupId present): uses the batch endpoint to avoid duplicate Media rows
   *    caused by concurrent parallel inserts (race condition).
   *  - For single-item groups (movies, no groupId): uses individual reassign.
   *  @param kindOverride when provided (e.g. from TMDB search panel), use it directly.
   *  When absent (e.g. from stored candidates), derive from the group's episode context. */
  onAssignToAll(
    group: ScanDecisionShowGroup,
    tmdbId: number,
    kind: string,
    t: (k: string) => string,
    kindOverride?: MediaType,
  ): void {
    const authoritativeKind = kindOverride ?? this.getGroupMediaType(group);
    this.assigningGroup.set(group.showName);

    // Use the atomic batch endpoint for TV groups to prevent N concurrent inserts
    // creating N duplicate Media rows in the database.
    const obs$ = group.groupId
      ? this.decisionService.assignTvGroup(group.groupId, tmdbId).pipe(map(() => void 0))
      : this.decisionService.assignGroupDecisions(group.episodes, tmdbId, authoritativeKind);

    obs$.subscribe({
      next: () => {
        this.assigningGroup.set(null);
        this.messageService.add({
          severity: 'success',
          summary: t('admin.scanResults.assignToAll'),
          life: 3000,
        });
        this.loadData(1, this.meta().pageSize);
      },
      error: () => this.assigningGroup.set(null),
    });
  }

  openGroupSearch(group: ScanDecisionShowGroup): void {
    this.groupSearchFor.set(group);
  }

  onGroupTmdbSelected(result: TmdbSearchResult, t: (k: string) => string): void {
    const group = this.groupSearchFor();
    if (!group) return;
    this.groupSearchFor.set(null);
    // result.mediaType from /search/multi is always reliable ("tv" or "movie").
    // The user explicitly selected this result — pass it as kindOverride so
    // onAssignToAll uses it directly without going through getGroupMediaType.
    const kind: MediaType = result.mediaType === 'movie' ? MediaType.Film : MediaType.TvShow;
    this.onAssignToAll(group, result.id, result.mediaType, t, kind);
  }

  /** Derive the authoritative MediaType for a group from its episodes.
   *  Uses multiple signals in priority order — ignores stored candidate.kind which may be
   *  stale (pre-fix scans stored all candidates as Film even for TV shows).
   *
   *  Priority:
   *   1. Any episode has parsedSeason or parsedEpisode → always a TV show (infallible)
   *   2. Majority vote on episodes[].mediaType when set
   *   3. Default TvShow (grouped endpoint only groups TV episodes under named headers)
   */
  private getGroupMediaType(group: ScanDecisionShowGroup): MediaType {
    // Priority 1: presence of season/episode numbers — infallible TV indicator
    const hasEpisodeData = group.episodes.some(
      (e) => e.parsedSeason !== null || e.parsedEpisode !== null,
    );
    if (hasEpisodeData) return MediaType.TvShow;
    // Priority 2: majority vote on parsedMediaType (reliable when not null)
    const types = group.episodes.map((e) => e.kind).filter((t): t is MediaType => t !== null);
    if (types.length > 0) {
      const tvCount = types.filter((t) => t === MediaType.TvShow).length;
      return tvCount >= types.length / 2 ? MediaType.TvShow : MediaType.Film;
    }
    // Priority 3: the grouped endpoint names TV show groups by show name
    return MediaType.TvShow;
  }

  getDecisionTypeSeverity(type: ScanDecisionType): TagSeverity {
    const map: Partial<Record<ScanDecisionType, TagSeverity>> = {
      [ScanDecisionType.Added]: 'success',
      [ScanDecisionType.Updated]: 'info',
      [ScanDecisionType.Unchanged]: 'secondary',
      [ScanDecisionType.Removed]: 'danger',
      [ScanDecisionType.Excluded]: 'warn',
      [ScanDecisionType.NeedsReview]: 'warn',
    };
    return map[type];
  }

  getGroupAssignedSeverity(group: ScanDecisionShowGroup): TagSeverity {
    return group.assignedTmdbId ? 'success' : 'warn';
  }

  getPosterUrl(path: string | null | undefined): string | null {
    return path ? `${TMDB_IMAGE_BASE}${path}` : null;
  }

  trackByDecisionId(_: number, item: ScanItemDecision): string {
    return item.id;
  }
  trackByShowName(_: number, group: ScanDecisionShowGroup): string {
    return group.showName;
  }
  toggleRow(id: string, expanded: boolean): void {
    this.expandedRows = expanded ? {} : { [id]: true };
  }
}
