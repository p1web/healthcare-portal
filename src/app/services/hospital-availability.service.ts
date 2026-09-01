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

@Injectable({ providedIn: 'root' })
export class HospitalAvailabilityService {
  private apiBase = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listMine(): Observable<{ success: boolean; data: HospitalAvailabilitySlot[] }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilitySlot[] }>(
      `${this.apiBase}/hospital/availability`
    );
  }

  replaceMine(slots: HospitalAvailabilitySlot[]): Observable<{ success: boolean; data: HospitalAvailabilitySlot[] }> {
    return this.http.put<{ success: boolean; data: HospitalAvailabilitySlot[] }>(
      `${this.apiBase}/hospital/availability`,
      { availability: slots }
    );
  }

  listPublic(hospitalProfileId: number): Observable<{ success: boolean; data: HospitalAvailabilitySlot[] }> {
    return this.http.get<{ success: boolean; data: HospitalAvailabilitySlot[] }>(
      `${this.apiBase}/hospitals/${hospitalProfileId}/availability`
    );
  }
}
