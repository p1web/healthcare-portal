import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

interface HospitalCommissionRow {
  id: number;
  hospitalName: string;
  hospitalKind: 'solo_practice' | 'multi_doctor';
  hospitalCity: string | null;
  hospitalState: string | null;
  verificationStatus: string;
  hospitalCommissionPercent: number;
  editValue?: number;
  savingId?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-admin-hospital-commissions',
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-commissions.component.html',
  styleUrl: './hospital-commissions.component.css'
})
export class AdminHospitalCommissionsComponent implements OnInit {
  hospitals: HospitalCommissionRow[] = [];
  isLoading = false;
  savingId: number | null = null;
  error = '';
  success = '';
  search = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.admin.listHospitalCommissions().subscribe({
      next: (res: any) => {
        this.hospitals = (res.data || []).map((h: HospitalCommissionRow) => ({
          ...h,
          editValue: h.hospitalCommissionPercent
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load hospitals';
        this.isLoading = false;
      }
    });
  }

  get filtered(): HospitalCommissionRow[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.hospitals;
    return this.hospitals.filter(h =>
      (h.hospitalName || '').toLowerCase().includes(q) ||
      (h.hospitalCity || '').toLowerCase().includes(q) ||
      (h.hospitalState || '').toLowerCase().includes(q)
    );
  }

  save(row: HospitalCommissionRow): void {
    const rate = Number(row.editValue);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      this.error = 'Commission % must be between 0 and 100.';
      return;
    }
    this.error = '';
    this.success = '';
    this.savingId = row.id;
    this.admin.updateHospitalCommission(row.id, rate).subscribe({
      next: () => {
        row.hospitalCommissionPercent = rate;
        this.savingId = null;
        this.success = `Updated ${row.hospitalName} to ${rate}%. Future bookings apply the new rate.`;
      },
      error: (err) => {
        this.savingId = null;
        this.error = err?.error?.message || 'Failed to update';
      }
    });
  }

  isDirty(row: HospitalCommissionRow): boolean {
    return Number(row.editValue) !== Number(row.hospitalCommissionPercent);
  }
}
