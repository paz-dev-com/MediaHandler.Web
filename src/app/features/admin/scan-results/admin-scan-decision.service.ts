import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '@core/api/api.service';
import { PaginationMeta } from '@core/api/api-response.model';
import {
  ScanDecisionShowGroup,
  ScanItemDecision,
  TvShowGroup,
} from '@shared/models/scan-decision.model';
import {
  RenamePreview,
  RenameResult,
  BatchRenamePreview,
  BatchRenameResult,
} from '@shared/models/rename.model';
import { MediaType, ScanDecisionType } from '@shared/models/enums';

export interface ScanDecisionMeta {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminScanDecisionService {
  private readonly api = inject(ApiService);

  readonly decisions = signal<ScanItemDecision[]>([]);
  readonly groupedDecisions = signal<ScanDecisionShowGroup[]>([]);
  readonly tvGroups = signal<TvShowGroup[]>([]);
  readonly loading = signal<boolean>(false);
  readonly meta = signal<ScanDecisionMeta>({ page: 1, pageSize: 20, total: 0 });

  private currentScanId = '';
  private currentDecisionType: ScanDecisionType | undefined;
  private currentMediaType: MediaType | undefined;
  private currentLibraryRootId: string | undefined;
  private currentPage = 1;
  private currentPageSize = 20;
  private currentSortField: string | undefined;
  private currentSortOrder: 'asc' | 'desc' | undefined;
  private currentFileName: string | undefined;

  getDecisions(
    scanId: string,
    decisionType?: ScanDecisionType,
    mediaType?: MediaType,
    libraryRootId?: string,
    page = 1,
    pageSize = 20,
    sortField?: string,
    sortOrder?: 'asc' | 'desc',
    fileName?: string,
  ): void {
    this.currentScanId = scanId;
    this.currentDecisionType = decisionType;
    this.currentMediaType = mediaType;
    this.currentLibraryRootId = libraryRootId;
    this.currentPage = page;
    this.currentPageSize = pageSize;
    this.currentSortField = sortField;
    this.currentSortOrder = sortOrder;
    this.currentFileName = fileName;

    this.loading.set(true);

    const params: Record<string, string | number | null | undefined> = { page, pageSize };
    if (decisionType !== undefined) params['decisionType'] = decisionType;
    if (mediaType !== undefined) params['mediaType'] = mediaType;
    if (libraryRootId !== undefined) params['libraryRootId'] = libraryRootId;
    if (sortField) params['sortField'] = sortField;
    if (sortOrder) params['sortOrder'] = sortOrder;
    if (fileName) params['fileName'] = fileName;

    this.api.get<ScanItemDecision[]>(`admin/scan/${scanId}/decisions`, params).subscribe({
      next: (response) => {
        this.decisions.set(response.data ?? []);
        const apiMeta = response.meta as PaginationMeta | null;
        if (apiMeta) {
          this.meta.set({
            page: apiMeta.page,
            pageSize: apiMeta.pageSize,
            total: apiMeta.totalCount,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  reassign(decisionId: string, tmdbId: number, mediaType: MediaType): Observable<ScanItemDecision> {
    return this.api
      .put<ScanItemDecision>(`admin/scan-decisions/${decisionId}/reassign`, {
        tmdbId,
        kind: mediaType,
      })
      .pipe(map((response) => response.data));
  }

  getTvGroups(scanId: string): void {
    this.api.get<TvShowGroup[]>('admin/scan-decisions/tv-groups', { scanId }).subscribe({
      next: (response) => {
        this.tvGroups.set(response.data ?? []);
      },
    });
  }

  assignTvGroup(groupId: string, tmdbId: number, scanId: string): Observable<TvShowGroup> {
    return this.api
      .put<TvShowGroup>(`admin/tv-groups/${groupId}/assign`, { tmdbId }, { scanId })
      .pipe(map((response) => response.data));
  }

  renameFile(fileId: string, preview = false): Observable<RenamePreview | RenameResult> {
    return this.api
      .post<RenamePreview | RenameResult>(`admin/files/${fileId}/rename`, null, { preview })
      .pipe(map((response) => response.data));
  }

  renameTvGroup(
    groupId: string,
    preview = false,
  ): Observable<BatchRenamePreview | BatchRenameResult> {
    return this.api
      .post<
        BatchRenamePreview | BatchRenameResult
      >(`admin/tv-groups/${groupId}/rename`, null, { preview })
      .pipe(map((response) => response.data));
  }

  /** Assigns all decisions in an ad-hoc group to the same TMDB entry by calling reassign for each. */
  assignGroupDecisions(
    decisions: ScanItemDecision[],
    tmdbId: number,
    kind: MediaType,
  ): Observable<void> {
    const calls = decisions.map((d) => this.reassign(d.id, tmdbId, kind));
    return forkJoin(calls).pipe(map(() => void 0));
  }

  refreshDecisions(): void {
    if (this.currentScanId) {
      this.getDecisions(
        this.currentScanId,
        this.currentDecisionType,
        this.currentMediaType,
        this.currentLibraryRootId,
        this.currentPage,
        this.currentPageSize,
        this.currentSortField,
        this.currentSortOrder,
        this.currentFileName,
      );
    }
  }

  getGroupedDecisions(
    scanId: string,
    decisionType?: ScanDecisionType,
    mediaType?: MediaType,
    libraryRootId?: string,
  ): void {
    this.loading.set(true);
    const params: Record<string, string | number | null | undefined> = {};
    if (decisionType !== undefined) params['decisionType'] = decisionType;
    if (mediaType !== undefined) params['mediaType'] = mediaType;
    if (libraryRootId !== undefined) params['libraryRootId'] = libraryRootId;

    this.api
      .get<ScanDecisionShowGroup[]>(`admin/scan/${scanId}/decisions/grouped`, params)
      .subscribe({
        next: (response) => {
          this.groupedDecisions.set(response.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
