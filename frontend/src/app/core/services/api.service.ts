import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private url(path: string) { return `${environment.apiUrl}/${path}`; }

  get<T>(path: string, params?: Record<string, any>) {
    let httpParams = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') httpParams = httpParams.set(k, String(v)); });
    return this.http.get<T>(this.url(path), { params: httpParams });
  }

  post<T>(path: string, body: any) { return this.http.post<T>(this.url(path), body); }
  put<T>(path: string, body: any) { return this.http.put<T>(this.url(path), body); }
  patch<T>(path: string, body: any) { return this.http.patch<T>(this.url(path), body); }
  delete<T>(path: string) { return this.http.delete<T>(this.url(path)); }
}
