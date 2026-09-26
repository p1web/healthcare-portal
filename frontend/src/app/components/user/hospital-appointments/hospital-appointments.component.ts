import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HospitalAppointmentRow, HospitalAppointmentService } from '../../../services/hospital-appointment.service';

@Component({
  standalone: true,
  selector: 'app-hospital-appointments',
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-appointments.component.html',
  styleUrl: './hospital-appointments.component.css'
})
export class HospitalAppointmentsComponent implements OnInit {
  appointments: HospitalAppointmentRow[] = [];
  isLoading = false;
  actingId: number | null = null;
  error = '';
  success = '';

  filterStatus = '';
  search = '';

  constructor(private svc: HospitalAppointmentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.svc.list({ status: this.filterStatus || undefined }).subscribe({
      next: (res) => {
        this.appointments = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load appointments';
        this.isLoading = false;
      }
    });
  }

  get filtered(): HospitalAppointmentRow[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.appointments;
    return this.appointments.filter(a =>
      (a.patientName || '').toLowerCase().includes(q) ||
      (a.doctorName || '').toLowerCase().includes(q) ||
      (a.bookingNumber || '').toLowerCase().includes(q)
    );
  }

  confirm(a: HospitalAppointmentRow): void {
    if (!confirm(`Confirm the appointment for ${a.patientName} on ${a.date} ${a.time}?`)) return;
    this.actingId = a.id;
    this.error = '';
    this.svc.confirm(a.id).subscribe({
      next: (res) => {
        this.actingId = null;
        this.success = res.message || 'Appointment confirmed.';
        this.load();
      },
      error: (err) => {
        this.actingId = null;
        this.error = err?.error?.message || 'Failed to confirm';
      }
    });
  }

  complete(a: HospitalAppointmentRow): void {
    if (!this.hasStarted(a)) {
      this.error = `Appointment cannot be marked complete before its scheduled start (${a.date}${a.time ? ' ' + a.time.slice(0, 5) : ''}).`;
      return;
    }
    if (!confirm(`Mark ${a.patientName}'s appointment complete? If a coupon was used, cashback will be credited.`)) return;
    this.actingId = a.id;
    this.error = '';
    this.svc.complete(a.id).subscribe({
      next: (res) => {
        this.actingId = null;
        this.success = res.message || 'Appointment completed.';
        this.load();
      },
      error: (err) => {
        this.actingId = null;
        this.error = err?.error?.message || 'Failed to complete';
      }
    });
  }

  reject(a: HospitalAppointmentRow): void {
    const reason = prompt(`Reason for rejecting ${a.patientName}'s appointment?`);
    if (reason === null) return;
    if (!reason.trim()) { this.error = 'A reason is required.'; return; }
    this.actingId = a.id;
    this.svc.reject(a.id, reason.trim()).subscribe({
      next: () => {
        this.actingId = null;
        this.success = 'Appointment rejected.';
        this.load();
      },
      error: (err) => {
        this.actingId = null;
        this.error = err?.error?.message || 'Failed to reject';
      }
    });
  }

  cancel(a: HospitalAppointmentRow): void {
    if (!confirm(`Cancel the confirmed appointment for ${a.patientName} on ${a.date} ${a.time}? Coupon usage will be refunded and any pending cashback will be forfeited.`)) return;
    this.actingId = a.id;
    this.error = '';
    this.svc.cancel(a.id).subscribe({
      next: () => {
        this.actingId = null;
        this.success = 'Appointment cancelled.';
        this.load();
      },
      error: (err) => {
        this.actingId = null;
        this.error = err?.error?.message || 'Failed to cancel';
      }
    });
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'confirmed': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'cancelled': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  hasStarted(a: HospitalAppointmentRow): boolean {
    if (!a?.date) return true;
    const time = a.time ? String(a.time).slice(0, 5) : '00:00';
    const start = new Date(`${a.date}T${time}:00`);
    if (Number.isNaN(start.getTime())) return true;
    return Date.now() >= start.getTime();
  }

  paymentBadgeClass(status?: string): string {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'failed': return 'bg-danger';
      case 'refunded': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }
}
