import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileReviewStatus, User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { DoctorProfileService } from '../../../services/doctor-profile.service';
import { ProfileSaveConfirmationService } from '../../../shared/profile-save-confirmation';

@Component({
  standalone: true,
  selector: 'app-doctor-review-status',
  imports: [CommonModule, RouterModule],
  templateUrl: './doctor-review-status.component.html',
  styleUrl: './doctor-review-status.component.css'
})
export class DoctorReviewStatusComponent implements OnInit {
  user: User | null = null;
  loading = true;
  isSubmittingReview = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private doctorProfileService: DoctorProfileService,
    private profileSaveConfirmation: ProfileSaveConfirmationService
  ) {}

  ngOnInit(): void {
    this.doctorProfileService.getProfile().subscribe({
      next: (response: any) => {
        this.user = response.data || null;
        if (this.user) this.authService.setCurrentUser(this.user);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load verification status.';
      }
    });
  }

  get reviewStatus(): ProfileReviewStatus | 'unknown' {
    return this.user?.doctorProfile?.verificationStatus || 'unknown';
  }

  get reviewStatusLabel(): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Pending for Review',
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Returned',
      suspended: 'Suspended'
    };
    return labels[this.reviewStatus] || 'Unknown';
  }

  get reviewBadgeClass(): string {
    switch (this.reviewStatus) {
      case 'approved': return 'badge bg-success';
      case 'under_review': return 'badge bg-info text-dark';
      case 'changes_requested': return 'badge bg-warning text-dark';
      case 'rejected': return 'badge bg-danger';
      case 'submitted': return 'badge bg-primary';
      case 'suspended': return 'badge bg-dark';
      default: return 'badge bg-secondary';
    }
  }

  get canSubmitForReview(): boolean {
    return this.reviewStatus === 'draft' || this.reviewStatus === 'changes_requested';
  }

  get timelineSteps() {
    const profile = this.user?.doctorProfile;
    const isFinal = ['approved', 'rejected', 'changes_requested'].includes(this.reviewStatus);
    return [
      {
        label: 'Draft',
        date: this.user?.createdAt,
        comment: 'Profile created and available for editing.',
        complete: this.reviewStatus !== 'unknown',
        active: this.reviewStatus === 'draft'
      },
      {
        label: 'Submitted',
        date: profile?.submittedAt,
        comment: 'Profile submitted for verification.',
        complete: ['submitted', 'under_review', 'approved', 'rejected', 'changes_requested'].includes(this.reviewStatus),
        active: this.reviewStatus === 'submitted'
      },
      {
        label: 'Pending for Review',
        date: this.reviewStatus === 'under_review' ? profile?.reviewedAt : null,
        comment: this.reviewStatus === 'under_review'
          ? 'Your profile is being reviewed by the administration team.'
          : 'Profile queued for administrative review.',
        complete: ['under_review', 'approved', 'rejected', 'changes_requested'].includes(this.reviewStatus),
        active: this.reviewStatus === 'under_review'
      },
      {
        label: isFinal ? this.reviewStatusLabel : 'Decision',
        date: isFinal ? profile?.reviewedAt : null,
        comment: isFinal
          ? (profile?.reviewNotes || profile?.rejectionReason || 'Review decision recorded.')
          : 'Awaiting review decision.',
        reviewer: isFinal ? profile?.reviewedBy?.name : null,
        complete: isFinal,
        active: isFinal,
        outcome: true
      }
    ];
  }

  async submitForReview(): Promise<void> {
    if (!await this.profileSaveConfirmation.confirm('review')) return;

    this.isSubmittingReview = true;
    this.error = '';
    this.success = '';

    this.doctorProfileService.submitForReview().subscribe({
      next: (response: any) => {
        this.isSubmittingReview = false;
        if (response.success) {
          this.user = response.data;
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile submitted for review.';
        } else {
          this.error = response.message || 'Failed to submit profile for review.';
        }
      },
      error: (err) => {
        this.isSubmittingReview = false;
        const missingFields = err.error?.missingFields;
        this.error = missingFields?.length
          ? `${err.error?.message} (missing: ${missingFields.join(', ')})`
          : (err.error?.message || 'Failed to submit profile for review.');
      }
    });
  }
}