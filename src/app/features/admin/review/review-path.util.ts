import { ReviewItem } from '@shared/models/review.model';
import { ReviewStatus } from '@shared/models/enums';

/**
 * Returns the immediate parent folder of a file path (removes the filename).
 */
function immParentOf(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Derives the best parent folder path to use as the scope for a bulk operation.
 *
 * Algorithm — Lowest Common Ancestor (LCA):
 * 1. Collect all open siblings (other Open items in the current list).
 * 2. For each sibling, compute the LCA of its immediate parent with the accumulator.
 * 3. Apply a minimum-depth guard: if the LCA would be shallower than 4 path parts
 *    (e.g. /nas/share/folder), fall back to one level above the current file's
 *    immediate parent so unrelated shows never pull the scope up to the NAS root.
 *
 * This correctly handles deeply nested structures such as:
 *   /NAS/Séries/Franchise/Spinoff/Season/EpisodeFolder/file
 * where siblings from different seasons or spinoffs (all visible in the current page)
 * cause the LCA to climb to the franchise level rather than stopping at the season.
 *
 * @param filePath - The file path of the current review item.
 * @param items    - All review items used to find open siblings.
 * @returns The parent folder path to use as the bulk-resolve scope.
 */
export function deriveRootParentFolder(filePath: string, items: ReviewItem[]): string {
  const openSiblings = items.filter(
    (it) => it.status === ReviewStatus.Open && it.filePath !== filePath,
  );

  const currentParent = immParentOf(filePath);

  if (openSiblings.length === 0) {
    return currentParent;
  }

  // Compute the LCA of the current file's parent with every open sibling's parent.
  // Starting value is the current file's immediate parent (most specific scope).
  let lcaParts = currentParent.split('/');

  for (const sibling of openSiblings) {
    const sibParts = immParentOf(sibling.filePath).split('/');
    const minLen = Math.min(lcaParts.length, sibParts.length);
    let i = 0;
    while (i < minLen && lcaParts[i] === sibParts[i]) {
      i++;
    }
    lcaParts = lcaParts.slice(0, i);
  }

  // Guard: the LCA must be at least 4 path parts deep to avoid selecting a NAS
  // share or drive root as the scope.
  // Parts: ['', 'NAS 1', 'Séries', 'Franchise'] → length 4 is the minimum allowed.
  // If the LCA is too shallow (siblings are from completely different trees),
  // fall back to one level above the current file's immediate parent.
  if (lcaParts.length < 4) {
    const currentParts = currentParent.split('/');
    return currentParts.length > 2 ? currentParts.slice(0, -1).join('/') : currentParent;
  }

  return lcaParts.join('/');
}
