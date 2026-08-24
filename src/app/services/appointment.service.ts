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

  getDoctorAppointments(): Observable<{ success: boolean; data: DoctorAppointment[] }> {
    return this.http.get<{ success: boolean; data: DoctorAppointment[] }>(`${this.apiUrl}/doctor`);
  }

  approveAppointment(id: number): Observable<{ success: boolean; data: DoctorAppointment }> {
    return this.http.patch<{ success: boolean; data: DoctorAppointment }>(`${this.apiUrl}/${id}/approve`, {});
  }
}