import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PracticeService, Practice, PracticeDoctor } from '../../../services/practice.service';

type Tab = 'pending' | 'active' | 'archive';

@Component({
  standalone: true,
  selector: 'app-hospital-practices',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './hospital-practices.component.html',
  styleUrl: './hospital-practices.component.css'
})
export class HospitalPracticesComponent implements OnInit {
  practices: Practice[] = [];
  isLoading = false;
  isSaving = false;
  error = '';
  success = '';
  activeTab: Tab = 'pending';

  // "Add doctor" modal state.
  showAddModal = false;
  eligibleDoctors: PracticeDoctor[] = [];
  isLoadingEligible = false;
  addForm = { doctorProfileId: null as number | null, consultationFee: null as number | null, notes: '' };

  // "Remove doctor" confirmation state.
  removingId: number | null = null;

  constructor(private practiceService: PracticeService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.practiceService.listHospitalPractices().subscribe({
      next: (res) => {
        this.practices = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load practices';
        this.isLoading = false;
      }
    });
  }

  get pendingPractices(): Practice[] {
    return this.practices.filter(p =>
      p.status === 'pending_admin_approval' || p.status === 'pending_hospital_approval');
  }
  get activePractices(): Practice[] {
    return this.practices.filter(p => p.status === 'active');
  }
  get archivePractices(): Practice[] {
    return this.practices.filter(p => p.status === 'rejected' || p.status === 'inactive');
  }

  currentList(): Practice[] {
    switch (this.activeTab) {
      case 'pending': return this.pendingPractices;
      case 'active': return this.activePractices;
      case 'archive': return this.archivePractices;
    }
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.error = '';
    this.success = '';
    this.addForm = { doctorProfileId: null, consultationFee: null, notes: '' };
    this.isLoadingEligible = true;
    this.practiceService.listEligibleDoctors().subscribe({
      next: (res) => {
        this.eligibleDoctors = res.data || [];
        this.isLoadingEligible = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load doctors';
        this.isLoadingEligible = false;
      }
    });
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  submitAdd(): void {
    if (!this.addForm.doctorProfileId) {
      this.error = 'Please pick a doctor.';
      return;
    }
    if (this.addForm.consultationFee === null || this.addForm.consultationFee < 0) {
      this.error = 'Consultation fee must be zero or more.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.practiceService.createHospitalPractice({
      doctorProfileId: this.addForm.doctorProfileId,
      consultationFee: this.addForm.consultationFee,
      notes: this.addForm.notes?.trim() || undefined
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Affiliation request sent for admin review.';
        this.showAddModal = false;
        this.activeTab = 'pending';
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to send request';
      }
    });
  }

  confirmRemove(p: Practice): void {
    if (!confirm(`Remove ${this.doctorLabel(p)} from this hospital?`)) return;
    this.removingId = p.id;
    this.error = '';
    this.practiceService.removeHospitalDoctor(p.id).subscribe({
      next: () => {
        this.removingId = null;
        this.success = `${this.doctorLabel(p)} removed.`;
        this.load();
      },
      error: (err) => {
        this.removingId = null;
        this.error = err?.error?.message || 'Failed to remove doctor';
      }
    });
  }

  doctorLabel(p: Practice): string {
    return p.doctor?.user?.name || `Doctor #${p.doctorProfileId}`;
  }

  specializationLabel(p: Practice): string {
    return p.doctor?.specialization?.name || 'General';
  }

  statusBadgeClass(status: Practice['status']): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_admin_approval': return 'bg-warning text-dark';
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'inactive': return 'bg-secondary';
    }
  }

  statusLabel(status: Practice['status']): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_admin_approval': return 'Awaiting admin review';
      case 'pending_hospital_approval': return 'Legacy: pending your approval';
      case 'rejected': return 'Rejected';
      case 'inactive': return 'Inactive';
    }
  }
}
