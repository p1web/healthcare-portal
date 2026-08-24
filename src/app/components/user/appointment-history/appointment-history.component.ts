import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentHistory } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointment-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './appointment-history.component.html',
  styleUrls: ['./appointment-history.component.css']
})
export class AppointmentHistoryComponent implements OnInit {
  appointments: AppointmentHistory[] = [];
  isLoading = true;
  error = '';

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';
    this.appointmentService.getAppointments().subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load appointment history.';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: AppointmentHistory['status']): string {
    return `status-${status}`;
  }

  formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    const suffix = hourValue >= 12 ? 'PM' : 'AM';
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }
}
