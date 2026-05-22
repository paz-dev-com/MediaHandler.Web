import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { SeasonCompletenessComponent } from './season-completeness.component';
import { SeasonCompleteness } from '@shared/models/media.model';
import { ClipboardService } from '@core/services/clipboard.service';

function makeSeason(partial?: Partial<SeasonCompleteness>): SeasonCompleteness {
  return {
    seasonNumber: 1,
    seasonName: 'Season 1',
    totalExpected: 10,
    ownedCount: 8,
    missingEpisodeNumbers: [3, 7],
    isComplete: false,
    ...partial,
  };
}

describe('SeasonCompletenessComponent', () => {
  let fixture: ComponentFixture<SeasonCompletenessComponent>;
  let component: SeasonCompletenessComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SeasonCompletenessComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [
        {
          provide: ClipboardService,
          useValue: {
            copy: async (): Promise<boolean> => true,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonCompletenessComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('empty state', () => {
    it('completeness defaults to empty array', () => {
      fixture.detectChanges();
      expect(component.completeness()).toEqual([]);
    });

    it('renders empty state when no seasons', () => {
      fixture.componentRef.setInput('completeness', []);
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('.season-completeness__empty');
      expect(empty).toBeTruthy();
    });

    it('does not render season list when empty', () => {
      fixture.componentRef.setInput('completeness', []);
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.season-completeness__list');
      expect(list).toBeNull();
    });
  });

  describe('with completeness data', () => {
    const seasons = [
      makeSeason({ seasonNumber: 1, ownedCount: 8, totalExpected: 10, isComplete: false }),
      makeSeason({
        seasonNumber: 2,
        seasonName: 'Season 2',
        ownedCount: 8,
        totalExpected: 8,
        missingEpisodeNumbers: [],
        isComplete: true,
      }),
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('completeness', seasons);
      fixture.detectChanges();
    });

    it('renders the season list', () => {
      const list = fixture.nativeElement.querySelector('.season-completeness__list');
      expect(list).toBeTruthy();
    });

    it('renders one item per season', () => {
      const items = fixture.nativeElement.querySelectorAll('.season-completeness__item');
      expect(items.length).toBe(2);
    });

    it('marks complete season with --complete modifier class', () => {
      const items = fixture.nativeElement.querySelectorAll('.season-completeness__item');
      expect(items[1].classList.contains('season-completeness__item--complete')).toBe(true);
    });

    it('does not mark incomplete season with --complete modifier class', () => {
      const items = fixture.nativeElement.querySelectorAll('.season-completeness__item');
      expect(items[0].classList.contains('season-completeness__item--complete')).toBe(false);
    });

    it('shows missing episode row for incomplete season', () => {
      const missing = fixture.nativeElement.querySelectorAll('.season-completeness__missing');
      expect(missing.length).toBeGreaterThan(0);
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('completeness', []);
      fixture.detectChanges();
      const loading = fixture.nativeElement.querySelector('.season-completeness__loading');
      expect(loading).toBeTruthy();
    });

    it('does not show list when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('completeness', [makeSeason()]);
      fixture.detectChanges();
      const list = fixture.nativeElement.querySelector('.season-completeness__list');
      expect(list).toBeNull();
    });
  });
});
