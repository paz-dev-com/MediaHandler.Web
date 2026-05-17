import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  let isLoading$: BehaviorSubject<boolean>;
  let mockIsAdmin: ReturnType<typeof vi.fn>;
  let mockCreateUrlTree: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isLoading$ = new BehaviorSubject(false);
    mockIsAdmin = vi.fn().mockReturnValue(false);
    mockCreateUrlTree = vi.fn().mockReturnValue({ toString: () => '/' } as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth0Service,
          useValue: { isLoading$: isLoading$.asObservable() },
        },
        {
          provide: AuthService,
          useValue: { isAdmin: mockIsAdmin },
        },
        {
          provide: Router,
          useValue: { createUrlTree: mockCreateUrlTree },
        },
      ],
    });
  });

  function runGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean | UrlTree>;
  }

  it('allows access when user is admin', async () => {
    mockIsAdmin.mockReturnValue(true);
    const result = await firstValueFrom(runGuard());
    expect(result).toBe(true);
  });

  it('redirects to "/" when user is not admin', async () => {
    mockIsAdmin.mockReturnValue(false);
    const result = await firstValueFrom(runGuard());
    expect(mockCreateUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toBeDefined();
  });

  it('waits for loading to finish before evaluating admin status', async () => {
    isLoading$.next(true);
    mockIsAdmin.mockReturnValue(true);

    const resultPromise = firstValueFrom(runGuard());
    isLoading$.next(false);

    const result = await resultPromise;
    expect(result).toBe(true);
  });
});
