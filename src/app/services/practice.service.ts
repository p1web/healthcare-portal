import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PracticeHospital {
  id: number;
  hospitalName: string;
  hospitalKind: 'solo_practice' | 'multi_doctor';
  hospitalCity: string | null;
  hospitalState: string | null;
  hospitalCommissionPercent?: number;
}

export interface PracticeDoctor {
  id: number;
  registrationNumber: string | null;
  qualification: string | null;
  user: { id: number; name: string } | null;
  specialization: { id: number; name: string } | null;
}

export interface Practice {
  id: number;
  doctorProfileId: number;
  hospitalProfileId: number;
  consultationFee: number;
  isPrimary: boolean;
  isActive: boolean;
  status: 'pending_hospital_approval' | 'active' | 'rejected' | 'inactive';
  platformCommissionPercent: number;
  notes: string | null;
  hospital: PracticeHospital | null;
  doctor?: PracticeDoctor | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePracticeRequest {
  hospitalProfileId: number;
  consultationFee: number;
  notes?: string;
}

export interface CreateSoloClinicRequest {
  hospitalName: string;
  consultationFee: number;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalAddress?: string;
  hospitalCity?: string;
  hospitalState?: string;
  hospitalPincode?: string;
}

@Injectable({ providedIn: 'root' })
export class PracticeService {
  private apiBase = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listForDoctor(doctorProfileId: number): Observable<{ success: boolean; data: Practice[] }> {
    return this.http.get<{ success: boolean; data: Practice[] }>(
      `${this.apiBase}/doctors/${doctorProfileId}/practices`
    );
  }

  listMine(): Observable<{ success: boolean; data: Practice[] }> {
    return this.http.get<{ success: boolean; data: Practice[] }>(`${this.apiBase}/doctor/practices`);
  }

  create(body: CreatePracticeRequest): Observable<{ success: boolean; data: Practice }> {
    return this.http.post<{ success: boolean; data: Practice }>(`${this.apiBase}/doctor/practices`, body);
  }

  createSoloClinic(body: CreateSoloClinicRequest): Observable<{ success: boolean; data: Practice }> {
    return this.http.post<{ success: boolean; data: Practice }>(`${this.apiBase}/doctor/solo-clinic`, body);
  }

  update(id: number, body: Partial<CreatePracticeRequest & { isPrimary: boolean }>): Observable<{ success: boolean; data: Practice }> {
    return this.http.put<{ success: boolean; data: Practice }>(`${this.apiBase}/doctor/practices/${id}`, body);
  }

  deactivate(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiBase}/doctor/practices/${id}`);
  }

  listHospitalPractices(status?: string): Observable<{ success: boolean; data: Practice[] }> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<{ success: boolean; data: Practice[] }>(
      `${this.apiBase}/hospital/practices`,
      { params }
    );
  }

  reviewPractice(id: number, action: 'approve' | 'reject', reason?: string): Observable<{ success: boolean; data: Practice }> {
    return this.http.patch<{ success: boolean; data: Practice }>(
      `${this.apiBase}/hospital/practices/${id}/review`,
      { action, reason }
    );
  }

  getHospitalSummary(): Observable<{ success: boolean; data: HospitalSummary }> {
    return this.http.get<{ success: boolean; data: HospitalSummary }>(`${this.apiBase}/hospital/summary`);
  }

  getMyPracticeAvailability(practiceId: number): Observable<{ success: boolean; data: PracticeAvailabilitySlot[] }> {
    return this.http.get<{ success: boolean; data: PracticeAvailabilitySlot[] }>(
      `${this.apiBase}/doctor/practices/${practiceId}/availability`
    );
  }

  replaceMyPracticeAvailability(practiceId: number, slots: PracticeAvailabilitySlot[]): Observable<{ success: boolean; data: PracticeAvailabilitySlot[] }> {
    return this.http.put<{ success: boolean; data: PracticeAvailabilitySlot[] }>(
      `${this.apiBase}/doctor/practices/${practiceId}/availability`,
      { availability: slots }
    );
  }

  getPublicPracticeAvailability(practiceId: number): Observable<{ success: boolean; data: PracticeAvailabilitySlot[] }> {
    return this.http.get<{ success: boolean; data: PracticeAvailabilitySlot[] }>(
      `${this.apiBase}/practices/${practiceId}/availability`
    );
  }
}

export interface PracticeAvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface HospitalSummary {
  totals: {
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    grossRevenue: number;
    platformCommissionCharged: number;
    doctorPayout: number;
  };
  perDoctor: {
    doctorProfileId: number;
    doctorName: string;
    appointmentCount: number;
    commissionCharged: number;
  }[];
}
