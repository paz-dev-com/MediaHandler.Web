import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MediaType } from '@shared/models/enums';
import { Media } from '@shared/models/media.model';
import { MediaCardComponent } from './media-card.component';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const makeMedia = (posterPath: string | null = '/poster.jpg'): Media => ({
  id: 'test-id',
  tmdbId: 12345,
  title: 'Test Movie',
  originalTitle: null,
  overview: 'A test movie.',
  type: MediaType.Film,
  releaseDate: '2024-01-15',
  runtime: 120,
  posterPath,
  backdropPath: null,
  voteAverage: 8.2,
  voteCount: 1500,
  language: 'en',
  genres: ['Action'],
  files: null,
  userMedia: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  status: null,
  numberOfSeasons: null,
  ownedSeasonCount: null,
  rootFolder: null,
});

// ── IntersectionObserver mock ─────────────────────────────────────────────────

type IOCallback = IntersectionObserverCallback;
let capturedIOCallback: IOCallback;
const mockIO = {
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
};

function stubIO() {
  vi.stubGlobal(
    'IntersectionObserver',
    // eslint-disable-next-line prefer-arrow-callback
    function MockIO(this: IntersectionObserver, callback: IOCallback) {
      capturedIOCallback = callback;
      (this as unknown as typeof mockIO).observe = mockIO.observe;
      (this as unknown as typeof mockIO).disconnect = mockIO.disconnect;
      (this as unknown as typeof mockIO).unobserve = mockIO.unobserve;
    },
  );
}

describe('MediaCardComponent', () => {
  let fixture: ComponentFixture<MediaCardComponent>;
  let component: MediaCardComponent;

  beforeEach(async () => {
    vi.clearAllMocks();
    stubIO();

    await TestBed.configureTestingModule({
      imports: [
        MediaCardComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('media', makeMedia());
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Hover state ───────────────────────────────────────────────────────────

  describe('hover state', () => {
    it('starts with hovered signal = false', () => {
      expect(component.hovered()).toBe(false);
    });

    it('sets hovered to true on mouseenter', () => {
      fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      expect(component.hovered()).toBe(true);
    });

    it('sets hovered back to false on mouseleave', () => {
      fixture.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.nativeElement.dispatchEvent(new MouseEvent('mouseleave'));
      expect(component.hovered()).toBe(false);
    });
  });

  // ── InViewport ────────────────────────────────────────────────────────────

  describe('inViewport signal', () => {
    it('starts with inViewport signal = false', () => {
      expect(component.inViewport()).toBe(false);
    });

    it('sets inViewport to true when element enters the viewport', () => {
      capturedIOCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      fixture.detectChanges();
      expect(component.inViewport()).toBe(true);
    });

    it('does not set inViewport to true when isIntersecting is false', () => {
      capturedIOCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(component.inViewport()).toBe(false);
    });

    it('disconnects the observer after first intersection', () => {
      capturedIOCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      expect(mockIO.disconnect).toHaveBeenCalledOnce();
    });
  });

  // ── Poster / placeholder ──────────────────────────────────────────────────

  describe('posterUrl', () => {
    it('returns a TMDB URL when posterPath is set', () => {
      expect(component.posterUrl).toContain('/poster.jpg');
      expect(component.posterUrl).toContain('tmdb.org');
    });

    it('returns null when posterPath is null', () => {
      fixture.componentRef.setInput('media', makeMedia(null));
      expect(component.posterUrl).toBeNull();
    });
  });

  describe('template — no-poster placeholder', () => {
    it('renders the placeholder when posterUrl is null', () => {
      fixture.componentRef.setInput('media', makeMedia(null));
      fixture.detectChanges();
      const placeholder = fixture.nativeElement.querySelector('.media-card__poster-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('does not render the placeholder when a poster exists', () => {
      const placeholder = fixture.nativeElement.querySelector('.media-card__poster-placeholder');
      expect(placeholder).toBeNull();
    });
  });

  // ── Computed getters ──────────────────────────────────────────────────────

  describe('releaseYear', () => {
    it('extracts the year from releaseDate', () => {
      expect(component.releaseYear).toBe('2024');
    });

    it('returns empty string when releaseDate is null', () => {
      fixture.componentRef.setInput('media', { ...makeMedia(), releaseDate: null });
      expect(component.releaseYear).toBe('');
    });
  });

  describe('rating', () => {
    it('formats voteAverage to one decimal place', () => {
      expect(component.rating).toBe('8.2');
    });

    it('returns empty string when voteAverage is null', () => {
      fixture.componentRef.setInput('media', { ...makeMedia(), voteAverage: null });
      expect(component.rating).toBe('');
    });
  });
});
