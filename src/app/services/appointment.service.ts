import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:3000/api/appointments';

  constructor(private http: HttpClient) {}

  bookAppointment(appointment: Appointment): Observable<any> {
    // return this.http.post(this.apiUrl, appointment);
    console.log('Booking appointment:', appointment);
    return of({ success: true, message: 'Appointment booked successfully' });
  }
}