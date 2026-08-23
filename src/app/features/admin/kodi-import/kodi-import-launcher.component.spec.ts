import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { KodiImportLauncherComponent } from './kodi-import-launcher.component';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { KodiImportMode } from '@shared/models/enums';
import { vi } from 'vitest';

const enTranslations = {
  admin: {
    kodiImport: {
      launcher: {
        title: 'Upload Kodi Database',
        invalidNameWarning: 'File name does not look like a Kodi database.',
      },
      errors: {
        invalidFileName: 'Invalid file name.',
        unsupportedVersion: 'Unsupported version: {{detail}}',
        uploadTooLarge: 'Upload too large: {{detail}}',
        invalidKodiDb: 'Invalid Kodi database.',
        validation: 'Validation failed: {{detail}}',
        importInProgress: 'An import is already in progress.',
        viewActiveRun: 'View active run',
        unknown: 'Import failed: {{detail}}',
      },
    },
  },
};

describe('KodiImportLauncherComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiImportLauncherComponent>>;
  let component: KodiImportLauncherComponent;
  let service: AdminKodiImportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiImportLauncherComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: enTranslations, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiImportLauncherComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminKodiImportService);
    fixture.detectChanges();
  });

  it('should disable launch button without a file', () => {
    component.selectedFile.set(null);
    fixture.detectChanges();

    expect(component.canLaunch()).toBe(false);
  });

  it('should enable launch button after selecting a file', () => {
    component.onFileSelect({ files: [new File([''], 'MyVideos121.db')] });
    fixture.detectChanges();

    expect(component.canLaunch()).toBe(true);
  });

  it('should show invalid name warning for non-Kodi file names', () => {
    component.onFileSelect({ files: [new File([''], 'database.db')] });
    fixture.detectChanges();

    expect(component.invalidName()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      enTranslations.admin.kodiImport.launcher.invalidNameWarning,
    );
  });

  it('should not show invalid name warning for MyVideos*.db', () => {
    component.onFileSelect({ files: [new File([''], 'MyVideos121.db')] });
    fixture.detectChanges();

    expect(component.invalidName()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain(
      enTranslations.admin.kodiImport.launcher.invalidNameWarning,
    );
  });

  it('should call uploadDatabase when launch is clicked', () => {
    const spy = vi.spyOn(service, 'uploadDatabase').mockImplementation(() => undefined);
    const file = new File([''], 'MyVideos121.db');
    component.onFileSelect({ files: [file] });
    component.onModeChange(KodiImportMode.Preview);
    fixture.detectChanges();

    component.onLaunch();

    expect(spy).toHaveBeenCalledWith(file, KodiImportMode.Preview);
  });

  it('should map server error codes to camelCase translation keys', () => {
    expect(component.uploadErrorKey('INVALID_FILE_NAME')).toBe('invalidFileName');
    expect(component.uploadErrorKey('UNSUPPORTED_VERSION')).toBe('unsupportedVersion');
    expect(component.uploadErrorKey('IMPORT_IN_PROGRESS')).toBe('importInProgress');
    expect(component.uploadErrorKey('UNKNOWN')).toBe('unknown');
    expect(component.uploadErrorKey('UNEXPECTED_CODE')).toBe('unknown');
  });

  it('should render specific translated inline message for each upload error code', () => {
    const codes = [
      'INVALID_FILE_NAME',
      'UNSUPPORTED_VERSION',
      'UPLOAD_TOO_LARGE',
      'INVALID_KODI_DB',
      'VALIDATION_ERROR',
      'UNKNOWN',
    ];

    codes.forEach((code) => {
      service.uploadErrorCode.set(code);
      service.uploadErrorMessage.set('detail');
      fixture.detectChanges();

      const key = component.uploadErrorKey(code);
      const expected = enTranslations.admin.kodiImport.errors[
        key as keyof typeof enTranslations.admin.kodiImport.errors
      ].replace('{{detail}}', 'detail');
      expect(fixture.nativeElement.textContent).toContain(expected);
      service.clearUploadError();
    });
  });

  it('should render view-active-run action for IMPORT_IN_PROGRESS error', () => {
    service.uploadErrorCode.set('IMPORT_IN_PROGRESS');
    service.uploadErrorMessage.set('already running');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      enTranslations.admin.kodiImport.errors.importInProgress,
    );
    expect(fixture.nativeElement.textContent).toContain(
      enTranslations.admin.kodiImport.errors.viewActiveRun,
    );
  });

  it('should disable launch while uploading', () => {
    service.uploading.set(true);
    component.onFileSelect({ files: [new File([''], 'MyVideos121.db')] });
    fixture.detectChanges();

    expect(component.canLaunch()).toBe(false);
  });
});
