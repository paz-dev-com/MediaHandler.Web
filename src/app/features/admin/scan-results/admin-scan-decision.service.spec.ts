import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminScanDecisionService } from './admin-scan-decision.service';
import { MediaType, ScanDecisionType } from '@shared/models/enums';
import { environment } from '@env/environment';

describe('AdminScanDecisionService', () => {
  let service: AdminScanDecisionService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  const mockDecision = {
    id: 'decision-1',
    scanRunId: 'scan-1',
    filePath: '/mnt/nas/movies/movie.mkv',
    decisionType: ScanDecisionType.Added,
    mediaType: MediaType.Film,
    libraryRootId: 'root-1',
    parsedTitle: 'Movie Title',
    parsedYear: 2020,
    parsedSeason: null,
    parsedEpisode: null,
    candidates: [],
    assignedTmdbId: 12345,
    assignedKind: MediaType.Film,
    assignedTitle: 'Movie Title',
    assignedYear: 2020,
    assignedPosterPath: '/poster.jpg',
    decidedAt: '2024-01-01T00:00:00Z',
  };

  const mockTvGroup = {
    groupId: 'group-1',
    scanRunId: 'scan-1',
    parsedShowName: 'Show Name',
    episodeCount: 12,
    assignedTmdbId: null,
    assignedTitle: null,
    assignedPosterPath: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminScanDecisionService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminScanDecisionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── getDecisions ──────────────────────────────────────────────────────────────

  it('should GET decisions for a scan run', () => {
    service.getDecisions('scan-1');

    const req = httpTesting.expectOne(`${base}/admin/scan/scan-1/decisions?page=1&pageSize=20`);
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [mockDecision],
      meta: { page: 1, pageSize: 20, totalCount: 1 },
      errors: [],
    });

    expect(service.decisions()).toEqual([mockDecision]);
    expect(service.loading()).toBe(false);
  });

  it('should GET decisions with filters', () => {
    service.getDecisions('scan-1', ScanDecisionType.Added, MediaType.Film, 'root-1', 2, 10);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/scan/scan-1/decisions` &&
        r.params.get('decisionType') === ScanDecisionType.Added &&
        r.params.get('mediaType') === MediaType.Film &&
        r.params.get('libraryRootId') === 'root-1' &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { page: 2, pageSize: 10, totalCount: 0 }, errors: [] });

    expect(service.decisions()).toEqual([]);
    expect(service.meta().page).toBe(2);
  });

  it('should set loading to true during getDecisions and false on completion', () => {
    service.getDecisions('scan-1');
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne(`${base}/admin/scan/scan-1/decisions?page=1&pageSize=20`);
    req.flush({ data: [mockDecision], meta: null, errors: [] });

    expect(service.loading()).toBe(false);
  });

  it('should set loading to false on getDecisions error', () => {
    service.getDecisions('scan-1');

    const req = httpTesting.expectOne(`${base}/admin/scan/scan-1/decisions?page=1&pageSize=20`);
    req.flush('Error', { status: 404, statusText: 'Not Found' });

    expect(service.loading()).toBe(false);
  });

  it('should update meta from paginated response', () => {
    service.getDecisions('scan-1');

    const req = httpTesting.expectOne(`${base}/admin/scan/scan-1/decisions?page=1&pageSize=20`);
    req.flush({
      data: [mockDecision],
      meta: { page: 1, pageSize: 20, totalCount: 50 },
      errors: [],
    });

    expect(service.meta()).toEqual({ page: 1, pageSize: 20, total: 50 });
  });

  // ── reassign ──────────────────────────────────────────────────────────────────

  it('should PUT reassign with tmdbId and kind', () => {
    let result: unknown;
    service.reassign('decision-1', 99999, MediaType.Film).subscribe((r) => (result = r));

    const req = httpTesting.expectOne(`${base}/admin/scan-decisions/decision-1/reassign`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ tmdbId: 99999, kind: MediaType.Film });
    req.flush({ data: mockDecision, meta: null, errors: [] });

    expect(result).toEqual(mockDecision);
  });

  // ── getTvGroups ───────────────────────────────────────────────────────────────

  it('should GET TV groups for a scan run', () => {
    service.getTvGroups('scan-1');

    const req = httpTesting.expectOne(`${base}/admin/scan-decisions/tv-groups?scanId=scan-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockTvGroup], meta: null, errors: [] });

    expect(service.tvGroups()).toEqual([mockTvGroup]);
  });

  // ── assignTvGroup ─────────────────────────────────────────────────────────────

  it('should PUT assignTvGroup with tmdbId', () => {
    let result: unknown;
    service.assignTvGroup('group-1', 54321).subscribe((r) => (result = r));

    const req = httpTesting.expectOne(`${base}/admin/tv-groups/group-1/assign`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ tmdbId: 54321 });
    req.flush({ data: { ...mockTvGroup, assignedTmdbId: 54321 }, meta: null, errors: [] });

    expect((result as typeof mockTvGroup).assignedTmdbId).toBe(54321);
  });

  // ── renameFile ────────────────────────────────────────────────────────────────

  it('should POST renameFile with preview=false by default', () => {
    service.renameFile('file-1').subscribe();

    const req = httpTesting.expectOne(`${base}/admin/files/file-1/rename?preview=false`);
    expect(req.request.method).toBe('POST');
    req.flush({
      data: {
        fileId: 'file-1',
        previousPath: '/old.mkv',
        newPath: '/new.mkv',
        renamedAt: '2024-01-01',
      },
      meta: null,
      errors: [],
    });
  });

  it('should POST renameFile with preview=true when specified', () => {
    service.renameFile('file-1', true).subscribe();

    const req = httpTesting.expectOne(`${base}/admin/files/file-1/rename?preview=true`);
    expect(req.request.method).toBe('POST');
    req.flush({
      data: { fileId: 'file-1', currentPath: '/old.mkv', proposedPath: '/new.mkv' },
      meta: null,
      errors: [],
    });
  });

  // ── renameTvGroup ─────────────────────────────────────────────────────────────

  it('should POST renameTvGroup with preview=false by default', () => {
    service.renameTvGroup('group-1').subscribe();

    const req = httpTesting.expectOne(`${base}/admin/tv-groups/group-1/rename?preview=false`);
    expect(req.request.method).toBe('POST');
    req.flush({
      data: { groupId: 'group-1', showName: 'Show', results: [], failed: [] },
      meta: null,
      errors: [],
    });
  });

  it('should POST renameTvGroup with preview=true when specified', () => {
    service.renameTvGroup('group-1', true).subscribe();

    const req = httpTesting.expectOne(`${base}/admin/tv-groups/group-1/rename?preview=true`);
    expect(req.request.method).toBe('POST');
    req.flush({
      data: { groupId: 'group-1', showName: 'Show', previews: [] },
      meta: null,
      errors: [],
    });
  });
});
