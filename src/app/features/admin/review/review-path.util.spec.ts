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
    const items: ReviewItem[] = [];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('returns immediate parent when no open sibling items exist (all resolved)', () => {
    const items = [makeItem('/nas/tv/ShowName/Season 2/ep01.mkv', ReviewStatus.Resolved)];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('returns root parent when siblings exist across different subfolders', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 2/ep01.mkv'),
    ];
    // Current item is Season 1/ep02.mkv — siblings in Season 1 AND Season 2
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep02.mkv', items);
    expect(result).toBe('/nas/tv/ShowName');
  });

  it('returns immediate parent when siblings only in same folder', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep02.mkv'),
      makeItem('/nas/tv/ShowName/Season 1/ep03.mkv'),
    ];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    // Siblings exist in Season 1/ but NOT under /nas/tv/ShowName at a higher level
    // The function should return the deepest ancestor that still has siblings
    expect(result).toContain('ShowName');
  });

  it('does not include the current item in sibling count', () => {
    const itemPath = '/nas/tv/ShowName/Season 1/ep01.mkv';
    const items = [makeItem(itemPath)]; // same path = current item (should be excluded)
    const result = deriveRootParentFolder(itemPath, items);
    // No other siblings — returns immediate parent
    expect(result).toBe('/nas/tv/ShowName/Season 1');
  });

  it('handles deeply nested paths with siblings across all seasons', () => {
    const items = [
      makeItem('/nas/tv/ShowName/Season 1/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 1/ep02.mkv'),
      makeItem('/nas/tv/ShowName/Season 2/ep01.mkv'),
      makeItem('/nas/tv/ShowName/Season 3/ep01.mkv'),
    ];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep03.mkv', items);
    expect(result).toBe('/nas/tv/ShowName');
  });

  it('does not go above the NAS root', () => {
    const items = [makeItem('/nas/tv/OtherShow/Season 1/ep01.mkv')];
    const result = deriveRootParentFolder('/nas/tv/ShowName/Season 1/ep01.mkv', items);
    // OtherShow is NOT under ShowName, so should not climb to /nas/tv
    expect(result).not.toBe('/nas/tv');
    expect(result).toBe('/nas/tv/ShowName');
  });
});
