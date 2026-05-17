import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminLibraryRootService } from './admin-library-root.service';
import { LibraryRootKind } from '@shared/models/enums';
import { environment } from '@env/environment';

describe('AdminLibraryRootService', () => {
  let service: AdminLibraryRootService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminLibraryRootService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminLibraryRootService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── getRoots ─────────────────────────────────────────────────────────────────

  it('should GET admin/library-roots with page and pageSize', () => {
    service.getRoots(1, 20);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/library-roots` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      errors: [],
    });
  });

  it('should include kind param when provided', () => {
    service.getRoots(1, 20, LibraryRootKind.Movies);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/library-roots` && r.params.get('kind') === LibraryRootKind.Movies,
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: null, errors: [] });
  });

  it('should include enabledOnly param when provided', () => {
    service.getRoots(1, 20, undefined, true);

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/library-roots` && r.params.get('enabledOnly') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: null, errors: [] });
  });

  it('should update roots signal after getRoots resolves', () => {
    const mockRoots = [
      {
        id: '1',
        path: '/nas/movies',
        kind: LibraryRootKind.Movies,
        label: 'Movies',
        isEnabled: true,
        createdAt: '2024-01-01',
        updatedAt: null,
      },
    ];
    const mockMeta = { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 };

    service.getRoots(1, 20);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/library-roots`);
    req.flush({ data: mockRoots, meta: mockMeta, errors: [] });

    expect(service.roots()).toEqual(mockRoots);
    expect(service.meta()).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(service.loading()).toBe(false);
  });

  it('should set loading=true while getRoots is in-flight', () => {
    service.getRoots(1, 20);
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/library-roots`);
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      errors: [],
    });
    expect(service.loading()).toBe(false);
  });

  // ── addRoot ──────────────────────────────────────────────────────────────────

  it('should POST admin/library-roots with path and kind', () => {
    service.getRoots(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });

    service.addRoot('/nas/movies', LibraryRootKind.Movies);

    const req = httpTesting.expectOne(`${base}/admin/library-roots`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ path: '/nas/movies', kind: LibraryRootKind.Movies });
    req.flush({ data: null, meta: null, errors: [] });

    // refresh call
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });
  });

  it('should include label in POST body when provided', () => {
    service.getRoots(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });

    service.addRoot('/nas/movies', LibraryRootKind.Movies, 'My Movies');

    const req = httpTesting.expectOne(`${base}/admin/library-roots`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      path: '/nas/movies',
      kind: LibraryRootKind.Movies,
      label: 'My Movies',
    });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });
  });

  // ── removeRoot ───────────────────────────────────────────────────────────────

  it('should DELETE admin/library-roots/{id}', () => {
    service.getRoots(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });

    service.removeRoot('root-123');

    const req = httpTesting.expectOne(`${base}/admin/library-roots/root-123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });
  });

  // ── setEnabled ───────────────────────────────────────────────────────────────

  it('should PUT admin/library-roots/{id}/enabled with isEnabled body', () => {
    service.getRoots(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });

    service.setEnabled('root-456', false);

    const req = httpTesting.expectOne(`${base}/admin/library-roots/root-456/enabled`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ isEnabled: false });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/library-roots`)
      .flush({ data: [], meta: null, errors: [] });
  });
});
