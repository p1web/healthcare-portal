import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { User, ProfileReviewStatus } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { HospitalProfileService } from '../../../services/hospital-profile.service';
import { ProfileSaveConfirmationService } from '../../../shared/profile-save-confirmation';

@Component({
  standalone: true,
  selector: 'app-hospital-review-status',
  imports: [CommonModule, RouterModule],
  templateUrl: './hospital-review-status.component.html',
  styleUrl: './hospital-review-status.component.css'
})
export class HospitalReviewStatusComponent implements OnInit {
  user: User | null = null;
  loading: boolean = false;
  isSubmittingReview: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private authService: AuthService,
    private hospitalProfileService: HospitalProfileService,
    private profileSaveConfirmation: ProfileSaveConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load user details.';
      }
    });
  }

  get reviewStatus(): ProfileReviewStatus | 'unknown' {
    return this.user?.hospitalProfile?.verificationStatus || 'unknown';
  }

  get reviewStatusLabel(): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Pending for Review',
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Returned'
    };
    return labels[this.reviewStatus] || 'Unknown';
  }

  get reviewBadgeClass(): string {
    switch (this.reviewStatus) {
      case 'approved':
        return 'badge bg-success';
      case 'under_review':
        return 'badge bg-info text-dark';
      case 'changes_requested':
        return 'badge bg-warning text-dark';
      case 'rejected':
        return 'badge bg-danger';
      case 'submitted':
        return 'badge bg-primary';
      case 'suspended':
        return 'badge bg-dark';
      default:
        return 'badge bg-secondary';
    }
  }

  get canSubmitForReview(): boolean {
    return this.reviewStatus === 'draft' || this.reviewStatus === 'changes_requested';
  }

  get isProfileEditable(): boolean {
    return this.canSubmitForReview;
  }

  get timelineSteps() {
    const profile = this.user?.hospitalProfile;
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
          : 'Awaiting reviewer decision.',
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

    this.hospitalProfileService.submitForReview().subscribe({
      next: (response: any) => {
        this.isSubmittingReview = false;
        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile submitted for review.';
        } else {
          this.error = response.message || 'Failed to submit profile for review';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSubmittingReview = false;
        console.error('Error submitting profile for review:', err);
        const missingFields = err.error?.missingFields;
        this.error = missingFields?.length
          ? `${err.error?.message} (missing: ${missingFields.join(', ')})`
          : (err.error?.message || 'Failed to submit profile for review. Please make sure all profile details and verification documents are completed.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
