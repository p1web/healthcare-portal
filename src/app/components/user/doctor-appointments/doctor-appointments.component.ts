import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorAppointment } from '../../../models/appointment.model';
import { AppointmentService } from '../../../services/appointment.service';

@Component({
  selector: 'app-doctor-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctor-appointments.component.html',
  styleUrls: ['./doctor-appointments.component.css']
})
export class DoctorAppointmentsComponent implements OnInit {
  appointments: DoctorAppointment[] = [];
  approvingId: number | null = null;
  isLoading = true;
  error = '';
  success = '';

  // Filters
  statusFilter: 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' = 'all';
  fromDate = '';
  toDate = '';

  // Bulk selection
  selectedIds = new Set<number>();
  selectAllChecked = false;
  isBulkApproving = false;

  // Reject modal
  rejectForm: FormGroup;
  rejectingAppointment: DoctorAppointment | null = null;
  isRejecting = false;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private appointmentService: AppointmentService, private fb: FormBuilder) {
    this.rejectForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.error = '';
    this.selectedIds.clear();

    const filters: any = {};
    if (this.statusFilter !== 'all') filters.status = this.statusFilter;
    if (this.fromDate) filters.fromDate = this.fromDate;
    if (this.toDate) filters.toDate = this.toDate;

    this.appointmentService.getDoctorAppointmentsFiltered(filters).subscribe({
      next: response => {
        this.appointments = response.data || [];
        this.currentPage = 1;
        this.selectAllChecked = false;
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load patient bookings.';
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

  approveAppointment(appointment: DoctorAppointment): void {
    this.approvingId = appointment.id;
    this.error = '';
    this.success = '';
    this.appointmentService.approveAppointment(appointment.id).subscribe({
      next: response => {
        const index = this.appointments.findIndex(item => item.id === appointment.id);
        if (index >= 0) this.appointments[index] = response.data;
        this.success = 'Appointment approved successfully.';
        this.selectedIds.delete(appointment.id);
        this.approvingId = null;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to approve appointment.';
        this.approvingId = null;
      }
    });
  }

  // --- Bulk selection ---
  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.syncSelectAllState();
  }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

  get pendingAppointments(): DoctorAppointment[] {
    return this.appointments.filter(a => a.status === 'pending');
  }

  get pendingOnPage(): DoctorAppointment[] {
    return this.pagedAppointments.filter(a => a.status === 'pending');
  }

  syncSelectAllState(): void {
    const pending = this.pendingOnPage;
    this.selectAllChecked = pending.length > 0 && pending.every(a => this.selectedIds.has(a.id));
  }

  onSelectAllChange(checked: boolean): void {
    if (checked) {
      this.pendingOnPage.forEach(a => this.selectedIds.add(a.id));
    } else {
      this.pendingOnPage.forEach(a => this.selectedIds.delete(a.id));
    }
    this.selectAllChecked = checked;
  }

  clearSelection(): void {
    this.selectedIds.clear();
    this.selectAllChecked = false;
  }

  bulkConfirm(): void {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Confirm ${this.selectedIds.size} selected appointment(s)?`)) return;
    this.isBulkApproving = true;
    this.error = '';
    this.success = '';
    const ids = Array.from(this.selectedIds);
    this.appointmentService.bulkApproveAppointments(ids).subscribe({
      next: res => {
        this.isBulkApproving = false;
        this.success = res?.message || 'Appointments confirmed';
        this.clearSelection();
        this.loadAppointments();
      },
      error: err => {
        this.isBulkApproving = false;
        this.error = err?.error?.message || 'Failed to bulk approve';
      }
    });
  }

  // --- Reject flow ---
  openRejectModal(appointment: DoctorAppointment): void {
    this.rejectingAppointment = appointment;
    this.rejectForm.reset({ reason: '' });
  }

  submitReject(): void {
    if (this.rejectForm.invalid || !this.rejectingAppointment) {
      this.rejectForm.markAllAsTouched();
      return;
    }
    const reason = this.rejectForm.value.reason;
    const id = this.rejectingAppointment.id;
    this.isRejecting = true;
    this.appointmentService.rejectAppointment(id, reason).subscribe({
      next: res => {
        this.isRejecting = false;
        this.success = res?.message || 'Appointment rejected';
        (document.querySelector('#rejectAppointmentModal .btn-close') as HTMLElement | null)?.click();
        this.rejectingAppointment = null;
        this.loadAppointments();
      },
      error: err => {
        this.isRejecting = false;
        this.error = err?.error?.message || 'Failed to reject appointment';
      }
    });
  }

  getStatusClass(status: DoctorAppointment['status']): string {
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

  get pagedAppointments(): DoctorAppointment[] {
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
    this.syncSelectAllState();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.syncSelectAllState();
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
