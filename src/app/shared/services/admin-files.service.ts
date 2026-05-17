import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/api/api.service';

@Injectable({ providedIn: 'root' })
export class AdminFilesService {
  private readonly api = inject(ApiService);

  /**
   * Fetches available root folder locations from the API.
   * Used by the Add Library Root dialog to provide a root folder dropdown.
   */
  getLocations(): Observable<string[]> {
    return this.api.get<string[]>('files/locations').pipe(map((resp) => resp.data ?? []));
  }
}
