import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HospitalAvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface HospitalAvailabilityResponse {
  acceptsBookings: boolean;
  slots: HospitalAvailabilitySlot[];
}

@Injectable({ providedIn: 'root' })
export class HospitalAvailabilityService {
  private apiBase = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listMine(): Observable<{ success: boolean; data: HospitalAvailabilityResponse }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilityResponse }>(
      `${this.apiBase}/hospital/availability`
    );
  }

  replaceMine(slots: HospitalAvailabilitySlot[]): Observable<{ success: boolean; data: HospitalAvailabilitySlot[] }> {
    return this.http.put<{ success: boolean; data: HospitalAvailabilitySlot[] }>(
      `${this.apiBase}/hospital/availability`,
      { availability: slots }
    );
  }

  setAcceptsBookings(acceptsBookings: boolean): Observable<{ success: boolean; data: { acceptsBookings: boolean } }> {
    return this.http.patch<{ success: boolean; data: { acceptsBookings: boolean } }>(
      `${this.apiBase}/hospital/accepts-bookings`,
      { acceptsBookings }
    );
  }

  listPublic(hospitalProfileId: number): Observable<{ success: boolean; data: HospitalAvailabilityResponse }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilityResponse }>(
      `${this.apiBase}/hospitals/${hospitalProfileId}/availability`
    );
  }
}
