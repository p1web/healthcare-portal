import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type ImageUploadFlag = 'doctor-avatar' | 'staff-avatar';

interface ImageUploadResponse {
  success?: boolean;
  data?: { url?: string; profileImage?: string } | null;
  [key: string]: any;
}

/**
 * Small helper to POST an image file to any authenticated endpoint that
 * accepts `multipart/form-data` with an `image` field and returns
 * `{ data: { url } }` (or `{ data: { profileImage } }` for the doctor avatar).
 * The exact endpoint is selected by the `flag` argument so callers stay decoupled.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly endpoints: Record<ImageUploadFlag, string> = {
    'doctor-avatar': 'http://localhost:3000/api/doctor/profile/avatar',
    'staff-avatar': 'http://localhost:3000/api/hospital/staff-avatar'
  };

  constructor(private http: HttpClient) {}

  upload(flag: ImageUploadFlag, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<ImageUploadResponse>(this.endpoints[flag], formData).pipe(
      map(res => ({ url: res?.data?.url ?? res?.data?.profileImage ?? '' }))
    );
  }
}
