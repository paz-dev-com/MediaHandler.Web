import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportItemOutcome } from '@shared/models/kodi-import.model';
import { ImportItemStatus, ImportLinkStatus, KodiItemKind, MediaType } from '@shared/models/enums';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined;

interface FilterOption<T> {
  label: string;
  value: T | null;
}

@Component({
  selector: 'app-kodi-import-items-table',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoModule,
    ButtonModule,
    MessageModule,
    SelectModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './kodi-import-items-table.component.html',
  styleUrl: './kodi-import-items-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiImportItemsTableComponent implements OnInit {
  private readonly importService = inject(AdminKodiImportService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly runId = input.required<string>();

  readonly items = this.importService.items;
  readonly meta = this.importService.itemsMeta;
  readonly loading = this.importService.itemsLoading;
  readonly error = this.importService.itemsError;

  readonly selectedOutcome = signal<ImportItemStatus | null>(null);
  readonly selectedKind = signal<KodiItemKind | null>(null);
  readonly hasFilters = computed(
    () => this.selectedOutcome() !== null || this.selectedKind() !== null,
  );

  outcomeOptions: FilterOption<ImportItemStatus>[] = [];
  kindOptions: FilterOption<KodiItemKind>[] = [];

  readonly ImportItemStatus = ImportItemStatus;

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildFilterOptions();
        this.cdr.markForCheck();
      });

    this.loadData(1, 50);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const pageSize = (event.rows as number) ?? this.meta().pageSize;
    const first = (event.first as number) ?? 0;
    const page = Math.floor(first / pageSize) + 1;
    this.loadData(page, pageSize);
  }

  onOutcomeChange(outcome: ImportItemStatus | null): void {
    this.selectedOutcome.set(outcome);
    this.loadData(1, this.meta().pageSize);
  }

  onKindChange(kind: KodiItemKind | null): void {
    this.selectedKind.set(kind);
    this.loadData(1, this.meta().pageSize);
  }

  onRetry(): void {
    this.loadData(this.meta().page, this.meta().pageSize);
  }

  navigateToReview(): void {
    this.router.navigate(['/admin/review']);
  }

  getOutcomeSeverity(outcome: ImportItemStatus): TagSeverity {
    switch (outcome) {
      case ImportItemStatus.Created:
        return 'success';
      case ImportItemStatus.Reused:
      case ImportItemStatus.RequiresIdentityLookup:
        return 'info';
      case ImportItemStatus.Unchanged:
      case ImportItemStatus.SkippedMusicVideo:
        return 'secondary';
      case ImportItemStatus.NeedsReview:
      case ImportItemStatus.NoLongerInKodi:
        return 'warn';
      case ImportItemStatus.IdentityLookupFailed:
      case ImportItemStatus.Conflict:
        return 'danger';
      default:
        return undefined;
    }
  }

  getLinkOutcomeSeverity(outcome: ImportLinkStatus): TagSeverity {
    switch (outcome) {
      case ImportLinkStatus.Linked:
        return 'success';
      case ImportLinkStatus.AlreadyLinked:
        return 'info';
      case ImportLinkStatus.PartiallyLinked:
      case ImportLinkStatus.UnmatchedPath:
      case ImportLinkStatus.NoScannedFile:
      case ImportLinkStatus.UnsupportedLocation:
        return 'warn';
      case ImportLinkStatus.Conflict:
        return 'danger';
      default:
        return undefined;
    }
  }

  getMediaKindLabel(kind: MediaType | null): string {
    return kind === null ? '—' : `admin.kodiImport.mediaKinds.${kind}`;
  }

  private loadData(page: number, pageSize: number): void {
    const runId = this.runId();
    if (!runId) return;
    this.importService.getItems(
      runId,
      this.selectedOutcome() ?? undefined,
      this.selectedKind() ?? undefined,
      page,
      pageSize,
    );
  }

  private buildFilterOptions(): void {
    this.outcomeOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...Object.values(ImportItemStatus).map((value) => ({
        label: this.transloco.translate(`admin.kodiImport.outcomes.${value}`),
        value,
      })),
    ];
    this.kindOptions = [
      { label: this.transloco.translate('common.all'), value: null },
      ...Object.values(KodiItemKind).map((value) => ({
        label: this.transloco.translate(`admin.kodiImport.itemKinds.${value}`),
        value,
      })),
    ];
  }
}
