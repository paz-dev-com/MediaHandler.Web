import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from './api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${path}`, { params: httpParams });
  }

  post<T>(
    path: string,
    body: unknown,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${path}`, body, { params: httpParams });
  }

  put<T>(
    path: string,
    body: unknown,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, String(value));
        }
      }
    }
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${path}`, body, { params: httpParams });
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${path}`);
  }
}
