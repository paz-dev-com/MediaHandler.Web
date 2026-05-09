import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminEnrichmentService } from './admin-enrichment.service';
import { EnrichmentRun, EnrichmentSummary } from '@shared/models/enrichment.model';
import { EnrichmentStatus } from '@shared/models/enums';
import { environment } from '@env/environment';

const BASE_URL = environment.apiBaseUrl;

const mockRunning: EnrichmentRun = {
  id: 'run-1',
  status: EnrichmentStatus.Running,
  startedAt: '2024-01-01T00:00:00Z',
  finishedAt: null,
  enriched: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

const mockCompleted: EnrichmentRun = {
  id: 'run-1',
  status: EnrichmentStatus.Completed,
  startedAt: '2024-01-01T00:00:00Z',
  finishedAt: '2024-01-01T00:01:00Z',
  enriched: 10,
  failed: 2,
  skipped: 1,
  errors: [],
};

const mockSummary: EnrichmentSummary = {
  newEntries: 5,
  changedEntries: 3,
  skippedEntries: 1,
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

      const req = httpMock.expectOne(`${BASE_URL}/enrichment/start`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: mockRunning, meta: null });

      expect(service.loading()).toBe(false);
      expect(service.enrichmentStatus()).toEqual(mockRunning);
    });

    it('should set loading to false on error', () => {
      service.startEnrichment();

      const req = httpMock.expectOne(`${BASE_URL}/enrichment/start`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(service.loading()).toBe(false);
      expect(service.enrichmentStatus()).toBeNull();
    });
  });

  describe('getStatus()', () => {
    it('should GET enrichment/status and return the response', () => {
      let result: EnrichmentRun | undefined;
      service.getStatus().subscribe((run) => (result = run));

      const req = httpMock.expectOne(`${BASE_URL}/enrichment/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRunning, meta: null });

      expect(result).toEqual(mockRunning);
    });

    it('should update enrichmentStatus signal on getStatus()', () => {
      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/enrichment/status`);
      req.flush({ data: mockRunning, meta: null });

      expect(service.enrichmentStatus()).toEqual(mockRunning);
    });
  });

  describe('signal state', () => {
    it('should initialize signals with null/false defaults', () => {
      expect(service.enrichmentStatus()).toBeNull();
      expect(service.summary()).toBeNull();
      expect(service.loading()).toBe(false);
    });

    it('should update enrichmentStatus signal when startEnrichment succeeds', () => {
      service.startEnrichment();
      const req = httpMock.expectOne(`${BASE_URL}/enrichment/start`);
      req.flush({ data: mockCompleted, meta: null });

      expect(service.enrichmentStatus()).toEqual(mockCompleted);
    });

    it('should distinguish running vs completed response shape', () => {
      service.getStatus().subscribe();
      httpMock.expectOne(`${BASE_URL}/enrichment/status`).flush({ data: mockRunning, meta: null });
      expect(service.enrichmentStatus()?.status).toBe(EnrichmentStatus.Running);
      expect(service.enrichmentStatus()?.finishedAt).toBeNull();

      service.getStatus().subscribe();
      httpMock
        .expectOne(`${BASE_URL}/enrichment/status`)
        .flush({ data: mockCompleted, meta: null });
      expect(service.enrichmentStatus()?.status).toBe(EnrichmentStatus.Completed);
      expect(service.enrichmentStatus()?.enriched).toBe(10);
    });
  });
});
