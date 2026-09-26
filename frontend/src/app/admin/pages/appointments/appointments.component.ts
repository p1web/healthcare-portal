import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminAppointment } from '../../../models/appointment.model';
import { AdminService } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

type AppointmentStatus = AdminAppointment['status'];

@Component({
  selector: 'app-admin-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit {
  appointments: AdminAppointment[] = [];
  searchTerm = '';
  statusFilter: 'all' | AppointmentStatus = 'all';
  couponFilter: 'all' | 'with' | 'without' = 'all';
  isLoading = true;
  error = '';

  selectedAppointment: AdminAppointment | null = null;

  readonly statuses: Array<'all' | AppointmentStatus> = [
    'all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'
  ];

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  get filteredAppointments(): AdminAppointment[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.appointments.filter(appointment => {
      const matchesStatus = this.statusFilter === 'all' || appointment.status === this.statusFilter;
      const matchesCoupon =
        this.couponFilter === 'all' ||
        (this.couponFilter === 'with' && !!appointment.couponCode) ||
        (this.couponFilter === 'without' && !appointment.couponCode);
      const matchesSearch = !search || [
        appointment.patientName,
        appointment.patientEmail,
        appointment.patientPhone,
        appointment.doctorName,
        appointment.specialization,
        appointment.hospital,
        appointment.reason,
        appointment.couponCode
      ].some(value => value?.toLowerCase().includes(search));
      return matchesStatus && matchesCoupon && matchesSearch;
    });
  }

  get pagedAppointments(): AdminAppointment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAppointments.slice(start, start + this.pageSize);
  }

  get summary(): Record<'total' | AppointmentStatus, number> {
    const base: Record<'total' | AppointmentStatus, number> = {
      total: this.appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0
    };
    for (const a of this.appointments) {
      if (base[a.status] !== undefined) base[a.status]++;
    }
    return base;
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';
    this.adminService.getAppointments().subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load appointments.';
        this.isLoading = false;
      }
    });
  }

  openAppointment(appointment: AdminAppointment): void {
    this.selectedAppointment = appointment;
  }

  closeAppointment(): void {
    this.selectedAppointment = null;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.couponFilter = 'all';
  }

  getStatusClass(status: AppointmentStatus): string {
    return `status-${status}`;
  }

  getPaymentClass(status?: AdminAppointment['paymentStatus']): string {
    if (!status) return 'payment-unknown';
    return `payment-${status}`;
  }

  hasPricing(appointment: AdminAppointment): boolean {
    return appointment.originalPrice != null;
  }

  discountPercent(appointment: AdminAppointment): number | null {
    const original = appointment.originalPrice;
    const discount = appointment.discountAmount ?? 0;
    if (!original || original <= 0 || discount <= 0) return null;
    return Math.round((discount / original) * 100);
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase() || '?';
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hourValue, minute] = time.split(':').map(Number);
    const suffix = hourValue >= 12 ? 'PM' : 'AM';
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  trackByAppointmentId(_index: number, appointment: AdminAppointment): number {
    return appointment.id;
  }
}
