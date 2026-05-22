import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ClipboardService } from '@core/services/clipboard.service';
import { inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { MediaFile, SeasonCompleteness } from '@shared/models/media.model';
import { FileSizePipe } from '@shared/pipes/file-size.pipe';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

/** Regex to extract season number from episode filename (e.g. S01E02 or s1e2) */
const SEASON_RE = /[Ss](\d{1,2})[Ee]\d/;

@Component({
  selector: 'app-season-completeness',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, TagModule, ButtonModule, TooltipModule, FileSizePipe],
  templateUrl: './season-completeness.component.html',
  styleUrl: './season-completeness.component.scss',
})
export class SeasonCompletenessComponent {
  /** Completeness data for all seasons. Empty array when data not yet loaded. */
  readonly completeness = input<SeasonCompleteness[]>([]);
  /** Whether the completeness data is still loading. */
  readonly loading = input<boolean>(false);
  /** All linked files for this TV show. */
  readonly files = input<MediaFile[]>([]);
  /** Whether the current user is admin — controls Link/Unlink buttons. */
  readonly isAdmin = input<boolean>(false);

  readonly linkFileRequested = output<void>();
  readonly unlinkFileRequested = output<string>();

  private readonly clipboard = inject(ClipboardService);

  /** Map from season number → files that match that season. */
  readonly filesBySeason = computed<Map<number, MediaFile[]>>(() => {
    const map = new Map<number, MediaFile[]>();
    for (const file of this.files()) {
      const match = SEASON_RE.exec(file.filePath);
      const seasonNum = match ? parseInt(match[1], 10) : 0;
      const list = map.get(seasonNum) ?? [];
      list.push(file);
      map.set(seasonNum, list);
    }
    return map;
  });

  /** Set of season numbers that are expanded. */
  private readonly expandedSet = signal<Set<number>>(new Set());

  isExpanded(seasonNumber: number): boolean {
    return this.expandedSet().has(seasonNumber);
  }

  toggleSeason(seasonNumber: number): void {
    this.expandedSet.update((s) => {
      const next = new Set(s);
      if (next.has(seasonNumber)) {
        next.delete(seasonNumber);
      } else {
        next.add(seasonNumber);
      }
      return next;
    });
  }

  readonly fallbackPaths = signal<Record<string, boolean>>({});
  readonly fallbackFolders = signal<Record<string, boolean>>({});

  async copyPath(path: string): Promise<void> {
    const success = await this.clipboard.copy(path);
    if (!success) this.fallbackPaths.update((m) => ({ ...m, [path]: true }));
  }

  clearFallback(path: string): void {
    this.fallbackPaths.update((m) => {
      const n = { ...m };
      delete n[path];
      return n;
    });
  }

  getFolderPath(filePath: string): string {
    const i = filePath.lastIndexOf('/');
    return i > 0 ? filePath.substring(0, i) : filePath;
  }

  async copyFolder(filePath: string): Promise<void> {
    const folder = this.getFolderPath(filePath);
    const success = await this.clipboard.copy(folder);
    if (!success) this.fallbackFolders.update((m) => ({ ...m, [filePath]: true }));
  }

  clearFolderFallback(filePath: string): void {
    this.fallbackFolders.update((m) => {
      const n = { ...m };
      delete n[filePath];
      return n;
    });
  }

  onUnlinkClick(fileId: string): void {
    this.unlinkFileRequested.emit(fileId);
  }

  onLinkFileClick(): void {
    this.linkFileRequested.emit();
  }
}
