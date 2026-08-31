import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminKodiImportService } from './admin-kodi-import.service';
import {
  ImportItemStatus,
  ImportRunStatus,
  KodiImportMode,
  KodiItemKind,
} from '@shared/models/enums';
import { environment } from '@env/environment';
import {
  makeImportCounts,
  makeImportRun,
  makeImportRunDetail,
  makeImportItemOutcome,
  makeFile,
} from './kodi-import-test-factory';
import { vi } from 'vitest';

describe('AdminKodiImportService', () => {
  let service: AdminKodiImportService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminKodiImportService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminKodiImportService);
    httpTesting = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  // ── uploadDatabase ───────────────────────────────────────────────────────────

  it('should POST FormData to admin/kodi-import with lowercase mode', async () => {
    const file = makeFile('MyVideos121.db');
    service.uploadDatabase(file, KodiImportMode.Preview);
    await Promise.resolve();

    const rawReq = httpTesting.expectOne((r) => r.url === `${base}/admin/kodi-import/raw`);
    expect(rawReq.request.method).toBe('POST');
    expect(rawReq.request.body).toBeInstanceOf(Blob);
    expect(rawReq.request.params.get('fileName')).toBe(file.name);
    expect(rawReq.request.params.get('mode')).toBe('preview');
    rawReq.flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });

    const req = httpTesting.expectOne(`${base}/admin/kodi-import`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.get('file')).toBe(file);
    expect(req.request.body.get('mode')).toBe('preview');
    req.flush({
      data: makeImportRun({ status: ImportRunStatus.Running }),
      meta: null,
      errors: [],
    });

    expect(service.uploading()).toBe(false);
    vi.clearAllTimers();
  });

  it('should set activeRun and start polling after upload returns a running run', async () => {
    const file = makeFile('MyVideos121.db');
    service.uploadDatabase(file, KodiImportMode.Import);
    await Promise.resolve();

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import/raw`)
      .flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });

    httpTesting.expectOne(`${base}/admin/kodi-import`).flush({
      data: makeImportRun({ status: ImportRunStatus.Running }),
      meta: null,
      errors: [],
    });

    expect(service.activeRun()?.status).toBe(ImportRunStatus.Running);

    vi.advanceTimersByTime(4000);
    httpTesting.expectOne(`${base}/admin/kodi-import/active`).flush({
      data: makeImportRun({ status: ImportRunStatus.Running }),
      meta: null,
      errors: [],
    });

    vi.clearAllTimers();
  });

  it('should refresh history immediately when upload returns a terminal run', async () => {
    const file = makeFile('MyVideos121.db');
    service.uploadDatabase(file, KodiImportMode.Import);
    await Promise.resolve();

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import/raw`)
      .flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });

    httpTesting.expectOne(`${base}/admin/kodi-import`).flush({
      data: makeImportRun({ status: ImportRunStatus.Completed }),
      meta: null,
      errors: [],
    });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import`)
      .flush({
        data: [makeImportRun({ status: ImportRunStatus.Completed })],
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        errors: [],
      });
  });

  it('should map upload rejection codes to uploadErrorCode', async () => {
    const file = makeFile('MyVideos121.db');
    const codes = [
      'INVALID_FILE_NAME',
      'UNSUPPORTED_VERSION',
      'UPLOAD_TOO_LARGE',
      'INVALID_KODI_DB',
      'VALIDATION_ERROR',
    ];

    for (const code of codes) {
      service.uploadDatabase(file, KodiImportMode.Import);
      await Promise.resolve();

      httpTesting
        .expectOne((r) => r.url === `${base}/admin/kodi-import/raw`)
        .flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });

      const req = httpTesting.expectOne(`${base}/admin/kodi-import`);
      req.flush(
        { data: null, meta: null, errors: [{ code, message: 'detail' }] },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(service.uploadErrorCode()).toBe(code);
      expect(service.uploadErrorMessage()).toBe('detail');
      expect(service.uploading()).toBe(false);
      service.clearUploadError();
    }
  });

  it('should map 409 to IMPORT_IN_PROGRESS upload error code', async () => {
    const file = makeFile('MyVideos121.db');
    service.uploadDatabase(file, KodiImportMode.Import);
    await Promise.resolve();

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import/raw`)
      .flush('Unsupported Media Type', { status: 415, statusText: 'Unsupported Media Type' });

    const req = httpTesting.expectOne(`${base}/admin/kodi-import`);
    req.flush(
      {
        data: null,
        meta: null,
        errors: [{ code: 'IMPORT_IN_PROGRESS', message: 'already running' }],
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(service.uploadErrorCode()).toBe('IMPORT_IN_PROGRESS');
    expect(service.uploading()).toBe(false);
  });

  // ── getActiveRun ─────────────────────────────────────────────────────────────

  it('should GET admin/kodi-import/active and start polling for a running run', () => {
    service.getActiveRun();

    httpTesting.expectOne(`${base}/admin/kodi-import/active`).flush({
      data: makeImportRun({ status: ImportRunStatus.Running }),
      meta: null,
      errors: [],
    });

    expect(service.activeRun()?.status).toBe(ImportRunStatus.Running);

    vi.advanceTimersByTime(4000);
    httpTesting.expectOne(`${base}/admin/kodi-import/active`).flush({
      data: makeImportRun({ status: ImportRunStatus.Running }),
      meta: null,
      errors: [],
    });

    vi.clearAllTimers();
  });

  it('should set activeRun to null when no run is active', () => {
    service.getActiveRun();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush({ data: null, meta: null, errors: [] });
    expect(service.activeRun()).toBeNull();
  });

  // ── polling lifecycle ────────────────────────────────────────────────────────

  it('should stop polling and refresh history when terminal state is returned', () => {
    service.getActiveRun();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush({ data: makeImportRun({ status: ImportRunStatus.Running }), meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting.expectOne(`${base}/admin/kodi-import/active`).flush({
      data: makeImportRun({ status: ImportRunStatus.Completed }),
      meta: null,
      errors: [],
    });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import`)
      .flush({
        data: [],
        meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
        errors: [],
      });

    vi.advanceTimersByTime(4000);
    httpTesting.expectNone(`${base}/admin/kodi-import/active`);
  });

  it('should set pollingError and keep polling on error responses', () => {
    service.getActiveRun();
    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush({ data: makeImportRun({ status: ImportRunStatus.Running }), meta: null, errors: [] });

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(service.pollingError()).toBe(true);

    vi.advanceTimersByTime(4000);
    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush({ data: makeImportRun({ status: ImportRunStatus.Running }), meta: null, errors: [] });

    expect(service.pollingError()).toBe(false);
    vi.clearAllTimers();
  });

  // ── getHistory ───────────────────────────────────────────────────────────────

  it('should GET admin/kodi-import with page and pageSize', () => {
    service.getHistory(1, 20);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/kodi-import` &&
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

  it('should update history and historyMeta signals', () => {
    const run = makeImportRun({ id: 'run-history' });
    service.getHistory(1, 20);

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import`)
      .flush({
        data: [run],
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        errors: [],
      });

    expect(service.history()).toEqual([run]);
    expect(service.historyMeta()).toEqual({ page: 1, pageSize: 20, total: 1 });
  });

  it('should set historyError on load failure', () => {
    service.getHistory(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/kodi-import`)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(service.historyError()).toBe(true);
    expect(service.historyLoading()).toBe(false);
  });

  // ── getRunDetail ─────────────────────────────────────────────────────────────

  it('should GET admin/kodi-import/{id} and set report', () => {
    const detail = makeImportRunDetail({ id: 'run-detail' });
    service.getRunDetail('run-detail').subscribe();

    const req = httpTesting.expectOne(`${base}/admin/kodi-import/run-detail`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detail, meta: null, errors: [] });

    expect(service.report()).toEqual(detail);
  });

  it('should set reportNotFound on 404', () => {
    service.getRunDetail('missing').subscribe({ error: () => undefined });
    httpTesting
      .expectOne(`${base}/admin/kodi-import/missing`)
      .flush({ data: null, meta: null, errors: [] }, { status: 404, statusText: 'Not Found' });

    expect(service.reportNotFound()).toBe(true);
  });

  // ── getItems ─────────────────────────────────────────────────────────────────

  it('should GET admin/kodi-import/{id}/items without optional filters', () => {
    service.getItems('run-items');

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/kodi-import/run-items/items` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '50' &&
        !r.params.has('outcome') &&
        !r.params.has('kind'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 50, totalCount: 0, totalPages: 0 },
      errors: [],
    });
  });

  it('should include outcome and kind filters when set', () => {
    service.getItems('run-items', ImportItemStatus.Conflict, KodiItemKind.Episode, 2, 25);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/kodi-import/run-items/items` &&
        r.params.get('outcome') === ImportItemStatus.Conflict &&
        r.params.get('kind') === KodiItemKind.Episode &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '25',
    );
    req.flush({
      data: [makeImportItemOutcome()],
      meta: { page: 2, pageSize: 25, totalCount: 1, totalPages: 1 },
      errors: [],
    });

    expect(service.items().length).toBe(1);
  });

  // ── signal state ─────────────────────────────────────────────────────────────

  it('should initialise signals with default values', () => {
    expect(service.activeRun()).toBeNull();
    expect(service.history()).toEqual([]);
    expect(service.historyMeta()).toEqual({ page: 1, pageSize: 20, total: 0 });
    expect(service.items()).toEqual([]);
    expect(service.itemsMeta()).toEqual({ page: 1, pageSize: 50, total: 0 });
    expect(service.uploading()).toBe(false);
    expect(service.elapsedSeconds()).toBe(0);
  });

  it('should compute elapsedSeconds while a run is active', () => {
    vi.setSystemTime(new Date('2024-01-01T00:01:00Z'));
    service.activeRun.set(
      makeImportRun({ status: ImportRunStatus.Running, startedAt: '2024-01-01T00:00:00Z' }),
    );

    (service as unknown as { updateElapsedSeconds: () => void }).updateElapsedSeconds();

    expect(service.elapsedSeconds()).toBe(60);
  });
});
