import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PatientAllergy, PatientMedicalCondition } from '../models/patient-medical-record.model';
import { environment } from '../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PatientMedicalRecordService {

  private apiUrl = `${environment.apiUrl}/patient`;

  constructor(private http: HttpClient) {}

  getAllergies(): Observable<ApiResponse<PatientAllergy[]>> {
    return this.http.get<ApiResponse<PatientAllergy[]>>(`${this.apiUrl}/allergies`);
  }

  addAllergy(payload: Partial<PatientAllergy>): Observable<ApiResponse<PatientAllergy>> {
    return this.http.post<ApiResponse<PatientAllergy>>(`${this.apiUrl}/allergies`, payload);
  }

  updateAllergy(id: number, payload: Partial<PatientAllergy>): Observable<ApiResponse<PatientAllergy>> {
    return this.http.patch<ApiResponse<PatientAllergy>>(`${this.apiUrl}/allergies/${id}`, payload);
  }

  deleteAllergy(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/allergies/${id}`);
  }

  getMedicalConditions(): Observable<ApiResponse<PatientMedicalCondition[]>> {
    return this.http.get<ApiResponse<PatientMedicalCondition[]>>(`${this.apiUrl}/medical-conditions`);
  }

  addMedicalCondition(payload: Partial<PatientMedicalCondition>): Observable<ApiResponse<PatientMedicalCondition>> {
    return this.http.post<ApiResponse<PatientMedicalCondition>>(`${this.apiUrl}/medical-conditions`, payload);
  }

  updateMedicalCondition(id: number, payload: Partial<PatientMedicalCondition>): Observable<ApiResponse<PatientMedicalCondition>> {
    return this.http.patch<ApiResponse<PatientMedicalCondition>>(`${this.apiUrl}/medical-conditions/${id}`, payload);
  }

  deleteMedicalCondition(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/medical-conditions/${id}`);
  }
}
