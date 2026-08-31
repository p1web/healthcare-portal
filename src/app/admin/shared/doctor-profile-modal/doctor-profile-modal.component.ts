import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileReviewStatus, User } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-doctor-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-profile-modal.component.html',
  styleUrl: './doctor-profile-modal.component.css'
})
export class DoctorProfileModalComponent implements OnChanges {
  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  @Input() user: User | any | null = null;
  @Input() profile: any | null = null;
  @Input() manage = false;
  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  accountStatus: 'active' | 'blocked' = 'active';
  reviewAction: '' | ProfileReviewStatus = '';
  reviewComments = '';
  busy = false;
  errorMessage = '';

  practices: any[] = [];
  isLoadingPractices = false;

  constructor(private adminService: AdminService) {}

  ngOnChanges(): void {
    this.accountStatus = this.isAccountActive ? 'active' : 'blocked';
    this.reviewAction = '';
    this.reviewComments = '';
    this.errorMessage = '';
    this.loadPractices();
  }

  private loadPractices(): void {
    const doctorProfileId = this.doctorProfile?.id;
    this.practices = [];
    if (!doctorProfileId) return;
    this.isLoadingPractices = true;
    this.adminService.listPractices({ doctorProfileId }).subscribe({
      next: (res: any) => {
        this.practices = res?.data || [];
        this.isLoadingPractices = false;
      },
      error: () => {
        this.practices = [];
        this.isLoadingPractices = false;
      }
    });
  }

  practiceStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Active',
      pending_admin_approval: 'Pending admin',
      pending_hospital_approval: 'Pending hospital',
      rejected: 'Rejected',
      inactive: 'Inactive'
    };
    return map[status] || status;
  }

  practiceStatusBadge(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_admin_approval': return 'bg-warning text-dark';
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  get doctorUser(): any {
    return this.user || this.profile?.user || null;
  }

  get doctorProfile(): any {
    return this.profile || this.user?.doctorProfile || null;
  }

  get status(): ProfileReviewStatus {
    return this.doctorProfile?.verificationStatus || 'draft';
  }

  get statusLabel(): string {
    const labels: Record<ProfileReviewStatus, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Pending for Review',
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Returned',
      suspended: 'Suspended'
    };
    return labels[this.status];
  }

  get statusBadgeClass(): string {
    const classes: Record<ProfileReviewStatus, string> = {
      draft: 'bg-secondary',
      submitted: 'bg-primary',
      under_review: 'bg-info text-dark',
      approved: 'bg-success',
      rejected: 'bg-danger',
      changes_requested: 'bg-warning text-dark',
      suspended: 'bg-dark'
    };
    return classes[this.status];
  }

  get isAccountActive(): boolean {
    const isActive = this.doctorUser?.isActive ?? this.doctorUser?.is_active;
    const isBlocked = this.doctorUser?.isBlocked ?? this.doctorUser?.is_blocked;
    return !!isActive && !isBlocked;
  }

  get reviewActions(): Array<{ value: ProfileReviewStatus; label: string }> {
    if (this.status === 'submitted') {
      return [{ value: 'under_review', label: 'Move to Pending for Review' }];
    }
    if (this.status === 'under_review') {
      return [
        { value: 'approved', label: 'Approve' },
        { value: 'rejected', label: 'Reject' },
        { value: 'changes_requested', label: 'Return to Provider' }
      ];
    }
    return [];
  }

  get timeline() {
    const profile = this.doctorProfile;
    const finalStatuses: ProfileReviewStatus[] = ['approved', 'rejected', 'changes_requested'];
    const isFinal = finalStatuses.includes(this.status);
    return [
      {
        label: 'Draft',
        date: this.doctorUser?.createdAt || this.doctorUser?.created_at,
        comment: 'Profile created and available for editing.',
        complete: true,
        active: this.status === 'draft'
      },
      {
        label: 'Submitted',
        date: profile?.submittedAt,
        comment: 'Profile submitted by the provider for verification.',
        complete: ['submitted', 'under_review', ...finalStatuses].includes(this.status),
        active: this.status === 'submitted'
      },
      {
        label: 'Pending for Review',
        date: this.status === 'under_review' ? profile?.reviewedAt : null,
        comment: 'Profile queued for administrative review.',
        complete: ['under_review', ...finalStatuses].includes(this.status),
        active: this.status === 'under_review'
      },
      {
        label: isFinal ? this.statusLabel : 'Decision',
        date: isFinal ? profile?.reviewedAt : null,
        comment: isFinal ? (profile?.reviewNotes || profile?.rejectionReason || 'Decision recorded by the reviewer.') : 'Awaiting reviewer decision.',
        reviewer: isFinal ? profile?.reviewedBy?.name : null,
        complete: isFinal,
        active: isFinal
      }
    ];
  }

  get initials(): string {
    const parts = String(this.doctorUser?.name || '?').trim().split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]).toUpperCase();
  }

  get availabilitySchedule(): Array<{ dayOfWeek: number; startTime: string; endTime: string }> {
    const schedule = this.doctorProfile?.availability || this.doctorProfile?.availabilities || [];
    return schedule
      .filter((slot: any) => (slot.isAvailable ?? slot.is_available) !== false)
      .map((slot: any) => ({
        dayOfWeek: Number(slot.dayOfWeek ?? slot.day_of_week),
        startTime: String(slot.startTime ?? slot.start_time).slice(0, 5),
        endTime: String(slot.endTime ?? slot.end_time).slice(0, 5)
      }))
      .sort((left: any, right: any) => left.dayOfWeek - right.dayOfWeek);
  }

  formatAvailabilitySlot(slot: { dayOfWeek: number; startTime: string; endTime: string }): string {
    return `${this.dayNames[slot.dayOfWeek]} · ${this.formatTime(slot.startTime)}-${this.formatTime(slot.endTime)}`;
  }

  close(): void {
    this.closed.emit();
  }

  documentUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `http://localhost:3000${url}`;
  }

  updateAccountStatus(): void {
    if (!this.doctorUser?.id || this.accountStatus === (this.isAccountActive ? 'active' : 'blocked')) return;
    this.busy = true;
    this.errorMessage = '';
    this.adminService.updateUserAccountStatus(this.doctorUser.id, this.accountStatus).subscribe({
      next: () => this.finishChange(),
      error: (error) => this.failChange(error, 'Failed to update account access.')
    });
  }

  submitReview(): void {
    const comments = this.reviewComments.trim();
    if (!this.doctorProfile?.id || !this.reviewAction) return;
    if (this.reviewAction !== 'under_review' && !comments) {
      this.errorMessage = 'Comments are required to approve, reject, or return a profile.';
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.adminService.updateDoctorReview(this.doctorProfile.id, {
      status: this.reviewAction,
      reviewNotes: comments || undefined,
      rejectionReason: ['rejected', 'changes_requested'].includes(this.reviewAction) ? comments : undefined
    }).subscribe({
      next: () => this.finishChange(),
      error: (error) => this.failChange(error, 'Failed to update doctor review.')
    });
  }

  private finishChange(): void {
    this.busy = false;
    this.changed.emit();
    this.close();
  }

  private failChange(error: any, fallback: string): void {
    this.busy = false;
    this.errorMessage = error.error?.message || fallback;
  }

  private formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${hourValue >= 12 ? 'PM' : 'AM'}`;
  }
}