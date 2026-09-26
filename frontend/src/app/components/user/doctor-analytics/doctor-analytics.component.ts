import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService, DoctorAnalytics } from '../../../services/appointment.service';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
  offset: number;
  length: number;
}

@Component({
  selector: 'app-doctor-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doctor-analytics.component.html',
  styleUrls: ['./doctor-analytics.component.css']
})
export class DoctorAnalyticsComponent implements OnInit {
  isLoading = true;
  error = '';
  analytics: DoctorAnalytics | null = null;

  readonly statusMeta: { key: keyof DoctorAnalytics['statusBreakdown']; label: string; color: string }[] = [
    { key: 'pending',   label: 'Pending',   color: '#f59f00' },
    { key: 'confirmed', label: 'Confirmed', color: '#2f9e44' },
    { key: 'completed', label: 'Completed', color: '#1c7ed6' },
    { key: 'cancelled', label: 'Cancelled', color: '#868e96' },
    { key: 'rejected',  label: 'Rejected',  color: '#e03131' }
  ];

  readonly weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly hourMeta: { key: 'morning' | 'afternoon' | 'evening' | 'night'; label: string; range: string; icon: string }[] = [
    { key: 'morning',   label: 'Morning',   range: '6 AM – 12 PM', icon: 'bi-sunrise' },
    { key: 'afternoon', label: 'Afternoon', range: '12 – 4 PM',   icon: 'bi-sun' },
    { key: 'evening',   label: 'Evening',   range: '4 – 8 PM',    icon: 'bi-sunset' },
    { key: 'night',     label: 'Night',     range: 'After 8 PM',  icon: 'bi-moon-stars' }
  ];

  // Donut geometry (circumference of r=45 circle ≈ 282.74)
  readonly donutRadius = 45;
  readonly donutCircumference = 2 * Math.PI * this.donutRadius;

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.appointmentService.getDoctorAnalytics().subscribe({
      next: (res) => {
        this.analytics = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load analytics.';
        this.isLoading = false;
      }
    });
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

  get maxDailyCount(): number {
    if (!this.analytics) return 0;
    return this.analytics.dailyTrend.reduce((max, d) => (d.count > max ? d.count : max), 0);
  }

  get maxWeekdayCount(): number {
    if (!this.analytics) return 0;
    return this.analytics.weekdayDistribution.reduce((max, v) => (v > max ? v : max), 0);
  }

  get maxHourCount(): number {
    if (!this.analytics) return 0;
    const h = this.analytics.hourDistribution;
    return Math.max(h.morning, h.afternoon, h.evening, h.night);
  }

  get maxPatientCount(): number {
    if (!this.analytics || !this.analytics.topPatients.length) return 0;
    return this.analytics.topPatients[0].count;
  }

  trendBarHeight(count: number): number {
    const max = this.maxDailyCount;
    if (max <= 0) return 4;
    return Math.max(4, Math.round((count / max) * 100));
  }

  weekdayBarWidth(count: number): number {
    const max = this.maxWeekdayCount;
    if (max <= 0) return 2;
    return Math.max(2, Math.round((count / max) * 100));
  }

  hourBarWidth(count: number): number {
    const max = this.maxHourCount;
    if (max <= 0) return 2;
    return Math.max(2, Math.round((count / max) * 100));
  }

  patientBarWidth(count: number): number {
    const max = this.maxPatientCount;
    if (max <= 0) return 2;
    return Math.max(2, Math.round((count / max) * 100));
  }

  formatCurrency(value: number): string {
    if (!Number.isFinite(value)) return '₹0';
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  formatShortDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase() || '?';
  }
}
