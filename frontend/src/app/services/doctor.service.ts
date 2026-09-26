import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Doctor } from '../models/doctor.model';
import { environment } from '../../environments/environment';

export interface PatientSnapshotAllergy {
  id: number;
  name: string;
  severity: string | null;
  reaction: string | null;
  status: 'active' | 'resolved';
  diagnosedDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
}

export interface PatientSnapshotCondition {
  id: number;
  name: string;
  severity: string | null;
  status: 'active' | 'resolved' | 'chronic';
  diagnosedDate: string | null;
  resolvedDate: string | null;
  notes: string | null;
}

export interface PatientSnapshotVisit {
  id: number;
  bookingNumber: string | null;
  date: string;
  time: string | null;
  reason: string | null;
  status: string;
  paymentStatus: string | null;
  netCostAfterCashback: number | null;
  createdAt: string;
}

export interface PatientSnapshot {
  patient: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    age: number | null;
    bloodGroup: string | null;
    height: number | null;
    weight: number | null;
    emergencyContact: {
      name: string;
      phone: string | null;
      relation: string | null;
    } | null;
  };
  allergies: PatientSnapshotAllergy[];
  medicalConditions: PatientSnapshotCondition[];
  appointmentHistory: PatientSnapshotVisit[];
}

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;
  private doctorApiBase = `${environment.apiUrl}/doctor`;

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
  }

  getDoctorById(id: number): Observable<Doctor | undefined> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
    // return of(this.mockDoctors.find(d => d.id === id));
  }

  searchDoctors(query: string, type: string = 'all'): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/search`, {
      params: {
        q: query,
        type: type
      }
    });
  }

  getPatientSnapshot(patientUserId: number): Observable<{ success: boolean; data: PatientSnapshot }> {
    return this.http.get<{ success: boolean; data: PatientSnapshot }>(
      `${this.doctorApiBase}/patients/${patientUserId}/snapshot`
    );
  }

}