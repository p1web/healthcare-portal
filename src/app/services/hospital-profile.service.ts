import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HospitalProfileService {

  private apiUrl = 'http://localhost:3000/api/hospital/profile';

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
    return this.http.patch('http://localhost:3000/api/hospital/consultation-fee', {
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
}
