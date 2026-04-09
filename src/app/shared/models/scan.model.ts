export interface ScanNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
  foldersFound: number;
}

export interface ScanAndImportNasResult {
  newFiles: number;
  existingFiles: number;
  totalScanned: number;
  foldersFound: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}

export interface AutoImportResult {
  totalUnlinked: number;
  matched: number;
  skipped: number;
  failed: number;
  errors: string[];
}

