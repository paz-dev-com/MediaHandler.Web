import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminKodiPathMappingService } from './admin-kodi-path-mapping.service';
import { environment } from '@env/environment';
import { makePathMapping } from './kodi-import-test-factory';

describe('AdminKodiPathMappingService', () => {
  let service: AdminKodiPathMappingService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminKodiPathMappingService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminKodiPathMappingService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── loadMappings ─────────────────────────────────────────────────────────────

  it('should GET admin/kodi-import/path-mappings and set mappings signal', () => {
    const mappings = [makePathMapping()];
    service.loadMappings();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mappings, meta: null, errors: [] });

    expect(service.mappings()).toEqual(mappings);
    expect(service.loading()).toBe(false);
  });

  // ── create ───────────────────────────────────────────────────────────────────

  it('should POST a new mapping and refresh the list', () => {
    service.loadMappings();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [], meta: null, errors: [] });

    service.create('smb://Kodi/', '/nas/').subscribe();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ kodiPrefix: 'smb://Kodi/', nasPrefix: '/nas/' });
    req.flush({ data: makePathMapping(), meta: null, errors: [] });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [makePathMapping()], meta: null, errors: [] });
  });

  it('should include optional sortOrder in POST body', () => {
    service.create('smb://Kodi/', '/nas/', 5).subscribe();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    expect(req.request.body).toEqual({
      kodiPrefix: 'smb://Kodi/',
      nasPrefix: '/nas/',
      sortOrder: 5,
    });
    req.flush({ data: makePathMapping(), meta: null, errors: [] });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [makePathMapping()], meta: null, errors: [] });
  });

  it('should set DUPLICATE_MAPPING saveErrorCode on 422', () => {
    service.create('smb://Kodi/', '/nas/').subscribe({ error: () => undefined });

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings`);
    req.flush(
      { data: null, meta: null, errors: [{ code: 'DUPLICATE_MAPPING', message: 'duplicate' }] },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(service.saveErrorCode()).toBe('DUPLICATE_MAPPING');
    expect(service.saving()).toBe(false);
  });

  // ── update ───────────────────────────────────────────────────────────────────

  it('should PUT mapping updates', () => {
    service.loadMappings();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [], meta: null, errors: [] });

    service.update('mapping-1', 'smb://Kodi2/', '/nas2/', 2).subscribe();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings/mapping-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      kodiPrefix: 'smb://Kodi2/',
      nasPrefix: '/nas2/',
      sortOrder: 2,
    });
    req.flush({ data: makePathMapping(), meta: null, errors: [] });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [makePathMapping()], meta: null, errors: [] });
  });

  // ── remove ───────────────────────────────────────────────────────────────────

  it('should DELETE a mapping and refresh the list', () => {
    service.loadMappings();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [makePathMapping()], meta: null, errors: [] });

    service.remove('mapping-1').subscribe();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/path-mappings/mapping-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: {}, meta: null, errors: [] });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/path-mappings`)
      .flush({ data: [], meta: null, errors: [] });
  });
});
