import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { KodiImportItemsTableComponent } from './kodi-import-items-table.component';
import { AdminKodiImportService } from './admin-kodi-import.service';
import { ImportItemStatus, KodiItemKind, MediaType } from '@shared/models/enums';
import { makeImportItemOutcome } from './kodi-import-test-factory';
import { vi } from 'vitest';

describe('KodiImportItemsTableComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiImportItemsTableComponent>>;
  let component: KodiImportItemsTableComponent;
  let service: AdminKodiImportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiImportItemsTableComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiImportItemsTableComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(AdminKodiImportService);
    fixture.componentRef.setInput('runId', 'run-1');
    fixture.detectChanges();
  });

  it('should load items on init', () => {
    const spy = vi.spyOn(service, 'getItems');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledWith('run-1', undefined, undefined, 1, 50);
  });

  it('should request items with outcome filter and reset to page 1', () => {
    const spy = vi.spyOn(service, 'getItems');
    component.onOutcomeChange(ImportItemStatus.Conflict);
    expect(spy).toHaveBeenCalledWith('run-1', ImportItemStatus.Conflict, undefined, 1, 50);
  });

  it('should request items with kind filter and reset to page 1', () => {
    const spy = vi.spyOn(service, 'getItems');
    component.onKindChange(KodiItemKind.Episode);
    expect(spy).toHaveBeenCalledWith('run-1', undefined, KodiItemKind.Episode, 1, 50);
  });

  it('should compute page and pageSize from lazy load event', () => {
    const spy = vi.spyOn(service, 'getItems');
    component.onLazyLoad({ first: 50, rows: 25 });
    expect(spy).toHaveBeenCalledWith('run-1', undefined, undefined, 3, 25);
  });

  it('should render item with link to media detail when mediaId is present', () => {
    service.items.set([
      makeImportItemOutcome({ id: 'i1', title: 'Linked Movie', mediaId: 'media-1' }),
    ]);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toContain('/media/media-1');
    expect(link.textContent).toContain('Linked Movie');
  });

  it('should render reason for non-success rows', () => {
    service.items.set([
      makeImportItemOutcome({
        id: 'i1',
        outcome: ImportItemStatus.Conflict,
        reason: 'duplicate title',
      }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('duplicate title');
  });

  it('should show filtered empty state when filters are active', () => {
    component.onOutcomeChange(ImportItemStatus.NeedsReview);
    service.items.set([]);
    service.itemsMeta.set({ page: 1, pageSize: 50, total: 0 });
    service.itemsLoading.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.items.emptyFiltered');
  });
});
