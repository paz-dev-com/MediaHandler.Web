import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminUserService } from './admin-user.service';
import { environment } from '@env/environment';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpTesting: HttpTestingController;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminUserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ── getUsers ────────────────────────────────────────────────────────────────

  it('should GET admin/users with page and pageSize', () => {
    service.getUsers(1, 20);

    const req = httpTesting.expectOne(
      (r) =>
        r.url === `${base}/admin/users` &&
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

  it('should include search param when provided', () => {
    service.getUsers(1, 20, 'alice');

    const req = httpTesting.expectOne(
      (r) => r.url === `${base}/admin/users` && r.params.get('search') === 'alice',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      errors: [],
    });
  });

  it('should update users signal after getUsers resolves', () => {
    const mockUsers = [
      { id: '1', email: 'a@b.com', name: 'Alice', role: 'user', isActive: true, createdAt: '' },
    ];
    const mockMeta = { page: 1, pageSize: 20, totalCount: 1, totalPages: 1 };

    service.getUsers(1, 20);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/users`);
    req.flush({ data: mockUsers, meta: mockMeta, errors: [] });

    // signals update synchronously after flush
    expect(service.users()).toEqual(mockUsers);
    expect(service.meta()).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(service.loading()).toBe(false);
  });

  it('should set loading=true while request is in-flight', () => {
    service.getUsers(1, 20);
    expect(service.loading()).toBe(true);

    const req = httpTesting.expectOne((r) => r.url === `${base}/admin/users`);
    req.flush({
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      errors: [],
    });
    expect(service.loading()).toBe(false);
  });

  // ── setRole ─────────────────────────────────────────────────────────────────

  it('should PUT admin/users/{userId}/role with role body', () => {
    // suppress the subsequent getUsers call
    service.getUsers(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/users`)
      .flush({ data: [], meta: null, errors: [] });

    service.setRole('user-123', 'admin');

    const req = httpTesting.expectOne(`${base}/admin/users/user-123/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ role: 'admin' });
    req.flush({ data: null, meta: null, errors: [] });

    // refresh call
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/users`)
      .flush({ data: [], meta: null, errors: [] });
  });

  // ── setActive ───────────────────────────────────────────────────────────────

  it('should PUT admin/users/{userId}/active with isActive body', () => {
    service.getUsers(1, 20);
    httpTesting
      .expectOne((r) => r.url === `${base}/admin/users`)
      .flush({ data: [], meta: null, errors: [] });

    service.setActive('user-456', false);

    const req = httpTesting.expectOne(`${base}/admin/users/user-456/active`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({ data: null, meta: null, errors: [] });

    httpTesting
      .expectOne((r) => r.url === `${base}/admin/users`)
      .flush({ data: [], meta: null, errors: [] });
  });
});
