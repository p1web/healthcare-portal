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
  status: 'pending_hospital_approval' | 'pending_admin_approval' | 'active' | 'rejected' | 'inactive';
  platformCommissionPercent: number;
  notes: string | null;
  hospital: {
    id: number;
    hospitalName: string;
    hospitalKind: 'solo_practice' | 'multi_doctor';
    hospitalCity: string | null;
    ownerUserId: number;
    hospitalCommissionPercent: number;
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
  search = '';

  editingId: number | null = null;
  editForm!: FormGroup;

  constructor(private admin: AdminService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      consultationFee: [0, [Validators.required, Validators.min(0)]],
      status: ['active'],
      notes: ['']
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.admin.listPractices({
      status: this.statusFilter || undefined
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

  startEdit(p: AdminPractice): void {
    this.editingId = p.id;
    this.editForm.reset({
      consultationFee: p.consultationFee,
      status: p.status,
      notes: p.notes || ''
    });
    this.error = '';
    this.success = '';
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  save(p: AdminPractice): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
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

  approve(p: AdminPractice): void {
    if (!confirm(`Approve ${p.doctor?.user?.name || 'doctor'} to practice at ${p.hospital?.hospitalName || 'this hospital'}?`)) return;
    this.isSaving = true;
    this.error = '';
    this.admin.reviewPractice(p.id, 'approve').subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Affiliation approved.';
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to approve';
      }
    });
  }

  reject(p: AdminPractice): void {
    const reason = prompt('Rejection reason (visible to hospital & doctor):');
    if (reason === null) return;
    if (!reason.trim()) {
      this.error = 'A reason is required.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.admin.reviewPractice(p.id, 'reject', reason.trim()).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Affiliation rejected.';
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to reject';
      }
    });
  }

  statusBadgeClass(status: AdminPractice['status']): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_admin_approval': return 'bg-warning text-dark';
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'inactive': return 'bg-secondary';
    }
  }

  statusLabel(status: AdminPractice['status']): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_admin_approval': return 'Pending admin';
      case 'pending_hospital_approval': return 'Pending hospital';
      case 'rejected': return 'Rejected';
      case 'inactive': return 'Inactive';
    }
  }
}
