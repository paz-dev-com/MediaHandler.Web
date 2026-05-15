import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '@auth0/auth0-angular';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { describe, it, beforeEach, vi } from 'vitest';

import { App } from './app';
import { SidebarComponent } from '@core/layout/sidebar.component';

/** Stub — évite de charger TranslocoModule et toutes les dépendances Auth0 de SidebarComponent. */
@Component({ selector: 'app-sidebar', standalone: true, template: '' })
class MockSidebarComponent {}

const mockAuth0 = {
  isAuthenticated$: of(false),
  isLoading$: of(false),
  user$: of(null),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getAccessTokenSilently: () => of(''),
};

describe('App', () => {
  beforeEach(async () => {
    // Mock window.matchMedia for prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: mockAuth0 },
        MessageService,
      ],
    })
      .overrideComponent(App, {
        remove: { imports: [SidebarComponent] },
        add: { imports: [MockSidebarComponent] },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
