import { Directive, ElementRef, DestroyRef, inject, signal } from '@angular/core';

/**
 * Directive that uses IntersectionObserver to detect when the host element
 * enters the viewport. Sets the `inViewport` signal to `true` once visible,
 * then disconnects the observer (one-shot entrance detection).
 *
 * Usage: <div appInViewport #v="appInViewport"> ... </div>
 */
@Directive({
  selector: '[appInViewport]',
  exportAs: 'appInViewport',
})
export class InViewportDirective {
  /** Becomes true once the host element has entered the viewport. */
  readonly inViewport = signal(false);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private observer: IntersectionObserver | null = null;

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          this.inViewport.set(true);
          // One-shot: disconnect after first intersection
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold: 0.1 },
    );

    this.observer.observe(this.el.nativeElement);

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.observer = null;
    });
  }
}
