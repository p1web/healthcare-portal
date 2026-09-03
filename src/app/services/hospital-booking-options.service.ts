import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BookingAvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface BookingDoctor {
  id: number;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  avatarUrl: string | null;
  effectiveConsultationFee: number;
  availability: BookingAvailabilitySlot[];
}

export interface BookingDepartment {
  id: number;
  name: string;
  description: string | null;
  doctors: BookingDoctor[];
}

export interface HospitalBookingOptions {
  hospitalId: number;
  hospitalName: string;
  acceptsBookings: boolean;
  consultationFeeMode: 'STANDARD' | 'PER_DOCTOR';
  defaultConsultationFee: number;
  departments: BookingDepartment[];
}

@Injectable({ providedIn: 'root' })
export class HospitalBookingOptionsService {
  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBookingOptions(hospitalId: number): Observable<{ success: boolean; data: HospitalBookingOptions }> {
    return this.http.get<{ success: boolean; data: HospitalBookingOptions }>(
      `${this.apiBase}/hospitals/${hospitalId}/booking-options`
    );
  }
}
