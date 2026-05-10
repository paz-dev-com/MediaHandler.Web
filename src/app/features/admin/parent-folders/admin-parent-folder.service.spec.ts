import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { AdminParentFolderService } from './admin-parent-folder.service';
import { ParentFolderGroup } from '@shared/models/parent-folder.model';
import { environment } from '@env/environment';
import { vi } from 'vitest';

describe('AdminParentFolderService', () => {
  let service: AdminParentFolderService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  const mockFolder: ParentFolderGroup = {
    id: 'folder-1',
    folderPath: '/Disque NAS 1/Séries/Law and Order/SVU',
    detectedShowName: 'Law and Order SVU',
    episodeCount: 10,
    status: 'NotAssigned',
    tmdbId: undefined,
    tmdbTitle: undefined,
    firstSeenAt: '2024-01-01T00:00:00Z',
  };

  const emptyResponse = {
    data: [],
    meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
    errors: [],
  };

  const mockMessageService = {
    add: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminParentFolderService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: mockMessageService },
      ],
    });
    service = TestBed.inject(AdminParentFolderService);
    httpTesting = TestBed.inject(HttpTestingController);
    mockMessageService.add.mockClear();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── getFolders ───────────────────────────────────────────────────────────────

  it('should GET admin/parent-folders with default page and pageSize', () => {
    service.getFolders();

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/parent-folders` &&
        r.params.get('page') === '1' &&
        r.params.get('pageSize') === '20',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include status param when provided', () => {
    service.getFolders(1, 20, 'NotAssigned');

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/parent-folders` && r.params.get('status') === 'NotAssigned',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should include page and pageSize params', () => {
    service.getFolders(2, 10);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/parent-folders` &&
        r.params.get('page') === '2' &&
        r.params.get('pageSize') === '10',
    );
    expect(req.request.method).toBe('GET');
    req.flush(emptyResponse);
  });

  it('should update folders signal after getFolders resolves', () => {
    service.getFolders();

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`);
    req.flush({
      data: [mockFolder],
      meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
      errors: [],
    });

    expect(service.folders()).toEqual([mockFolder]);
    expect(service.loading()).toBe(false);
  });

  it('should update meta signal after getFolders resolves', () => {
    service.getFolders();

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`);
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 42, totalPages: 3 },
      errors: [],
    });

    expect(service.meta()).toEqual({ page: 1, pageSize: 20, total: 42 });
  });

  it('should set loading=true while request is in-flight then false after', () => {
    service.getFolders();
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`);
    req.flush(emptyResponse);
    expect(service.loading()).toBe(false);
  });

  // ── assignFolder ─────────────────────────────────────────────────────────────

  it('should PUT admin/parent-folders/{id}/assign with tmdbId and kind', () => {
    service.getFolders();
    httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`).flush(emptyResponse);

    service.assignFolder('folder-1', 12345, 'tv');

    const req = httpTesting.expectOne(`${base}/admin/parent-folders/folder-1/assign`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ tmdbId: 12345, kind: 'tv' });
    req.flush({
      data: { ...mockFolder, status: 'Assigned', tmdbId: 12345 },
      meta: null,
      errors: [],
    });

    // refresh call
    httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`).flush(emptyResponse);
  });

  it('should show success toast after assignFolder completes', () => {
    service.getFolders();
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/parent-folders`)
      .flush({
        data: [mockFolder],
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        errors: [],
      });

    service.assignFolder('folder-1', 999, 'tv');

    const req = httpTesting.expectOne(`${base}/admin/parent-folders/folder-1/assign`);
    req.flush({
      data: { ...mockFolder, status: 'Assigned', tmdbId: 999 },
      meta: null,
      errors: [],
    });

    expect(mockMessageService.add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success' }),
    );

    httpTesting.expectOne((r) => r.url === `${base}/admin/parent-folders`).flush(emptyResponse);
  });

  it('should refresh folders signal after assignFolder completes', () => {
    service.getFolders(1, 20, 'NotAssigned');
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/parent-folders`)
      .flush({
        data: [mockFolder],
        meta: { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 },
        errors: [],
      });

    service.assignFolder('folder-1', 12345, 'tv');
    httpTesting
      .expectOne(`${base}/admin/parent-folders/folder-1/assign`)
      .flush({ data: { ...mockFolder, status: 'Assigned' }, meta: null, errors: [] });

    httpTesting
      .expectOne(
        (r) => r.url === `${base}/admin/parent-folders` && r.params.get('status') === 'NotAssigned',
      )
      .flush(emptyResponse);

    expect(service.folders()).toEqual([]);
  });
});
