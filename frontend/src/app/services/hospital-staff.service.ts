import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HospitalStaffMember {
  id: number;
  hospitalProfileId: number;
  departmentId: number | null;
  department: { id: number; name: string; isActive: boolean } | null;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  consultationFee: number | null;
  effectiveConsultationFee: number | null;
  isBookable: boolean;
  isActive: boolean;
  availability: HospitalStaffAvailability[];
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface HospitalStaffAvailability {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface HospitalStaffListResponse {
  success: boolean;
  data: HospitalStaffMember[];
  pricing: {
    consultationFeeMode: 'STANDARD' | 'PER_DOCTOR';
    defaultConsultationFee: number;
  };
}

export type HospitalStaffPayload = Omit<
  Partial<HospitalStaffMember>,
  'id' | 'hospitalProfileId' | 'createdAt' | 'updatedAt'
>;

@Injectable({ providedIn: 'root' })
export class HospitalStaffService {
  private apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listMine(): Observable<HospitalStaffListResponse> {
    return this.http.get<HospitalStaffListResponse>(
      `${this.apiBase}/hospital/staff`
    );
  }

  listPublic(hospitalProfileId: number): Observable<{ success: boolean; data: HospitalStaffMember[] }> {
    return this.http.get<{ success: boolean; data: HospitalStaffMember[] }>(
      `${this.apiBase}/hospitals/${hospitalProfileId}/staff`
    );
  }

  create(body: HospitalStaffPayload): Observable<{ success: boolean; data: HospitalStaffMember }> {
    return this.http.post<{ success: boolean; data: HospitalStaffMember }>(
      `${this.apiBase}/hospital/staff`, body
    );
  }

  update(id: number, body: HospitalStaffPayload): Observable<{ success: boolean; data: HospitalStaffMember }> {
    return this.http.put<{ success: boolean; data: HospitalStaffMember }>(
      `${this.apiBase}/hospital/staff/${id}`, body
    );
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiBase}/hospital/staff/${id}`
    );
  }
}
