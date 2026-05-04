export interface RenamePreview {
  fileId: string;
  currentPath: string;
  proposedPath: string;
}

export interface RenameResult {
  fileId: string;
  previousPath: string;
  newPath: string;
  renamedAt: string;
}

export interface BatchRenamePreview {
  groupId: string;
  showName: string;
  previews: RenamePreview[];
}

export interface BatchRenameResult {
  groupId: string;
  showName: string;
  results: RenameResult[];
  failed: Array<{ fileId: string; error: string }>;
}
