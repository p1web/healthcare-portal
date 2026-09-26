import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService, PatientAnalytics } from '../../../services/appointment.service';
import { AuthService } from '../../../services/auth.service';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  offset: number;
  length: number;
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit {
  isLoading = true;
  error = '';
  analytics: PatientAnalytics | null = null;
  patientName = '';

  readonly statusMeta: { key: keyof PatientAnalytics['statusBreakdown']; label: string; color: string }[] = [
    { key: 'pending',   label: 'Pending',   color: '#f59f00' },
    { key: 'confirmed', label: 'Confirmed', color: '#2f9e44' },
    { key: 'completed', label: 'Completed', color: '#1c7ed6' },
    { key: 'cancelled', label: 'Cancelled', color: '#868e96' },
    { key: 'rejected',  label: 'Rejected',  color: '#e03131' }
  ];

  readonly donutRadius = 45;
  readonly donutCircumference = 2 * Math.PI * this.donutRadius;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser?.();
    this.patientName = user?.name || '';
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.appointmentService.getPatientAnalytics().subscribe({
      next: (res) => {
        this.analytics = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load your dashboard.';
        this.isLoading = false;
      }
    });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  get statusTotal(): number {
    if (!this.analytics) return 0;
    const s = this.analytics.statusBreakdown;
    return s.pending + s.confirmed + s.completed + s.cancelled + s.rejected;
  }

  get donutSlices(): DonutSlice[] {
    if (!this.analytics || this.statusTotal === 0) return [];
    let offset = 0;
    return this.statusMeta
      .map((meta) => {
        const value = this.analytics!.statusBreakdown[meta.key] || 0;
        const fraction = value / this.statusTotal;
        const length = fraction * this.donutCircumference;
        const slice: DonutSlice = {
          label: meta.label,
          value,
          color: meta.color,
          offset,
          length
        };
        offset += length;
        return slice;
      })
      .filter((s) => s.value > 0);
  }

  get maxMonthly(): number {
    if (!this.analytics) return 0;
    return this.analytics.monthlyTrend.reduce((m, d) => (d.count > m ? d.count : m), 0);
  }

  get maxDoctorVisits(): number {
    if (!this.analytics || !this.analytics.topDoctors.length) return 0;
    return this.analytics.topDoctors[0].count;
  }

  get maxSpecCount(): number {
    if (!this.analytics || !this.analytics.topSpecializations.length) return 0;
    return this.analytics.topSpecializations[0].count;
  }

  monthlyBarHeight(count: number): number {
    const max = this.maxMonthly;
    if (max <= 0) return 4;
    return Math.max(6, Math.round((count / max) * 100));
  }

  doctorBarWidth(count: number): number {
    const max = this.maxDoctorVisits;
    if (max <= 0) return 2;
    return Math.max(2, Math.round((count / max) * 100));
  }

  specBarWidth(count: number): number {
    const max = this.maxSpecCount;
    if (max <= 0) return 2;
    return Math.max(2, Math.round((count / max) * 100));
  }

  formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return '₹0';
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(time: string | null | undefined): string {
    if (!time) return '';
    const [hStr, mStr] = String(time).split(':');
    const hour = parseInt(hStr, 10);
    const minute = parseInt(mStr || '0', 10);
    if (Number.isNaN(hour)) return time;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  daysUntil(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const target = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(target.getTime())) return '';
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1) return `In ${diff} days`;
    return '';
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase() || '?';
  }

  statusColor(status: string): string {
    const meta = this.statusMeta.find((m) => m.key === status);
    return meta?.color || '#868e96';
  }
}
