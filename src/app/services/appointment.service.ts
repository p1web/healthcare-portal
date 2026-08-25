import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, AppointmentHistory, DoctorAppointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/api/appointments';

  constructor(private http: HttpClient) {}

  bookAppointment(appointment: Appointment): Observable<any> {
    return this.http.post(this.apiUrl, appointment);
  }

  getAppointments(): Observable<{ success: boolean; data: AppointmentHistory[] }> {
    return this.http.get<{ success: boolean; data: AppointmentHistory[] }>(this.apiUrl);
  }

  getAppointmentsFiltered(filters: { status?: string; fromDate?: string; toDate?: string }): Observable<{ success: boolean; data: AppointmentHistory[] }> {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    return this.http.get<{ success: boolean; data: AppointmentHistory[] }>(this.apiUrl, { params });
  }

  getDoctorAppointments(): Observable<{ success: boolean; data: DoctorAppointment[] }> {
    return this.http.get<{ success: boolean; data: DoctorAppointment[] }>(`${this.apiUrl}/doctor`);
  }

  getDoctorAppointmentsFiltered(filters: { status?: string; fromDate?: string; toDate?: string }): Observable<{ success: boolean; data: DoctorAppointment[] }> {
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    return this.http.get<{ success: boolean; data: DoctorAppointment[] }>(`${this.apiUrl}/doctor`, { params });
  }

  approveAppointment(id: number): Observable<{ success: boolean; data: DoctorAppointment }> {
    return this.http.patch<{ success: boolean; data: DoctorAppointment }>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectAppointment(id: number, reason: string): Observable<{ success: boolean; message: string; data: DoctorAppointment }> {
    return this.http.patch<{ success: boolean; message: string; data: DoctorAppointment }>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  bulkApproveAppointments(ids: number[]): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.post<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/doctor/bulk-approve`, { ids });
  }

  cancelAppointment(id: number): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.patch<{ success: boolean; message: string; data: any }>(`${this.apiUrl}/${id}/cancel`, {});
  }
}