import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import { Media } from '@shared/models/media.model';

interface MediaSearchOption {
  id: string;
  title: string;
  type: string;
}

@Component({
  selector: 'app-batch-assign-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ListboxModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './batch-assign-dialog.component.html',
  styleUrl: './batch-assign-dialog.component.scss',
})
export class BatchAssignDialogComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = input<boolean>(false);
  readonly selectedCount = input<number>(0);

  readonly confirmed = output<string>();
  readonly dismissed = output<void>();

  readonly searchQuery = signal('');
  readonly searchResults = signal<MediaSearchOption[]>([]);
  readonly selectedMedia = signal<MediaSearchOption | null>(null);
  readonly isSearching = signal(false);

  private readonly searchSubject$ = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        if (!query.trim()) {
          this.searchResults.set([]);
          return;
        }
        this.isSearching.set(true);
        this.api
          .get<Media[]>('media', { title: query, pageSize: 10 })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (response) => {
              this.searchResults.set(
                (response.data ?? []).map((m) => ({ id: m.id, title: m.title, type: m.type })),
              );
              this.isSearching.set(false);
            },
            error: () => {
              this.isSearching.set(false);
            },
          });
      });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.selectedMedia.set(null);
    this.searchSubject$.next(value);
  }

  onConfirm(): void {
    const selected = this.selectedMedia();
    if (selected) {
      this.confirmed.emit(selected.id);
    }
  }

  onDismiss(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.selectedMedia.set(null);
    this.dismissed.emit();
  }
}
