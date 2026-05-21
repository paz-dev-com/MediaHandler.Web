import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { MediaType } from '@shared/models/enums';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CollectionFilters } from './collection.service';

interface FilterOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-collection-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './collection-filters.component.html',
  styleUrl: './collection-filters.component.scss',
})
export class CollectionFiltersComponent implements OnInit {
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = input.required<CollectionFilters>();
  readonly filtersChange = output<Partial<CollectionFilters>>();

  typeOptions: FilterOption[] = [];
  watchedOptions: FilterOption[] = [];

  /** Convert stored boolean | null to its string key for the select */
  get watchedValue(): string | null {
    const v = this.filters().isWatched;
    if (v === null) return null;
    return v ? 'true' : 'false';
  }

  private buildOptions(): void {
    this.typeOptions = [
      { label: this.transloco.translate('collection.film'), value: MediaType.Film },
      { label: this.transloco.translate('collection.tvShow'), value: MediaType.TvShow },
    ];
    this.watchedOptions = [
      { label: this.transloco.translate('collection.watched'), value: 'true' },
      { label: this.transloco.translate('collection.unwatched'), value: 'false' },
    ];
  }

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildOptions();
        this.cdr.markForCheck();
      });
  }

  private searchDebounce: ReturnType<typeof setTimeout> | null = null;

  onSearchChange(value: string): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.filtersChange.emit({ search: value }), 300);
  }

  onTypeChange(value: string | null): void {
    this.filtersChange.emit({ type: (value as MediaType) ?? null });
  }

  onWatchedChange(value: string | null): void {
    const isWatched = value === null ? null : value === 'true';
    this.filtersChange.emit({ isWatched });
  }
}
