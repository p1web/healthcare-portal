import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type HospitalImageSlot = 'logo' | 'banner';

@Injectable({
  providedIn: 'root'
})
export class HospitalProfileService {

  private apiUrl = `${environment.apiUrl}/hospital/profile`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(this.apiUrl, data);
  }

  updateConsultationPricing(
    consultationFeeMode: 'STANDARD' | 'PER_DOCTOR',
    defaultConsultationFee: number
  ): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/hospital/consultation-fee`, {
      consultationFeeMode,
      defaultConsultationFee
    });
  }

  uploadDocuments(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    return this.http.post(`${this.apiUrl}/documents`, formData);
  }

  submitForReview(): Observable<any> {
    return this.http.post(`${this.apiUrl}/submit`, {});
  }

  uploadPublicImage(slot: HospitalImageSlot, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/${slot}-image`, formData);
  }

  removePublicImage(slot: HospitalImageSlot): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${slot}-image`);
  }

  setPublicImagePublished(slot: HospitalImageSlot, published: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${slot}-image/publish`, { published });
  }
}
