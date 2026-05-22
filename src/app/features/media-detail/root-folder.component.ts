import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ClipboardService } from '@core/services/clipboard.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-root-folder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, ButtonModule, TooltipModule, FormsModule],
  templateUrl: './root-folder.component.html',
  styleUrl: './root-folder.component.scss',
})
export class RootFolderComponent {
  /** Effective root folder path (from media.rootFolder). Null when unknown. */
  readonly rootFolder = input<string | null>(null);
  /** Whether the current user is an admin (controls edit controls visibility). */
  readonly isAdmin = input<boolean>(false);

  /** Emitted when admin saves a new root folder value (null to clear override). */
  readonly rootFolderSaved = output<string | null>();

  private readonly clipboard = inject(ClipboardService);

  readonly editing = signal(false);
  readonly editValue = signal('');
  readonly showFallback = signal(false);

  async copyPath(): Promise<void> {
    const path = this.rootFolder();
    if (!path) return;
    const success = await this.clipboard.copy(path);
    if (!success) {
      this.showFallback.set(true);
    }
  }

  clearFallback(): void {
    this.showFallback.set(false);
  }

  startEdit(): void {
    this.editValue.set(this.rootFolder() ?? '');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  saveEdit(): void {
    const trimmed = this.editValue().trim();
    this.rootFolderSaved.emit(trimmed.length > 0 ? trimmed : null);
    this.editing.set(false);
  }
}
