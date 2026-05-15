import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

describe('LoadingSkeletonComponent', () => {
  let fixture: ComponentFixture<LoadingSkeletonComponent>;
  let component: LoadingSkeletonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSkeletonComponent);
    component = fixture.componentInstance;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the card grid by default (variant = "card")', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.skeleton-grid');
    expect(grid).toBeTruthy();
  });

  it('renders shimmer elements inside the card grid', () => {
    fixture.detectChanges();
    const shimmerCards = fixture.nativeElement.querySelectorAll('.skeleton-card.shimmer');
    expect(shimmerCards.length).toBeGreaterThan(0);
  });

  it('renders the list when variant input is "list"', () => {
    fixture.componentRef.setInput('variant', 'list');
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.skeleton-list');
    expect(list).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.skeleton-grid')).toBeNull();
  });

  it('renders shimmer elements in list variant', () => {
    fixture.componentRef.setInput('variant', 'list');
    fixture.detectChanges();

    const shimmerElements = fixture.nativeElement.querySelectorAll('.shimmer');
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  // ── Count input ───────────────────────────────────────────────────────────

  it('renders the default number of card skeletons (count = 12)', () => {
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(12);
  });

  it('renders the correct number of skeletons when count is set', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.skeleton-card');
    expect(cards.length).toBe(3);
  });

  it('renders the correct number of list skeletons for "list" variant', () => {
    fixture.componentRef.setInput('variant', 'list');
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();

    const listItems = fixture.nativeElement.querySelectorAll('.skeleton-list-item');
    expect(listItems.length).toBe(5);
  });

  // ── CSS class presence (drives @keyframes shimmer animation) ──────────────

  it('applies the "shimmer" CSS class to skeleton items (drives animation)', () => {
    fixture.detectChanges();
    const shimmer = fixture.nativeElement.querySelector('.shimmer');
    expect(shimmer).toBeTruthy();
    expect(shimmer.classList.contains('shimmer')).toBe(true);
  });
});
