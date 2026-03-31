import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let isAuthenticated$: BehaviorSubject<boolean>;
  let isLoading$: BehaviorSubject<boolean>;
  let mockLoginWithRedirect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject(false);
    isLoading$ = new BehaviorSubject(true);
    mockLoginWithRedirect = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isAuthenticated$: isAuthenticated$.asObservable(),
            isLoading$: isLoading$.asObservable(),
            loginWithRedirect: mockLoginWithRedirect,
          },
        },
      ],
    });
  });

  function runGuard(): Observable<boolean> {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as Observable<boolean>;
  }

  it('allows access when authenticated and loading is complete', async () => {
    isAuthenticated$.next(true);
    isLoading$.next(false);
    const result = await firstValueFrom(runGuard());
    expect(result).toBe(true);
    expect(mockLoginWithRedirect).not.toHaveBeenCalled();
  });

  it('denies access and calls loginWithRedirect when not authenticated', async () => {
    isAuthenticated$.next(false);
    isLoading$.next(false);
    const result = await firstValueFrom(runGuard());
    expect(result).toBe(false);
    expect(mockLoginWithRedirect).toHaveBeenCalled();
  });

  it('waits until loading is finished before evaluating auth state', async () => {
    isAuthenticated$.next(true);
    // isLoading$ is still true — guard should not emit yet
    const resultPromise = firstValueFrom(runGuard());
    // Now loading finishes
    isLoading$.next(false);
    const result = await resultPromise;
    expect(result).toBe(true);
  });
});
