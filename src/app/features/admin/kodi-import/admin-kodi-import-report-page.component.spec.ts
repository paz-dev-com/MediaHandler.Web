import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { AdminKodiImportReportPageComponent } from './admin-kodi-import-report-page.component';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';
import { environment } from '@env/environment';
import { makeImportCounts, makeImportRunDetail } from './kodi-import-test-factory';
import { vi } from 'vitest';

const base = environment.apiBaseUrl;

describe('AdminKodiImportReportPageComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AdminKodiImportReportPageComponent>>;
  let component: AdminKodiImportReportPageComponent;
  let service: AdminKodiImportService;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminKodiImportReportPageComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { params: of({ runId: 'run-1' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminKodiImportReportPageComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminKodiImportService);
    httpTesting = TestBed.inject(HttpTestingController);
    vi.spyOn(service, 'getItems').mockImplementation(() => {});
    fixture.detectChanges();

    // Flush the initial run-detail request with a completed run so polling is not started.
    httpTesting.expectOne(`${base}/admin/kodi-import/run-1`).flush({
      data: makeImportRunDetail({ status: ImportRunStatus.Completed }),
      meta: null,
      errors: [],
    });
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load run detail for the route param and set runId signal', () => {
    expect(component.runId()).toBe('run-1');
    expect(service.report()?.id).toBe('run-1');
  });

  it('should start report polling only for active runs', () => {
    const pollingSpy = vi.spyOn(service, 'beginReportPolling');
    const activeRun = makeImportRunDetail({ id: 'run-active', status: ImportRunStatus.Running });

    component.loadReport('run-active');
    httpTesting
      .expectOne(`${base}/admin/kodi-import/run-active`)
      .flush({ data: activeRun, meta: null, errors: [] });

    expect(pollingSpy).toHaveBeenCalledWith('run-active');
  });

  it('should not start report polling for terminal runs', () => {
    const pollingSpy = vi.spyOn(service, 'beginReportPolling');
    const terminalRun = makeImportRunDetail({ id: 'run-done', status: ImportRunStatus.Completed });

    component.loadReport('run-done');
    httpTesting
      .expectOne(`${base}/admin/kodi-import/run-done`)
      .flush({ data: terminalRun, meta: null, errors: [] });

    expect(pollingSpy).not.toHaveBeenCalled();
  });

  it('should use the current runId signal when retrying', () => {
    const loadSpy = vi.spyOn(component, 'loadReport').mockImplementation(() => {});
    component.runId.set('run-retry');
    component.onRetry();

    expect(loadSpy).toHaveBeenCalledWith('run-retry');
  });

  it('should render all 15 counter labels and values', () => {
    service.report.set(
      makeImportRunDetail({
        counts: makeImportCounts({
          totalItems: 10,
          moviesCreated: 1,
          showsCreated: 2,
          episodesCreated: 3,
          itemsReused: 4,
          itemsUnchanged: 5,
          filesLinked: 6,
          unmatchedPaths: 7,
          noScannedFiles: 8,
          unsupportedLocations: 9,
          conflicts: 10,
          noLongerInKodi: 11,
          needsReview: 12,
          identityLookupFailures: 13,
          skippedMusicVideos: 14,
        }),
      }),
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    component.counterKeys.forEach((key) => {
      expect(text).toContain(`admin.kodiImport.counts.${key}`);
    });
    expect(text).toContain('10');
    expect(text).toContain('14');
  });

  it('should render preview banner and identity lookup hint for preview runs', () => {
    service.report.set(makeImportRunDetail({ mode: KodiImportMode.Preview }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.previewBanner');
    expect(fixture.nativeElement.textContent).toContain(
      'admin.kodiImport.report.requiresIdentityLookupHint',
    );
  });

  it('should list unmatched prefixes with create mapping action', () => {
    service.report.set(makeImportRunDetail({ unmatchedPrefixes: ['smb://Kodi/Movies/'] }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('smb://Kodi/Movies/');
    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.createMapping');
  });

  it('should open mapping dialog pre-filled from unmatched prefix', () => {
    const dialogSpy = vi.spyOn(component.mappingDialog, 'openWithPrefix');
    service.report.set(makeImportRunDetail({ unmatchedPrefixes: ['smb://Kodi/Movies/'] }));
    fixture.detectChanges();

    component.onCreateMapping('smb://Kodi/Movies/');
    expect(dialogSpy).toHaveBeenCalledWith('smb://Kodi/Movies/');
  });

  it('should render not-found state', () => {
    service.reportNotFound.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.notFound');
  });

  it('should render load error with retry', () => {
    service.reportError.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.loadError');
    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.retry');
  });

  it('should show needs-review hint with link to review queue', () => {
    service.report.set(
      makeImportRunDetail({
        counts: makeImportCounts({ needsReview: 3 }),
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.needsReviewHint');
    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.report.needsReviewLink');
  });
});
