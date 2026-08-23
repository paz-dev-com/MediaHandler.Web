import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { KodiMappingDialogComponent } from './kodi-mapping-dialog.component';
import { AdminKodiPathMappingService } from './admin-kodi-path-mapping.service';
import { environment } from '@env/environment';
import { makePathMapping } from './kodi-import-test-factory';

describe('KodiMappingDialogComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<KodiMappingDialogComponent>>;
  let component: KodiMappingDialogComponent;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        KodiMappingDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        MessageService,
        AdminKodiPathMappingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KodiMappingDialogComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill kodi prefix via openWithPrefix', () => {
    component.openWithPrefix('smb://Kodi/Movies/');
    expect(component.kodiPrefix()).toBe('smb://Kodi/Movies/');
    expect(component.visible()).toBe(true);
  });

  it('should block submit and show required errors for empty fields', () => {
    component.open();
    component.onSubmit((key: string) => key);
    fixture.detectChanges();

    expect(component.attemptedSubmit()).toBe(true);
    expect(component.kodiPrefixInvalid()).toBe(true);
    expect(component.nasPrefixInvalid()).toBe(true);
    expect(component.visible()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('admin.kodiImport.mappingsDialog.required');
  });

  it('should block submit and show slash error for NAS prefix without /', () => {
    component.open();
    component.kodiPrefix.set('smb://Kodi/');
    component.nasPrefix.set('nas/Movies');
    component.onSubmit((key: string) => key);
    fixture.detectChanges();

    expect(component.nasPrefixSlashInvalid()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'admin.kodiImport.mappingsDialog.nasPrefixMustStartWithSlash',
    );
  });

  it('should POST a valid mapping and close the dialog', () => {
    component.open();
    component.kodiPrefix.set('smb://Kodi/');
    component.nasPrefix.set('/nas/Movies/');
    component.onSubmit((key: string) => key);

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: makePathMapping(), meta: null, errors: [] });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [makePathMapping()], meta: null, errors: [] });

    expect(component.visible()).toBe(false);
  });

  it('should show duplicate mapping error and keep dialog open', () => {
    component.open();
    component.kodiPrefix.set('smb://Kodi/');
    component.nasPrefix.set('/nas/Movies/');
    component.onSubmit((key: string) => key);

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    req.flush(
      { data: null, meta: null, errors: [{ code: 'DUPLICATE_MAPPING', message: 'dup' }] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    fixture.detectChanges();
    expect(component.mappingService.saveErrorCode()).toBe('DUPLICATE_MAPPING');
    expect(component.visible()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'admin.kodiImport.mappingsDialog.duplicate',
    );
  });
});
