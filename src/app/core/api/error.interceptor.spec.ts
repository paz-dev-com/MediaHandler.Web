import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { ApiService } from './api.service';
import { errorInterceptor } from './error.interceptor';
import { environment } from '@env/environment';
import { vi } from 'vitest';

describe('errorInterceptor', () => {
  let api: ApiService;
  let httpTesting: HttpTestingController;
  let messageService: MessageService;
  const base = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        MessageService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
    messageService = TestBed.inject(MessageService);
    vi.spyOn(messageService, 'add');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should not show a toast for 400 on admin/kodi-import endpoints', () => {
    api.get('admin/kodi-import').subscribe({ error: () => undefined });

    httpTesting
      .expectOne(`${base}/admin/kodi-import`)
      .flush({ errors: [{ code: 'X', message: 'm' }] }, { status: 400, statusText: 'Bad Request' });

    expect(messageService.add).not.toHaveBeenCalled();
  });

  it('should not show a toast for 409 on admin/kodi-import endpoints', () => {
    api.get('admin/kodi-import/active').subscribe({ error: () => undefined });

    httpTesting
      .expectOne(`${base}/admin/kodi-import/active`)
      .flush({ errors: [] }, { status: 409, statusText: 'Conflict' });

    expect(messageService.add).not.toHaveBeenCalled();
  });

  it('should still show a toast for non-silenced statuses on admin/kodi-import endpoints', () => {
    api.get('admin/kodi-import').subscribe({ error: () => undefined });

    httpTesting
      .expectOne(`${base}/admin/kodi-import`)
      .flush('Server error', { status: 500, statusText: 'Internal Server Error' });

    expect(messageService.add).toHaveBeenCalled();
  });

  it('should still show a toast for 409 on unrelated URLs', () => {
    api.get('admin/other').subscribe({ error: () => undefined });

    httpTesting
      .expectOne(`${base}/admin/other`)
      .flush({ errors: [] }, { status: 409, statusText: 'Conflict' });

    expect(messageService.add).toHaveBeenCalled();
  });
});
