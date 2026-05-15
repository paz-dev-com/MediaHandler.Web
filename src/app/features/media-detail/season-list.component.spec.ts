import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { TvSeason } from '@shared/models/tv.model';
import { SeasonListComponent } from './season-list.component';

// ── Test fixtures ─────────────────────────────────────────────────────────────

function makeSeason(partial?: Partial<TvSeason>): TvSeason {
  return {
    id: 'season-1',
    mediaId: 'media-1',
    seasonNumber: 1,
    name: 'Season 1',
    overview: null,
    airDate: '2024-01-01',
    posterPath: null,
    episodeCount: 10,
    episodes: [
      {
        id: 'ep-1',
        seasonId: 'season-1',
        episodeNumber: 1,
        name: 'Pilot',
        overview: null,
        stillPath: null,
        airDate: null,
        runtime: null,
        isWatched: false,
      },
    ],
    watchedCount: 3,
    ...partial,
  };
}

describe('SeasonListComponent', () => {
  let fixture: ComponentFixture<SeasonListComponent>;
  let component: SeasonListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SeasonListComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideNoopAnimations()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('mediaId', 'media-1');
    fixture.componentRef.setInput('seasons', [makeSeason()]);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Accordion expand / collapse ───────────────────────────────────────────

  describe('toggleSeason / isExpanded', () => {
    it('starts with all seasons collapsed', () => {
      expect(component.isExpanded('season-1')).toBe(false);
    });

    it('expands a season when toggleSeason is called', () => {
      component.toggleSeason('season-1');
      expect(component.isExpanded('season-1')).toBe(true);
    });

    it('collapses an expanded season when toggleSeason is called again', () => {
      component.toggleSeason('season-1');
      component.toggleSeason('season-1');
      expect(component.isExpanded('season-1')).toBe(false);
    });

    it('handles multiple seasons independently', () => {
      const season2 = makeSeason({ id: 'season-2', seasonNumber: 2, name: 'Season 2' });
      fixture.componentRef.setInput('seasons', [makeSeason(), season2]);
      fixture.detectChanges();
      component.toggleSeason('season-1');
      expect(component.isExpanded('season-1')).toBe(true);
      expect(component.isExpanded('season-2')).toBe(false);
    });
  });

  // ── @accordionExpand animation trigger state ──────────────────────────────

  describe('@accordionExpand animation binding', () => {
    it('isExpanded returns false initially (drives "collapsed" animation state)', () => {
      expect(component.isExpanded('season-1')).toBe(false);
    });

    it('isExpanded returns true after toggle (drives "expanded" animation state)', () => {
      component.toggleSeason('season-1');
      fixture.detectChanges();
      expect(component.isExpanded('season-1')).toBe(true);
    });
  });

  // ── Watched progress helpers ──────────────────────────────────────────────

  describe('isSeasonFullyWatched', () => {
    it('returns false when watchedCount < episodeCount', () => {
      const season = makeSeason({ episodeCount: 10, watchedCount: 3 });
      expect(component.isSeasonFullyWatched(season)).toBe(false);
    });

    it('returns true when watchedCount equals episodeCount', () => {
      const season = makeSeason({ episodeCount: 10, watchedCount: 10 });
      expect(component.isSeasonFullyWatched(season)).toBe(true);
    });

    it('returns false when episodeCount is 0', () => {
      const season = makeSeason({ episodeCount: 0, watchedCount: 0 });
      expect(component.isSeasonFullyWatched(season)).toBe(false);
    });
  });

  describe('getSeasonProgress', () => {
    it('calculates percentage correctly', () => {
      const season = makeSeason({ episodeCount: 10, watchedCount: 5 });
      expect(component.getSeasonProgress(season)).toBe(50);
    });

    it('returns 0 when episodeCount is 0', () => {
      const season = makeSeason({ episodeCount: 0, watchedCount: 0 });
      expect(component.getSeasonProgress(season)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      const season = makeSeason({ episodeCount: 3, watchedCount: 1 });
      expect(component.getSeasonProgress(season)).toBe(33);
    });
  });

  // ── Template ──────────────────────────────────────────────────────────────

  describe('template', () => {
    it('renders the season accordion when seasons are provided', () => {
      const accordion = fixture.nativeElement.querySelector('.season-accordion');
      expect(accordion).toBeTruthy();
    });

    it('renders the empty state when seasons array is empty', () => {
      fixture.componentRef.setInput('seasons', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.season-list__empty')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.season-accordion')).toBeNull();
    });
  });
});
