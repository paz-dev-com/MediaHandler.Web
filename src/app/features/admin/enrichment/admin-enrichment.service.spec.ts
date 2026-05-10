import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminEnrichmentService } from './admin-enrichment.service';
import { EnrichmentRun, EnrichmentSummaryDetail } from '@shared/models/enrichment.model';
import { EnrichmentStatus } from '@shared/models/enums';
import { environment } from '@env/environment';

const BASE_URL = environment.apiBaseUrl;

const mockRunning: EnrichmentRun = {
  enrichmentRunId: 'run-1',
  status: EnrichmentStatus.Running,
  startedAt: '2024-01-01T00:00:00Z',
  finishedAt: null,
  totalItems: 20,
  enrichedCount: 0,
  failedCount: 0,
  skippedCount: 0,
  currentItem: null,
  errorDetails: [],
};

const mockCompleted: EnrichmentRun = {
  enrichmentRunId: 'run-1',
  status: EnrichmentStatus.Completed,
  startedAt: '2024-01-01T00:00:00Z',
  finishedAt: '2024-01-01T00:01:00Z',
  totalItems: 20,
  enrichedCount: 10,
  failedCount: 2,
  skippedCount: 1,
  currentItem: null,
  errorDetails: [],
};

const mockSummary: EnrichmentSummaryDetail = {
  newCount: 5,
  changedCount: 3,
  skippedCount: 1,
  totalEligible: 9,
};

describe('AdminEnrichmentService', () => {
  let service: AdminEnrichmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AdminEnrichmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startEnrichment()', () => {
    it('should POST to enrichment/start and update enrichmentStatus signal', () => {
      expect(service.loading()).toBe(false);
      expect(service.enrichmentStatus()).toBeNull();

      service.startEnrichment();

      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/start`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: mockRunning, meta: null });

      expect(service.loading()).toBe(false);
      expect(service.enrichmentStatus()).toEqual(mockRunning);
    });

    it('should set loading to false on error', () => {
      service.startEnrichment();

      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/start`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.loading()).toBe(false);
      expect(service.enrichmentStatus()).toBeNull();
    });
  });

  describe('getStatus()', () => {
    it('should GET enrichment/status and return the response', () => {
      let result: EnrichmentRun | undefined;
      service.getStatus().subscribe((run) => (result = run));

      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRunning, meta: null });

      expect(result).toEqual(mockRunning);
    });

    it('should update enrichmentStatus signal on getStatus()', () => {
      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/status`);
      req.flush({ data: mockRunning, meta: null });

      expect(service.enrichmentStatus()).toEqual(mockRunning);
    });
  });

  describe('getSummary()', () => {
    it('should GET enrichment/summary and update summary signal', () => {
      expect(service.summary()).toBeNull();

      service.getSummary();

      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/summary`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockSummary, meta: null });

      expect(service.summary()).toEqual(mockSummary);
      expect(service.summary()?.newCount).toBe(5);
      expect(service.summary()?.changedCount).toBe(3);
      expect(service.summary()?.totalEligible).toBe(9);
    });
  });

  describe('getHistory()', () => {
    it('should GET enrichment/history with pagination params', () => {
      expect(service.enrichmentHistory()).toEqual([]);

      service.getHistory(1, 20);

      const req = httpMock.expectOne(
        (r) => r.url === `${BASE_URL}/admin/enrichment/history` && r.params.get('page') === '1',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageSize')).toBe('20');

      req.flush({
        data: [mockCompleted],
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
      });

      expect(service.enrichmentHistory()).toEqual([mockCompleted]);
      expect(service.historyMeta().total).toBe(1);
      expect(service.historyLoading()).toBe(false);
    });

    it('should set historyLoading to false on error', () => {
      service.getHistory();

      const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/admin/enrichment/history`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.historyLoading()).toBe(false);
    });
  });

  describe('signal state', () => {
    it('should initialize signals with null/false defaults', () => {
      expect(service.enrichmentStatus()).toBeNull();
      expect(service.summary()).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.enrichmentHistory()).toEqual([]);
      expect(service.historyLoading()).toBe(false);
    });

    it('should update enrichmentStatus signal when startEnrichment succeeds', () => {
      service.startEnrichment();
      const req = httpMock.expectOne(`${BASE_URL}/admin/enrichment/start`);
      req.flush({ data: mockCompleted, meta: null });

      expect(service.enrichmentStatus()).toEqual(mockCompleted);
    });

    it('should distinguish running vs completed response shape', () => {
      service.getStatus().subscribe();
      httpMock
        .expectOne(`${BASE_URL}/admin/enrichment/status`)
        .flush({ data: mockRunning, meta: null });
      expect(service.enrichmentStatus()?.status).toBe(EnrichmentStatus.Running);
      expect(service.enrichmentStatus()?.finishedAt).toBeNull();

      service.getStatus().subscribe();
      httpMock
        .expectOne(`${BASE_URL}/admin/enrichment/status`)
        .flush({ data: mockCompleted, meta: null });
      expect(service.enrichmentStatus()?.status).toBe(EnrichmentStatus.Completed);
      expect(service.enrichmentStatus()?.enrichedCount).toBe(10);
    });
  });
});
