import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { KodiImportMode } from '@shared/models/enums';

interface ModeOption {
  label: string;
  value: KodiImportMode;
}

@Component({
  selector: 'app-kodi-import-launcher',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    ButtonModule,
    FileUploadModule,
    MessageModule,
    SelectModule,
  ],
  templateUrl: './kodi-import-launcher.component.html',
  styleUrl: './kodi-import-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KodiImportLauncherComponent implements OnInit {
  private readonly importService = inject(AdminKodiImportService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly uploading = this.importService.uploading;
  readonly isRunActive = this.importService.isRunActive;
  readonly uploadErrorCode = this.importService.uploadErrorCode;
  readonly uploadErrorMessage = this.importService.uploadErrorMessage;

  readonly selectedFile = signal<File | null>(null);
  readonly selectedMode = signal<KodiImportMode>(KodiImportMode.Import);
  readonly invalidName = computed(() => {
    const file = this.selectedFile();
    return !!file && !/^MyVideos\d+\.db$/i.test(file.name);
  });
  readonly canLaunch = computed(
    () => !!this.selectedFile() && !this.uploading() && !this.isRunActive(),
  );

  private readonly errorCodeMap: Record<string, string> = {
    INVALID_FILE_NAME: 'invalidFileName',
    UNSUPPORTED_VERSION: 'unsupportedVersion',
    UPLOAD_TOO_LARGE: 'uploadTooLarge',
    INVALID_KODI_DB: 'invalidKodiDb',
    VALIDATION_ERROR: 'validation',
    IMPORT_IN_PROGRESS: 'importInProgress',
    UNKNOWN: 'unknown',
  };

  modeOptions: ModeOption[] = [];
  readonly KodiImportMode = KodiImportMode;

  ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.buildModeOptions();
        this.cdr.markForCheck();
      });
  }

  onFileSelect(event: { files: File[] }): void {
    const file = event.files[0] ?? null;
    this.selectedFile.set(file);
    this.importService.clearUploadError();
  }

  onFileClear(): void {
    this.selectedFile.set(null);
    this.importService.clearUploadError();
  }

  onModeChange(mode: KodiImportMode): void {
    this.selectedMode.set(mode);
  }

  onLaunch(): void {
    const file = this.selectedFile();
    if (!file || this.uploading() || this.isRunActive()) return;
    this.importService.uploadDatabase(file, this.selectedMode());
  }

  onViewActiveRun(): void {
    this.importService.getActiveRun();
    document.getElementById('active-run')?.scrollIntoView({ behavior: 'smooth' });
  }

  uploadErrorKey(code: string): string {
    return this.errorCodeMap[code] ?? this.errorCodeMap['UNKNOWN'];
  }

  errorParams(): { detail: string } {
    return { detail: this.uploadErrorMessage() ?? '' };
  }

  private buildModeOptions(): void {
    this.modeOptions = [
      {
        label: this.transloco.translate('admin.kodiImport.modes.Import'),
        value: KodiImportMode.Import,
      },
      {
        label: this.transloco.translate('admin.kodiImport.modes.Preview'),
        value: KodiImportMode.Preview,
      },
    ];
  }
}
