import { ReviewItem } from '@shared/models/review.model';
import { ReviewStatus } from '@shared/models/enums';

/**
 * Derives the best parent folder path to use as the scope for a bulk operation.
 *
 * Rules:
 * 1. If no open siblings → return immediate parent (e.g. /nas/tv/Show/Season 1).
 * 2. Compute the "show folder" = one level above the immediate parent.
 * 3. Filter siblings to only those that live inside that show folder.
 * 4. If no related siblings are found (all are from other shows) → return the show folder.
 * 5. If all related siblings are in the same sub-folder as the current file → return immediate parent.
 * 6. Otherwise (siblings span multiple sub-folders, e.g. different seasons) → return show folder.
 *
 * @param filePath - The file path of the current review item.
 * @param items    - All review items used to find open siblings.
 * @returns The parent folder path to use as the bulk-resolve scope.
 */
export function deriveRootParentFolder(filePath: string, items: ReviewItem[]): string {
  const openSiblings = items.filter(
    (it) => it.status === ReviewStatus.Open && it.filePath !== filePath,
  );

  const parts = filePath.split('/');
  parts.pop(); // remove filename
  const immParent = parts.join('/'); // e.g. /nas/tv/ShowName/Season 1

  // No open siblings → immediate parent is the right scope
  if (openSiblings.length === 0) {
    return immParent;
  }

  // Show-level folder: one level above the immediate parent
  const showFolderParts = parts.slice(0, -1);
  const showFolder = showFolderParts.join('/'); // e.g. /nas/tv/ShowName

  if (!showFolder) {
    return immParent;
  }

  // Only keep siblings that live inside the same show folder
  const showFolderPrefix = showFolder + '/';
  const relatedSiblings = openSiblings.filter((it) => it.filePath.startsWith(showFolderPrefix));

  // No related siblings (all aliens from other shows) → default to show folder
  if (relatedSiblings.length === 0) {
    return showFolder;
  }

  // Check if every related sibling is in the same immediate sub-folder as the current file
  const currentSubFolder = parts[showFolderParts.length]; // e.g. 'Season 1'
  const allInSameSubFolder = relatedSiblings.every((it) => {
    const sibParts = it.filePath.split('/');
    return sibParts[showFolderParts.length] === currentSubFolder;
  });

  // All in the same sub-folder (e.g. same season) → season scope is enough
  if (allInSameSubFolder) {
    return immParent;
  }

  // Siblings span multiple sub-folders (e.g. different seasons) → use show folder
  return showFolder;
}
