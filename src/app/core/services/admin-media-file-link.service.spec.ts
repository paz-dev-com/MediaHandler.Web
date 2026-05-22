import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminMediaFileLinkService } from './admin-media-file-link.service';
import { environment } from '@env/environment';

describe('AdminMediaFileLinkService', () => {
  let service: AdminMediaFileLinkService;
  let httpMock: HttpTestingController;

  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminMediaFileLinkService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminMediaFileLinkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  describe('getUnlinkedFiles', () => {
    it('calls GET /admin/media/unlinked-files with default page params', () => {
      service.getUnlinkedFiles().subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${base}/admin/media/unlinked-files` &&
          r.params.get('page') === '1' &&
          r.params.get('pageSize') === '20',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 } });
    });

    it('calls GET /admin/media/unlinked-files with custom page params', () => {
      service.getUnlinkedFiles(2, 50).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${base}/admin/media/unlinked-files` &&
          r.params.get('page') === '2' &&
          r.params.get('pageSize') === '50',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ data: [], meta: { page: 2, pageSize: 50, totalCount: 0, totalPages: 0 } });
    });
  });

  describe('linkFile', () => {
    it('calls PUT /admin/media/{mediaId}/files/{fileId}/link', () => {
      service.linkFile('media-1', 'file-1').subscribe();
      const req = httpMock.expectOne(`${base}/admin/media/media-1/files/file-1/link`);
      expect(req.request.method).toBe('PUT');
      req.flush({ data: null });
    });
  });

  describe('unlinkFile', () => {
    it('calls DELETE /admin/media/{mediaId}/files/{fileId}/link', () => {
      service.unlinkFile('media-1', 'file-1').subscribe();
      const req = httpMock.expectOne(`${base}/admin/media/media-1/files/file-1/link`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: null });
    });
  });

  describe('updateRootFolder', () => {
    it('calls PATCH /admin/media/{mediaId}/root-folder with path', () => {
      service.updateRootFolder('media-1', '/nas/tv').subscribe();
      const req = httpMock.expectOne(`${base}/admin/media/media-1/root-folder`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ rootFolder: '/nas/tv' });
      req.flush({ data: null });
    });

    it('calls PATCH /admin/media/{mediaId}/root-folder with null to clear', () => {
      service.updateRootFolder('media-1', null).subscribe();
      const req = httpMock.expectOne(`${base}/admin/media/media-1/root-folder`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ rootFolder: null });
      req.flush({ data: null });
    });
  });
});
