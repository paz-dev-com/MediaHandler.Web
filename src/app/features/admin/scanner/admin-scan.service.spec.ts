import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AdminScanService } from './admin-scan.service';
import { ScanMode, ScanStatus } from '@shared/models/enums';
import { environment } from '@env/environment';

describe('AdminScanService', () => {
  let service: AdminScanService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  const mockCounts = {
    totalDiscovered: 10,
    added: 5,
    updated: 2,
    unchanged: 3,
    removed: 0,
    excluded: 0,
    needsReview: 1,
  };

  const mockActiveScan = {
    id: 'scan-1',
    mode: ScanMode.Full,
    status: ScanStatus.Running,
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: null,
    libraryRootIds: ['root-1'],
    counts: mockCounts,
    failureReason: null,
    reviewItems: null,
  };

  const mockCompletedScan = {
    ...mockActiveScan,
    status: ScanStatus.Completed,
    finishedAt: '2024-01-01T01:00:00Z',
  };

  const mockHistorySummary = {
    id: 'scan-1',
    mode: ScanMode.Full,
    status: ScanStatus.Completed,
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-01T01:00:00Z',
    libraryRootIds: ['root-1'],
    counts: mockCounts,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminScanService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminScanService);
    httpTesting = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    httpTesting.verify();
  });

  // ── startScan ────────────────────────────────────────────────────────────────

  it('should POST scan/start with libraryRootIds and mode', () => {
    service.startScan(['root-1', 'root-2'], ScanMode.Full);

    const req = httpTesting.expectOne(`${base}/admin/scan`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      libraryRootIds: ['root-1', 'root-2'],
      mode: ScanMode.Full,
    });
    req.flush({ data: mockCompletedScan, meta: null, errors: [] });
    // no polling for completed scan
  });

  it('should update activeScan signal after startScan resolves', () => {
    service.startScan(['root-1'], ScanMode.Incremental);

    const req = httpTesting.expectOne(`${base}/admin/scan`);
    req.flush({ data: mockActiveScan, meta: null, errors: [] });

    expect(service.activeScan()).toEqual(mockActiveScan);
    expect(service.loading()).toBe(false);
    // clear interval so httpTesting.verify() passes cleanly
    vi.clearAllTimers();
  });

  it('should set loading=true while startScan is in-flight', () => {
    service.startScan(['root-1'], ScanMode.Full);
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne(`${base}/admin/scan`);
    req.flush({ data: mockCompletedScan, meta: null, errors: [] });

    expect(service.loading()).toBe(false);
  });

  it('should reset loading on startScan error', () => {
    service.startScan(['root-1'], ScanMode.Full);
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne(`${base}/admin/scan`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(service.loading()).toBe(false);
  });

  // ── getActiveScan ────────────────────────────────────────────────────────────

  it('should GET scan/active', () => {
    service.getActiveScan();

    const req = httpTesting.expectOne(`${base}/admin/scan/active`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: null, meta: null, errors: [] });
  });

  it('should update activeScan signal to null after getActiveScan resolves with null', () => {
    service.getActiveScan();

    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: null, meta: null, errors: [] });

    expect(service.activeScan()).toBeNull();
  });

  it('should update activeScan signal after getActiveScan resolves with a scan', () => {
    service.getActiveScan();

    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    expect(service.activeScan()).toEqual(mockActiveScan);
    vi.clearAllTimers();
  });

  it('should start polling after getActiveScan returns an active scan', () => {
    service.getActiveScan();

    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.clearAllTimers();
  });

  // ── cancelScan ───────────────────────────────────────────────────────────────

  it('should POST scan/{id}/cancel', () => {
    service.cancelScan('scan-123');

    const req = httpTesting.expectOne(`${base}/admin/scan/scan-123/cancel`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: null, meta: null, errors: [] });

    // getScanHistory refresh triggered after cancel
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/scan`)
      .flush({ data: [], meta: null, errors: [] });
  });

  it('should clear activeScan after cancelScan succeeds', () => {
    service.getActiveScan();
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    // cancelScan stops polling and clears activeScan
    service.cancelScan('scan-1');
    httpTesting
      .expectOne(`${base}/admin/scan/scan-1/cancel`)
      .flush({ data: null, meta: null, errors: [] });

    expect(service.activeScan()).toBeNull();

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/scan`)
      .flush({ data: [], meta: null, errors: [] });

    // polling stopped - advancing time should NOT trigger any more scan/active requests
    vi.advanceTimersByTime(4000);
    httpTesting.expectNone(`${base}/admin/scan/active`);
  });

  // ── getScanHistory ───────────────────────────────────────────────────────────

  it('should GET scan with page and pageSize', () => {
    service.getScanHistory(1, 20);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/scan` &&
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

  it('should update scanHistory and historyMeta signals after getScanHistory resolves', () => {
    const mockMeta = { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 };

    service.getScanHistory(1, 20);

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/scan`)
      .flush({ data: [mockHistorySummary], meta: mockMeta, errors: [] });

    expect(service.scanHistory()).toEqual([mockHistorySummary]);
    expect(service.historyMeta()).toEqual({ page: 1, pageSize: 20, total: 1 });
  });

  it('should GET scan with page=2', () => {
    service.getScanHistory(2, 20);

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/scan` && r.params.get('page') === '2',
    );
    req.flush({ data: [], meta: null, errors: [] });
  });

  // ── getScanDetail ────────────────────────────────────────────────────────────

  it('should GET scan/{id}', () => {
    let result: unknown;
    service.getScanDetail('scan-123').subscribe((v) => (result = v));

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/scan/scan-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockActiveScan, meta: null, errors: [] });

    expect(result).toEqual(mockActiveScan);
  });

  it('should include includeReview=true param when specified', () => {
    service.getScanDetail('scan-123', true).subscribe();

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/scan/scan-123` && r.params.get('includeReview') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockActiveScan, meta: null, errors: [] });
  });

  it('should NOT include includeReview param when not specified', () => {
    service.getScanDetail('scan-123').subscribe();

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/scan/scan-123`);
    expect(req.request.params.has('includeReview')).toBe(false);
    req.flush({ data: mockActiveScan, meta: null, errors: [] });
  });

  // ── polling lifecycle ────────────────────────────────────────────────────────

  it('should start polling after startScan returns active scan', () => {
    service.startScan(['root-1'], ScanMode.Full);

    httpTesting
      .expectOne(`${base}/admin/scan`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.clearAllTimers();
  });

  it('should NOT start polling after startScan returns completed scan', () => {
    service.startScan(['root-1'], ScanMode.Full);

    httpTesting
      .expectOne(`${base}/admin/scan`)
      .flush({ data: mockCompletedScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting.expectNone(`${base}/admin/scan/active`);
  });

  it('should stop polling when terminal state (Completed) is returned', () => {
    service.startScan(['root-1'], ScanMode.Full);
    httpTesting
      .expectOne(`${base}/admin/scan`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockCompletedScan, meta: null, errors: [] });

    // getScanHistory refresh
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/scan`)
      .flush({ data: [], meta: null, errors: [] });

    // polling stopped — no more requests
    vi.advanceTimersByTime(4000);
    httpTesting.expectNone(`${base}/admin/scan/active`);
  });

  it('should stop polling when scan/active returns null', () => {
    service.startScan(['root-1'], ScanMode.Full);
    httpTesting
      .expectOne(`${base}/admin/scan`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: null, meta: null, errors: [] });

    // getScanHistory refresh
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/scan`)
      .flush({ data: [], meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting.expectNone(`${base}/admin/scan/active`);
  });

  it('should refresh scan history after polling stops on terminal state', () => {
    const mockHistory = [mockHistorySummary];
    service.startScan(['root-1'], ScanMode.Full);
    httpTesting
      .expectOne(`${base}/admin/scan`)
      .flush({ data: mockActiveScan, meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/scan/active`)
      .flush({ data: mockCompletedScan, meta: null, errors: [] });

    const historyReq = httpTesting.expectOne((r) => r.url === `${base}/admin/scan`);
    historyReq.flush({
      data: mockHistory,
      meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
      errors: [],
    });

    expect(service.scanHistory()).toEqual(mockHistory);
  });

  // ── signal state ─────────────────────────────────────────────────────────────

  it('should initialise signals with default values', () => {
    expect(service.activeScan()).toBeNull();
    expect(service.scanHistory()).toEqual([]);
    expect(service.historyMeta()).toEqual({ page: 1, pageSize: 20, total: 0 });
    expect(service.loading()).toBe(false);
  });
});
