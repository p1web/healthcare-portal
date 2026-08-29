import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PracticeService, Practice } from '../../../services/practice.service';

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

  rejectingId: number | null = null;
  rejectReason = '';

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
    return this.practices.filter(p => p.status === 'pending_hospital_approval');
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

  approve(p: Practice): void {
    if (!confirm(`Approve ${this.doctorLabel(p)} to practice at this hospital?`)) return;
    this.isSaving = true;
    this.error = '';
    this.practiceService.reviewPractice(p.id, 'approve').subscribe({
      next: () => {
        this.isSaving = false;
        this.success = `${this.doctorLabel(p)} approved.`;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to approve';
      }
    });
  }

  startReject(p: Practice): void {
    this.rejectingId = p.id;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingId = null;
    this.rejectReason = '';
  }

  confirmReject(p: Practice): void {
    if (!this.rejectReason.trim()) {
      this.error = 'Please provide a reason so the doctor knows why the request was rejected.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.practiceService.reviewPractice(p.id, 'reject', this.rejectReason.trim()).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = `${this.doctorLabel(p)} rejected.`;
        this.rejectingId = null;
        this.rejectReason = '';
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to reject';
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
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'inactive': return 'bg-secondary';
    }
  }

  statusLabel(status: Practice['status']): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_hospital_approval': return 'Pending your approval';
      case 'rejected': return 'Rejected';
      case 'inactive': return 'Inactive';
    }
  }
}
