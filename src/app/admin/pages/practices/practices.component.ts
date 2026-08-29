import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

interface AdminPractice {
  id: number;
  doctorProfileId: number;
  hospitalProfileId: number;
  consultationFee: number;
  isPrimary: boolean;
  isActive: boolean;
  status: 'pending_hospital_approval' | 'active' | 'rejected' | 'inactive';
  commissionMode: 'single' | 'split';
  platformCommissionPercent: number;
  hospitalPayoutPercent: number;
  doctorPayoutPercent: number;
  commissionOverridden: boolean;
  notes: string | null;
  hospital: {
    id: number;
    hospitalName: string;
    hospitalKind: 'solo_practice' | 'multi_doctor';
    hospitalCity: string | null;
    ownerUserId: number;
  } | null;
  doctor: {
    id: number;
    registrationNumber: string | null;
    qualification: string | null;
    ownerUserId: number;
    user: { id: number; name: string; email: string } | null;
    specialization: { id: number; name: string } | null;
  } | null;
  createdAt: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-practices',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './practices.component.html',
  styleUrl: './practices.component.css'
})
export class AdminPracticesComponent implements OnInit {
  practices: AdminPractice[] = [];
  isLoading = false;
  isSaving = false;
  error = '';
  success = '';

  statusFilter = '';
  modeFilter = '';
  search = '';

  editingId: number | null = null;
  editForm!: FormGroup;

  constructor(private admin: AdminService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      commissionMode: ['split', Validators.required],
      platformCommissionPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      hospitalPayoutPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      doctorPayoutPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      status: ['active'],
      notes: ['']
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.admin.listPractices({
      status: this.statusFilter || undefined,
      commissionMode: this.modeFilter || undefined
    }).subscribe({
      next: (res: any) => {
        this.practices = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load practices';
        this.isLoading = false;
      }
    });
  }

  get filtered(): AdminPractice[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.practices;
    return this.practices.filter(p =>
      (p.doctor?.user?.name || '').toLowerCase().includes(q) ||
      (p.hospital?.hospitalName || '').toLowerCase().includes(q) ||
      (p.doctor?.registrationNumber || '').toLowerCase().includes(q)
    );
  }

  get percentSum(): number {
    const v = this.editForm.value;
    return Number(v.platformCommissionPercent || 0)
      + Number(v.hospitalPayoutPercent || 0)
      + Number(v.doctorPayoutPercent || 0);
  }

  startEdit(p: AdminPractice): void {
    this.editingId = p.id;
    this.editForm.reset({
      commissionMode: p.commissionMode,
      platformCommissionPercent: p.platformCommissionPercent,
      hospitalPayoutPercent: p.hospitalPayoutPercent,
      doctorPayoutPercent: p.doctorPayoutPercent,
      status: p.status,
      notes: p.notes || ''
    });
    this.error = '';
    this.success = '';
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  onModeChange(): void {
    if (this.editForm.value.commissionMode === 'single') {
      this.editForm.patchValue({ hospitalPayoutPercent: 0, doctorPayoutPercent: 0 });
    }
  }

  save(p: AdminPractice): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    if (this.percentSum > 100) {
      this.error = 'Percents sum must not exceed 100.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.admin.updatePractice(p.id, this.editForm.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Practice updated.';
        this.editingId = null;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to update practice';
      }
    });
  }

  resetToDefaults(p: AdminPractice): void {
    if (!confirm(`Reset practice for ${p.doctor?.user?.name} at ${p.hospital?.hospitalName} to platform defaults?`)) return;
    this.isSaving = true;
    this.admin.updatePractice(p.id, { resetToDefaults: true }).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Practice reset to platform defaults.';
        this.editingId = null;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to reset';
      }
    });
  }

  statusBadgeClass(status: AdminPractice['status']): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'inactive': return 'bg-secondary';
    }
  }

  statusLabel(status: AdminPractice['status']): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_hospital_approval': return 'Pending hospital';
      case 'rejected': return 'Rejected';
      case 'inactive': return 'Inactive';
    }
  }

  soloDetected(p: AdminPractice): boolean {
    return (p.hospital?.hospitalKind === 'solo_practice')
      || (p.hospital?.ownerUserId === p.doctor?.ownerUserId);
  }
}
