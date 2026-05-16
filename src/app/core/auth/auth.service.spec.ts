import { TestBed } from '@angular/core/testing';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { ApiService } from '@core/api/api.service';
import { UserRole } from '@shared/models/enums';
import { User } from '@shared/models/user.model';
import { AuthService } from './auth.service';

const makeUser = (role: UserRole): User => ({
  id: '1',
  oktaId: 'okta|test',
  email: 'test@example.com',
  displayName: 'Test User',
  preferredLanguage: 'fr',
  role,
  isActive: true,
});

describe('AuthService', () => {
  let service: AuthService;
  let isAuthenticated$: BehaviorSubject<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user$: BehaviorSubject<any>;
  let mockGetToken: ReturnType<typeof vi.fn>;
  let mockLogin: ReturnType<typeof vi.fn>;
  let mockLogout: ReturnType<typeof vi.fn>;
  let mockApiGet: ReturnType<typeof vi.fn>;
  let mockApiPost: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    isAuthenticated$ = new BehaviorSubject(false);
    user$ = new BehaviorSubject<{ sub: string; email: string; name: string } | null>({
      sub: 'okta|test',
      email: 'test@example.com',
      name: 'Test User',
    });
    mockGetToken = vi.fn().mockReturnValue(of('access-token'));
    mockLogin = vi.fn();
    mockLogout = vi.fn();
    mockApiGet = vi
      .fn()
      .mockReturnValue(of({ data: makeUser(UserRole.User), meta: null, errors: [] }));
    mockApiPost = vi
      .fn()
      .mockReturnValue(of({ data: makeUser(UserRole.Admin), meta: null, errors: [] }));

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: Auth0Service,
          useValue: {
            isAuthenticated$: isAuthenticated$.asObservable(),
            isLoading$: of(false),
            user$: user$.asObservable(),
            loginWithRedirect: mockLogin,
            logout: mockLogout,
            getAccessTokenSilently: mockGetToken,
          },
        },
        {
          provide: ApiService,
          useValue: { get: mockApiGet, post: mockApiPost },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── isAdmin() ────────────────────────────────────────────────────────────

  describe('isAdmin()', () => {
    it('returns false when no user is loaded', () => {
      expect(service.isAdmin()).toBe(false);
    });

    it('returns true when backend user has Admin role', () => {
      service.setUser(makeUser(UserRole.Admin));
      expect(service.isAdmin()).toBe(true);
    });

    it('returns false when backend user has User role', () => {
      service.setUser(makeUser(UserRole.User));
      expect(service.isAdmin()).toBe(false);
    });
  });

  // ── login() ──────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('calls auth0.loginWithRedirect()', () => {
      service.login();
      expect(mockLogin).toHaveBeenCalledOnce();
    });
  });

  // ── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears the user and calls auth0.logout()', () => {
      service.setUser(makeUser(UserRole.User));
      service.logout();
      expect(service.user()).toBeNull();
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  // ── getAccessToken() ─────────────────────────────────────────────────────

  describe('getAccessToken()', () => {
    it('returns the token from Auth0', async () => {
      const token = await service.getAccessToken();
      expect(token).toBe('access-token');
    });

    it('returns undefined when token retrieval fails', async () => {
      mockGetToken.mockReturnValue(throwError(() => new Error('no token')));
      const token = await service.getAccessToken();
      expect(token).toBeUndefined();
    });
  });

  // ── loadProfile() — auto-triggered on auth ──────────────────────────────

  describe('loadProfile() — auto-triggered on auth', () => {
    it('calls api.get("auth/me") when the user becomes authenticated', () => {
      expect(mockApiGet).not.toHaveBeenCalled();
      isAuthenticated$.next(true);
      expect(mockApiGet).toHaveBeenCalledWith('auth/me');
    });

    it('sets the user from the profile API response', () => {
      isAuthenticated$.next(true);
      expect(service.user()?.role).toBe(UserRole.User);
    });

    it('does not call the API a second time on subsequent auth events (take(1))', () => {
      isAuthenticated$.next(true); // first call
      isAuthenticated$.next(false);
      isAuthenticated$.next(true); // take(1) — service already unsubscribed
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });
  });

  // ── syncUser() ───────────────────────────────────────────────────────────

  describe('syncUser()', () => {
    it('calls api.post("auth/sync", {}) and updates the user', () => {
      service.syncUser();
      expect(mockApiPost).toHaveBeenCalledWith('auth/sync', {
        sub: 'okta|test',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
      });
      expect(service.user()?.role).toBe(UserRole.Admin);
    });

    it('does not call the API a second time if already synced', () => {
      service.syncUser();
      service.syncUser();
      expect(mockApiPost).toHaveBeenCalledTimes(1);
    });
  });
});
