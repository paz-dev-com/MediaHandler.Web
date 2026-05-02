import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminReviewService } from './admin-review.service';
import {
  MediaType,
  ReviewReason,
  ReviewResolutionAction,
  ReviewStatus,
} from '@shared/models/enums';
import { environment } from '@env/environment';

describe('AdminReviewService', () => {
  let service: AdminReviewService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  const mockItem = {
    id: 'item-1',
    filePath: '/nas/movies/Inception (2010).mkv',
    reason: ReviewReason.MultipleCandidates,
    status: ReviewStatus.Open,
    parsedTitle: 'Inception',
    parsedYear: 2010,
    parsedSeason: null,
    parsedEpisode: null,
    candidates: [],
    resolvedTmdbId: null,
    resolvedKind: null,
    resolvedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const emptyResponse = {
    data: [],
    meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    errors: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminReviewService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminReviewService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── getItems ────────────────────────────────────────────────────────────────

  it('should GET admin/review-items with default page and pageSize', () => {
    service.getItems();

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/review-items` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include status param when provided', () => {
    service.getItems(ReviewStatus.Open);

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/review-items` && r.params.get('status') === ReviewStatus.Open,
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include reason param when provided', () => {
    service.getItems(undefined, ReviewReason.NoTmdbResult);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/review-items` &&
        r.params.get('reason') === ReviewReason.NoTmdbResult,
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include scanRunId param when provided', () => {
    service.getItems(undefined, undefined, 'scan-abc');

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/review-items` && r.params.get('scanRunId') === 'scan-abc',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include status, reason and scanRunId params when all provided', () => {
    service.getItems(ReviewStatus.Dismissed, ReviewReason.YearMismatch, 'scan-xyz', 2, 10);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/review-items` &&
        r.params.get('status') === ReviewStatus.Dismissed &&
        r.params.get('reason') === ReviewReason.YearMismatch &&
        r.params.get('scanRunId') === 'scan-xyz' &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should update items signal and meta signal after getItems resolves', () => {
    const mockMeta = { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 };

    service.getItems();

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`);
    req.flush({ data: [mockItem], meta: mockMeta, errors: [] });

    expect(service.items()).toEqual([mockItem]);
    expect(service.meta()).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(service.loading()).toBe(false);
  });

  it('should set loading=true while request is in-flight then false after', () => {
    service.getItems();
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`);
    req.flush(emptyResponse);
    expect(service.loading()).toBe(false);
  });

  // ── resolveItem ─────────────────────────────────────────────────────────────

  it('should POST admin/review-items/{id}/resolve with Assign action, tmdbId and kind', () => {
    service.getItems();
    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);

    service.resolveItem('item-1', ReviewResolutionAction.Assign, 12345, MediaType.Film);

    const req = httpTesting.expectOne(`${base}/admin/review-items/item-1/resolve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      action: 'Assign',
      tmdbId: 12345,
      kind: 'Film',
    });
    req.flush({ data: mockItem, meta: null, errors: [] });

    // refresh call
    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);
  });

  it('should POST with Dismiss action body', () => {
    service.getItems();
    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);

    service.resolveItem('item-2', ReviewResolutionAction.Dismiss);

    const req = httpTesting.expectOne(`${base}/admin/review-items/item-2/resolve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'Dismiss' });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);
  });

  it('should POST with Delete action body', () => {
    service.getItems();
    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);

    service.resolveItem('item-3', ReviewResolutionAction.Delete);

    const req = httpTesting.expectOne(`${base}/admin/review-items/item-3/resolve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'Delete' });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);
  });

  it('should POST with Reopen action body', () => {
    service.getItems();
    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);

    service.resolveItem('item-4', ReviewResolutionAction.Reopen);

    const req = httpTesting.expectOne(`${base}/admin/review-items/item-4/resolve`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ action: 'Reopen' });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting.expectOne((r) => r.url === `${base}/admin/review-items`).flush(emptyResponse);
  });

  it('should refresh items signal after resolveItem completes', () => {
    const mockItems = [mockItem];
    service.getItems(ReviewStatus.Open, undefined, undefined, 1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/review-items`)
      .flush({
        data: mockItems,
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        errors: [],
      });

    expect(service.items()).toEqual(mockItems);

    service.resolveItem('item-1', ReviewResolutionAction.Dismiss);
    httpTesting
      .expectOne(`${base}/admin/review-items/item-1/resolve`)
      .flush({ data: null, meta: null, errors: [] });

    // After resolve, refresh is called — verify same params are used
    const refreshReq = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/review-items` &&
        r.params.get('status') === ReviewStatus.Open &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '20',
    );
    refreshReq.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      errors: [],
    });

    expect(service.items()).toEqual([]);
  });
});
