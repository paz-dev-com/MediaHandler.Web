import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InViewportDirective } from './in-viewport.directive';

// ── Minimal host component ────────────────────────────────────────────────────

@Component({
  template: `<div appInViewport #v="appInViewport"></div>`,
  imports: [InViewportDirective],
})
class TestHostComponent {}

// ── IntersectionObserver mock helpers ────────────────────────────────────────

type IOCallback = IntersectionObserverCallback;

let capturedCallback: IOCallback;
const mockObserver = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
};

function stubIntersectionObserver() {
  // Must use regular function (not arrow) so it works with `new`
  vi.stubGlobal(
    'IntersectionObserver',
    // eslint-disable-next-line prefer-arrow-callback
    function MockIO(this: IntersectionObserver, callback: IOCallback) {
      capturedCallback = callback;
      (this as unknown as typeof mockObserver).observe = mockObserver.observe;
      (this as unknown as typeof mockObserver).disconnect = mockObserver.disconnect;
      (this as unknown as typeof mockObserver).unobserve = mockObserver.unobserve;
    },
  );
}

function triggerIntersection(isIntersecting: boolean): void {
  capturedCallback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
}

describe('InViewportDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    vi.clearAllMocks();
    stubIntersectionObserver();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a directive instance', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts with inViewport signal = false', () => {
    const directive = fixture.debugElement.children[0].injector.get(InViewportDirective);
    expect(directive.inViewport()).toBe(false);
  });

  it('sets inViewport to true when element enters the viewport', () => {
    const directive = fixture.debugElement.children[0].injector.get(InViewportDirective);
    triggerIntersection(true);
    fixture.detectChanges();
    expect(directive.inViewport()).toBe(true);
  });

  it('does not set inViewport to true when isIntersecting is false', () => {
    const directive = fixture.debugElement.children[0].injector.get(InViewportDirective);
    triggerIntersection(false);
    fixture.detectChanges();
    expect(directive.inViewport()).toBe(false);
  });

  it('disconnects the IntersectionObserver after first intersection', () => {
    triggerIntersection(true);
    expect(mockObserver.disconnect).toHaveBeenCalledOnce();
  });

  it('calls observer.observe() on the host element', () => {
    expect(mockObserver.observe).toHaveBeenCalledOnce();
  });

  it('disconnects the observer when the component is destroyed', () => {
    vi.clearAllMocks();
    const f2 = TestBed.createComponent(TestHostComponent);
    f2.detectChanges();
    f2.destroy();
    expect(mockObserver.disconnect).toHaveBeenCalled();
  });
});
