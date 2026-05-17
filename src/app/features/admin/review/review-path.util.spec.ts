import { deriveRootParentFolder } from './review-path.util';
import { ReviewItem } from '@shared/models/review.model';
import { ReviewReason, ReviewStatus } from '@shared/models/enums';

function makeItem(filePath: string, status: ReviewStatus = ReviewStatus.Open): ReviewItem {
  return {
    id: filePath,
    filePath,
    parsedTitle: null,
    parsedYear: null,
    parsedSeason: null,
    parsedEpisode: null,
    reason: ReviewReason.NoTmdbResult,
    status,
    candidates: [],
    resolvedTmdbId: null,
    resolvedKind: null,
    resolvedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
  };
}

describe('deriveRootParentFolder()', () => {
  it('returns immediate parent when no sibling items exist', () => {
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', []);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('returns immediate parent when no open sibling items exist (all resolved)', () => {
    const items = [makeItem('/nas/tv/ShowName/Season 2/ep01.mkv', ReviewStatus.Resolved)];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('returns LCA (show folder) when siblings exist across different seasons', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 2/ep01.mkv'),
    ];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep02.mkv', items);
    expect(result).toBe('/nas/tv/ShowName');
  });

  it('returns LCA (season folder) when siblings are only in the same season', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep02.mkv'),
      makeItem('/nas/tv/ShowName/Season 1/ep03.mkv'),
    ];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('does not include the current item in sibling count', () => {
    const itemPath = '/nas/tv/ShowName/Season 1/ep01.mkv';
    const items = [makeItem(itemPath)]; // same path = current item (excluded)
    const result = deriveRootParentFolder(itemPath, items);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('returns show folder when siblings span multiple seasons', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 1/ep02.mkv'),
      makeItem('/nas/tv/ShowName/Season 2/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 3/ep01.mkv'),
    ];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep03.mkv', items);
    expect(result).toBe('/nas/tv/ShowName');
  });

  it('does not go above the NAS root when siblings are from different shows', () => {
    const items = [makeItem('/nas/tv/OtherShow/Season 1/ep01.mkv')];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    // LCA = /nas/tv (3 parts) — below minimum depth → uses fallback (one level up from immParent)
    expect(result).not.toBe('/nas/tv');
    expect(result).toBe('/nas/tv/ShowName');
  });

  it('handles deeply nested episode-subfolder structure and finds franchise folder', () => {
    // Structure: /NAS 1/Séries/Law and Order/SVU/S08/EpisodeFolder/file
    // Siblings from other seasons of the same spinoff → LCA should be the spinoff (SVU)
    const items = [
      makeItem('/NAS 1/Séries/Law and Order/SVU/S07/Law and Order SVU S07E01/file.avi'),
      makeItem('/NAS 1/Séries/Law and Order/SVU/S07/Law and Order SVU S07E02/file.avi'),
      makeItem('/NAS 1/Séries/Law and Order/SVU/S09/Law and Order SVU S09E01/file.avi'),
    ];
    const current = '/NAS 1/Séries/Law and Order/SVU/S08/Law and Order SVU S08E22/file.avi';
    const result = deriveRootParentFolder(current, items);
    expect(result).toBe('/NAS 1/Séries/Law and Order/SVU');
  });

  it('climbs to franchise level when siblings include different spinoffs', () => {
    // Structure: /NAS 1/Séries/Law and Order/{Spinoff}/Season/EpFolder/file
    // Siblings from multiple spinoffs → LCA = /NAS 1/Séries/Law and Order
    const items = [
      makeItem('/NAS 1/Séries/Law and Order/SVU/S07/S07E01_Folder/file.avi'),
      makeItem('/NAS 1/Séries/Law and Order/CI/S04/S04E01_Folder/file.avi'),
    ];
    const current = '/NAS 1/Séries/Law and Order/SVU/S08/S08E22_Folder/file.avi';
    const result = deriveRootParentFolder(current, items);
    expect(result).toBe('/NAS 1/Séries/Law and Order');
  });
});
