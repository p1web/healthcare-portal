import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAppointment } from '../../../models/appointment.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  appointments: AdminAppointment[] = [];
  searchTerm = '';
  statusFilter = 'all';
  isLoading = true;
  error = '';

  readonly statuses = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  get filteredAppointments(): AdminAppointment[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.appointments.filter(appointment => {
      const matchesStatus = this.statusFilter === 'all' || appointment.status === this.statusFilter;
      const matchesSearch = !search || [
        appointment.patientName,
        appointment.patientEmail,
        appointment.patientPhone,
        appointment.doctorName,
        appointment.specialization,
        appointment.hospital,
        appointment.reason
      ].some(value => value?.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';
    this.adminService.getAppointments().subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load appointments.';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: AdminAppointment['status']): string {
    return `status-${status}`;
  }

  formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    const suffix = hourValue >= 12 ? 'PM' : 'AM';
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }
}
