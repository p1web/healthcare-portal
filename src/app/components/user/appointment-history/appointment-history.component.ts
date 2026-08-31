import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppointmentHistory } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-appointment-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './appointment-history.component.html',
  styleUrls: ['./appointment-history.component.css']
})
export class AppointmentHistoryComponent implements OnInit {
  appointments: AppointmentHistory[] = [];
  isLoading = true;
  error = '';

  // Filters
  statusFilter: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' = 'all';
  fromDate = '';
  toDate = '';

  // Pagination
  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';

    const filters: any = {};
    if (this.statusFilter !== 'all') filters.status = this.statusFilter;
    if (this.fromDate) filters.fromDate = this.fromDate;
    if (this.toDate) filters.toDate = this.toDate;

    this.appointmentService.getAppointmentsFiltered(filters).subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.currentPage = 1;
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load appointment history.';
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void { this.loadAppointments(); }

  get hasActiveFilters(): boolean {
    return this.statusFilter !== 'all' || !!this.fromDate || !!this.toDate;
  }

  resetFilters(): void {
    this.statusFilter = 'all';
    this.fromDate = '';
    this.toDate = '';
    this.loadAppointments();
  }

  cancelAppointment(id: number): void {
    if (!confirm('Cancel this appointment? Any applied coupon will be refunded for future use.')) return;
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        alert('Appointment cancelled');
        this.loadAppointments();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to cancel appointment');
      }
    });
  }

  canCancel(status: string): boolean {
    return status === 'pending' || status === 'confirmed';
  }

  getStatusClass(status: AppointmentHistory['status']): string {
    return `status-${status}`;
  }

  paymentBadgeClass(status?: string): string {
    switch (status) {
      case 'paid': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-cancelled';
      case 'refunded': return 'status-rejected';
      default: return 'status-pending';
    }
  }

  formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    const suffix = hourValue >= 12 ? 'PM' : 'AM';
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  // --- Pagination ---
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.appointments.length / this.pageSize));
  }

  get pagedAppointments(): AppointmentHistory[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.appointments.slice(start, start + this.pageSize);
  }

  get rangeStart(): number {
    if (!this.appointments.length) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.appointments.length);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    const window = 2;
    const from = Math.max(1, current - window);
    const to = Math.min(total, current + window);
    for (let p = from; p <= to; p++) pages.push(p);
    return pages;
  }
}
