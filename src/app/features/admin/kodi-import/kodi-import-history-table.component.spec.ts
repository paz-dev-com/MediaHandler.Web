import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { KodiImportHistoryTableComponent } from './kodi-import-history-table.component';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportRunStatus, KodiImportMode } from '@shared/models/enums';
import { makeImportCounts, makeImportRun } from './kodi-import-test-factory';
import { vi } from 'vitest';

describe('KodiImportHistoryTableComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiImportHistoryTableComponent>>;
  let component: KodiImportHistoryTableComponent;
  let service: AdminKodiImportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiImportHistoryTableComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([{ path: 'admin/kodi-import/:runId', component: class {} }] as Routes),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiImportHistoryTableComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminKodiImportService);
    fixture.detectChanges();
  });

  it('should request history on init', () => {
    const spy = vi.spyOn(service, 'getHistory');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith(1, 20);
  });

  it('should compute page and pageSize from lazy load event', () => {
    const spy = vi.spyOn(service, 'getHistory');
    component.onLazyLoad({ first: 40, rows: 20 });
    expect(spy).toHaveBeenCalledWith(3, 20);
  });

  it('should render headline counters and preview badge', () => {
    service.history.set([
      makeImportRun({
        id: 'run-history',
        mode: KodiImportMode.Preview,
        status: ImportRunStatus.Completed,
        counts: makeImportCounts({
          moviesCreated: 2,
          showsCreated: 1,
          episodesCreated: 3,
          filesLinked: 5,
          conflicts: 1,
          needsReview: 2,
        }),
      }),
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('admin.kodiImport.modes.Preview');
    expect(text).toContain('6'); // created sum
    expect(text).toContain('5'); // files linked
    expect(text).toContain('1'); // conflicts
    expect(text).toContain('2'); // needs review
  });

  it('should navigate to report for terminal runs', () => {
    service.history.set([makeImportRun({ id: 'run-1', status: ImportRunStatus.Completed })]);
    fixture.detectChanges();

    expect(() => component.navigateToReport('run-1')).not.toThrow();
  });

  it('should render empty state', () => {
    component.onLazyLoad({ first: 0, rows: 20 });
    service.history.set([]);
    service.historyMeta.set({ page: 1, pageSize: 20, total: 0 });
    service.historyLoading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.history.empty');
  });
});
