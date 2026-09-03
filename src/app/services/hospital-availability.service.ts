import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HospitalAvailabilitySlot {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface HospitalAvailabilityResponse {
  acceptsBookings: boolean;
  version: number;
  slots: HospitalAvailabilitySlot[];
}

@Injectable({ providedIn: 'root' })
export class HospitalAvailabilityService {
  private apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listMine(): Observable<{ success: boolean; data: HospitalAvailabilityResponse }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilityResponse }>(
      `${this.apiBase}/hospital/availability`
    );
  }

  replaceMine(slots: HospitalAvailabilitySlot[], expectedVersion: number): Observable<{ success: boolean; data: HospitalAvailabilityResponse }> {
    return this.http.put<{ success: boolean; data: HospitalAvailabilityResponse }>(
      `${this.apiBase}/hospital/availability`,
      { availability: slots, expectedVersion }
    );
  }

  setAcceptsBookings(acceptsBookings: boolean, expectedVersion: number): Observable<{ success: boolean; data: { acceptsBookings: boolean; version: number } }> {
    return this.http.patch<{ success: boolean; data: { acceptsBookings: boolean; version: number } }>(
      `${this.apiBase}/hospital/accepts-bookings`,
      { acceptsBookings, expectedVersion }
    );
  }

  listPublic(hospitalProfileId: number): Observable<{ success: boolean; data: HospitalAvailabilityResponse }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilityResponse }>(
      `${this.apiBase}/hospitals/${hospitalProfileId}/availability`
    );
  }
}
