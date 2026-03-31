import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

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
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuth0 }, MessageService],
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
