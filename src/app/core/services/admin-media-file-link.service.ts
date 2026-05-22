import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/api/api.service';
import { ApiResponse } from '@core/api/api-response.model';
import { UnlinkedFile } from '@shared/models/media.model';

@Injectable({ providedIn: 'root' })
export class AdminMediaFileLinkService {
  private readonly api = inject(ApiService);

  /**
   * T015: GET /api/v1/admin/media/unlinked-files — paginated list of unlinked MediaFile rows.
   */
  getUnlinkedFiles(
    page: number = 1,
    pageSize: number = 20,
  ): Observable<ApiResponse<UnlinkedFile[]>> {
    return this.api.get<UnlinkedFile[]>('admin/media/unlinked-files', { page, pageSize });
  }

  /**
   * T015: PUT /api/v1/admin/media/{mediaId}/files/{fileId}/link — set MediaFile.MediaId = mediaId.
   */
  linkFile(mediaId: string, fileId: string): Observable<ApiResponse<void>> {
    return this.api.put<void>(`admin/media/${mediaId}/files/${fileId}/link`, null);
  }

  /**
   * T015: DELETE /api/v1/admin/media/{mediaId}/files/{fileId}/link — clear MediaFile.MediaId.
   */
  unlinkFile(mediaId: string, fileId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`admin/media/${mediaId}/files/${fileId}/link`);
  }

  /**
   * T025: PATCH /api/v1/admin/media/{mediaId}/root-folder — set or clear the manual root folder override.
   */
  updateRootFolder(mediaId: string, rootFolder: string | null): Observable<ApiResponse<void>> {
    return this.api.patch<void>(`admin/media/${mediaId}/root-folder`, { rootFolder });
  }
}
