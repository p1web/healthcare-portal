import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorAppointment } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-appointments.component.html',
  styleUrls: ['./doctor-appointments.component.css']
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: DoctorAppointment[] = [];
  approvingId: number | null = null;
  isLoading = true;
  error = '';
  success = '';

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';
    this.appointmentService.getDoctorAppointments().subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load patient bookings.';
        this.isLoading = false;
      }
    });
  }

  approveAppointment(appointment: DoctorAppointment): void {
    this.approvingId = appointment.id;
    this.error = '';
    this.success = '';
    this.appointmentService.approveAppointment(appointment.id).subscribe({
      next: response => {
        const index = this.appointments.findIndex(item => item.id === appointment.id);
        if (index >= 0) this.appointments[index] = response.data;
        this.success = 'Appointment approved successfully.';
        this.approvingId = null;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to approve appointment.';
        this.approvingId = null;
      }
    });
  }

  getStatusClass(status: DoctorAppointment['status']): string {
    return `status-${status}`;
  }

  formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    const suffix = hourValue >= 12 ? 'PM' : 'AM';
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }
}
