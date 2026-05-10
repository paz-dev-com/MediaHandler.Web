export type ParentFolderStatus = 'NotAssigned' | 'Assigned' | 'InCollection';

export interface ParentFolderGroup {
  id: string;
  folderPath: string;
  detectedShowName: string;
  episodeCount: number;
  status: ParentFolderStatus;
  tmdbId?: number;
  tmdbTitle?: string;
  tmdbPosterPath?: string;
  firstSeenAt: string;
}
