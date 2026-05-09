import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { TvShowGroup } from '@shared/models/scan-decision.model';
import { MediaType } from '@shared/models/enums';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { TmdbSearchPanelComponent, TmdbSearchResult } from '../shared/tmdb-search-panel.component';
import { RenameDialogComponent } from '../shared/rename-dialog.component';

@Component({
  selector: 'app-tv-show-group-list',
  standalone: true,
  imports: [
    TranslocoModule,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    ButtonModule,
    ChipModule,
    DialogModule,
    MessageModule,
    TagModule,
    TmdbSearchPanelComponent,
    RenameDialogComponent,
  ],
  templateUrl: './tv-show-group-list.component.html',
  styleUrl: './tv-show-group-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TvShowGroupListComponent {
  private readonly scanDecisionService = inject(AdminScanDecisionService);
  private readonly messageService = inject(MessageService);

  @Input() groups: TvShowGroup[] = [];
  @Input() scanId = '';
  @Output() groupAssigned = new EventEmitter<TvShowGroup>();

  readonly dialogVisible = signal(false);
  readonly activeGroup = signal<TvShowGroup | null>(null);

  readonly renameDialogVisible = signal(false);
  readonly selectedGroupForRename = signal<TvShowGroup | null>(null);

  readonly MediaType = MediaType;

  openAssignDialog(group: TvShowGroup): void {
    this.activeGroup.set(group);
    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    this.dialogVisible.set(false);
    this.activeGroup.set(null);
  }

  openBatchRenameDialog(group: TvShowGroup): void {
    this.selectedGroupForRename.set(group);
    this.renameDialogVisible.set(true);
  }

  onGroupRenamed(): void {
    this.scanDecisionService.getTvGroups(this.scanId);
  }

  onTmdbSelected(result: TmdbSearchResult): void {
    const group = this.activeGroup();
    if (!group) return;

    this.scanDecisionService.assignTvGroup(group.groupId, result.tmdbId).subscribe({
      next: (updated) => {
        this.messageService.add({
          severity: 'success',
          summary: 'TMDB Assigned',
          detail: `Assigned "${result.title}" to "${group.parsedShowName}"`,
        });
        this.closeDialog();
        this.groupAssigned.emit(updated);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Assignment Failed',
          detail: 'Could not assign TMDB ID to TV show group.',
        });
      },
    });
  }
}
