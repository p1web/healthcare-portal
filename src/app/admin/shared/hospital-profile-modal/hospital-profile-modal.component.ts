import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileReviewStatus, User } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-hospital-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-profile-modal.component.html',
  styleUrl: './hospital-profile-modal.component.css'
})
export class HospitalProfileModalComponent implements OnChanges {
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

  constructor(private adminService: AdminService) {}

  ngOnChanges(): void {
    this.accountStatus = this.isAccountActive ? 'active' : 'blocked';
    this.reviewAction = '';
    this.reviewComments = '';
    this.errorMessage = '';
  }

  get hospitalUser(): any {
    return this.user || this.profile?.user || null;
  }

  get hospitalProfile(): any {
    return this.profile || this.user?.hospitalProfile || null;
  }

  get hospitalName(): string {
    return this.hospitalProfile?.hospitalName || this.hospitalProfile?.name || this.hospitalUser?.name || 'Hospital';
  }

  get status(): ProfileReviewStatus {
    return this.hospitalProfile?.verificationStatus || this.hospitalProfile?.verification_status
      || (this.hospitalProfile?.is_published ? 'approved' : 'draft');
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
    const isActive = this.hospitalUser?.isActive ?? this.hospitalUser?.is_active;
    const isBlocked = this.hospitalUser?.isBlocked ?? this.hospitalUser?.is_blocked;
    if (isActive === undefined && isBlocked === undefined) return !!this.hospitalProfile?.is_published;
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
    const profile = this.hospitalProfile;
    const finalStatuses: ProfileReviewStatus[] = ['approved', 'rejected', 'changes_requested'];
    const isFinal = finalStatuses.includes(this.status);
    return [
      {
        label: 'Draft',
        date: this.hospitalUser?.createdAt || this.hospitalUser?.created_at || profile?.createdAt,
        comment: 'Profile created and available for editing.',
        complete: true,
        active: this.status === 'draft'
      },
      {
        label: 'Submitted',
        date: profile?.submittedAt || profile?.submitted_at,
        comment: 'Profile submitted by the provider for verification.',
        complete: ['submitted', 'under_review', ...finalStatuses].includes(this.status),
        active: this.status === 'submitted'
      },
      {
        label: 'Pending for Review',
        date: this.status === 'under_review' ? (profile?.reviewedAt || profile?.reviewed_at) : null,
        comment: 'Profile queued for administrative review.',
        complete: ['under_review', ...finalStatuses].includes(this.status),
        active: this.status === 'under_review'
      },
      {
        label: isFinal ? this.statusLabel : 'Decision',
        date: isFinal ? (profile?.reviewedAt || profile?.reviewed_at) : null,
        comment: isFinal ? (profile?.reviewNotes || profile?.review_notes || profile?.rejectionReason || 'Decision recorded by the reviewer.') : 'Awaiting reviewer decision.',
        reviewer: isFinal ? profile?.reviewedBy?.name : null,
        complete: isFinal,
        active: isFinal
      }
    ];
  }

  get initials(): string {
    const parts = this.hospitalName.trim().split(/\s+/);
    return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]).toUpperCase();
  }

  close(): void {
    this.closed.emit();
  }

  documentUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `http://localhost:3000${url}`;
  }

  updateAccountStatus(): void {
    if (!this.hospitalUser?.id || this.accountStatus === (this.isAccountActive ? 'active' : 'blocked')) return;
    this.busy = true;
    this.errorMessage = '';
    this.adminService.updateUserAccountStatus(this.hospitalUser.id, this.accountStatus).subscribe({
      next: () => this.finishChange(),
      error: (error) => this.failChange(error, 'Failed to update account access.')
    });
  }

  submitReview(): void {
    const comments = this.reviewComments.trim();
    if (!this.hospitalProfile?.id || !this.reviewAction) return;
    if (this.reviewAction !== 'under_review' && !comments) {
      this.errorMessage = 'Comments are required to approve, reject, or return a profile.';
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.adminService.updateHospitalReview(this.hospitalProfile.id, {
      status: this.reviewAction,
      reviewNotes: comments || undefined,
      rejectionReason: ['rejected', 'changes_requested'].includes(this.reviewAction) ? comments : undefined
    }).subscribe({
      next: () => this.finishChange(),
      error: (error) => this.failChange(error, 'Failed to update hospital review.')
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
}