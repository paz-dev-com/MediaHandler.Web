import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { KodiImportStatusComponent } from './kodi-import-status.component';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';
import { makeImportCounts, makeImportRun } from './kodi-import-test-factory';

describe('KodiImportStatusComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiImportStatusComponent>>;
  let service: AdminKodiImportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiImportStatusComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiImportStatusComponent);
    service = TestBed.inject(AdminKodiImportService);
    fixture.detectChanges();
  });

  it('should render idle state when no active run', () => {
    service.activeRun.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.status.idle');
  });

  it('should render mode and status tags', () => {
    service.activeRun.set(makeImportRun({ status: ImportRunStatus.Running }));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('admin.kodiImport.modes.Import');
    expect(text).toContain('admin.kodiImport.runStatus.Running');
    expect(text).toContain('MyVideos121.db');
    expect(text).toContain('121');
  });

  it('should visually distinguish preview mode', () => {
    service.activeRun.set(makeImportRun({ mode: KodiImportMode.Preview }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.modes.Preview');
  });

  it('should show failure reason for failed runs', () => {
    service.activeRun.set(
      makeImportRun({
        status: ImportRunStatus.Failed,
        failureReason: 'Disk full',
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Disk full');
  });

  it('should render polling error warning', () => {
    service.activeRun.set(makeImportRun({ status: ImportRunStatus.Running }));
    service.pollingError.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.status.pollingError');
  });

  it('should format elapsed time', () => {
    const component = fixture.componentInstance;
    expect(component.formatElapsed(0)).toBe('0:00');
    expect(component.formatElapsed(65)).toBe('1:05');
    expect(component.formatElapsed(3665)).toBe('1:01:05');
  });

  it('should render elapsed time for active runs', () => {
    service.activeRun.set(makeImportRun({ status: ImportRunStatus.Running }));
    service.elapsedSeconds.set(125);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.status.elapsed');
    expect(fixture.nativeElement.textContent).toContain('2:05');
  });
});
