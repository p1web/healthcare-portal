import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ProfileReviewStatus, User } from '../../../models/user.model';
import { DoctorProfileModalComponent } from '../../shared/doctor-profile-modal/doctor-profile-modal.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorProfileModalComponent],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.css'
})

export class DoctorsComponent implements OnInit{

  doctorList: any[] = [];
  hospitalsList: any[] = [];
  specializationList: any[] = [];
  statusFilter: string | null = null;
  pageTitle: string | null = null;
  selectedDoctor: any = null;
  reviewActions: Record<number, string> = {};
  reviewComments: Record<number, string> = {};
  publicListing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}


  ngOnInit(): void {
    this.publicListing = this.route.snapshot.data['publicListing'] === true;
    this.route.queryParams.subscribe(params => {
      const filters = this.publicListing ? { ...params, status: 'ACTIVE' } : params;
      this.statusFilter = filters['status'] || 'ALL';
      this.pageTitle = this.publicListing ? 'Public' : this.statusFilter;
      this.loadDoctorProfile(filters);
      this.loadSpecializations();
      this.loadHospitals();
    });
  }

  getRoleClass(role: 'patient' | 'doctor' | 'hospital' | 'admin'): string {
    switch (role) {
      case 'admin':
        return 'badge bg-dark';

      case 'doctor':
        return 'badge bg-primary';

      case 'hospital':
        return 'badge bg-success';

      case 'patient':
        return 'badge bg-info';

      default:
        return 'badge bg-secondary';
    }
  }


  loadDoctorProfile(filters: any): void {
    
    this.AdminService.getDoctorProfile(filters).subscribe({
      next: (response) => {
        this.doctorList = response;
        // console.log('Users loaded:', this.doctorList);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  showStatusColumns(): boolean {
    // console.log('Status Filter:', this.statusFilter);
      return this.statusFilter === 'ALL';
  }

  openDoctorModal(doctor: any): void {
    this.selectedDoctor = doctor;
  }

  closeDoctorModal(): void {
    this.selectedDoctor = null;
  }

  refreshDoctorList(): void {
    this.loadDoctorProfile(this.publicListing ? { status: 'ACTIVE' } : this.route.snapshot.queryParams);
  }

  openCreateModal(doctor: any): void {
    this.selectedDoctor = doctor; 
    console.log('Creating new doctor profile',this.selectedDoctor);
  }

  getReviewStatus(profile: any): ProfileReviewStatus | 'unknown' {
    return profile?.verificationStatus || 'unknown';
  }

  getReviewStatusLabel(profile: any): string {
    const labels: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', under_review: 'Pending for Review', approved: 'Approved', rejected: 'Rejected', changes_requested: 'Returned' };
    return labels[this.getReviewStatus(profile)] || 'Unknown';
  }

  getReviewBadgeClass(profile: any): string {
    const status = this.getReviewStatus(profile);
    switch (status) {
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
      default:
        return 'badge bg-secondary';
    }
  }

  getReviewActions(profile: any): Array<{ value: ProfileReviewStatus; label: string }> {
    const status = this.getReviewStatus(profile);
    if (status === 'submitted') return [{ value: 'under_review', label: 'Move to Pending for Review' }];
    if (status === 'under_review') return [
      { value: 'approved', label: 'Approve' },
      { value: 'rejected', label: 'Reject' },
      { value: 'changes_requested', label: 'Return to Provider' }
    ];
    return [];
  }

  setReviewAction(profileId: number, value: string): void {
    this.reviewActions[profileId] = value;
    this.reviewComments[profileId] = '';
  }

  setReviewComments(profileId: number, value: string): void {
    this.reviewComments[profileId] = value;
  }

  canApplyReview(doctor: any): boolean {
    const status = this.reviewActions[doctor.id];
    return !!status && (status === 'under_review' || !!this.reviewComments[doctor.id]?.trim());
  }

  updateDoctorReview(doctor: any): void {
    const status = this.reviewActions[doctor.id] as ProfileReviewStatus;
    const reviewNotes = (this.reviewComments[doctor.id] || '').trim();
    if (!status || (status !== 'under_review' && !reviewNotes)) return;

    this.AdminService.updateDoctorReview(doctor.id, {
      status,
      reviewNotes: reviewNotes || undefined,
      rejectionReason: status === 'rejected' || status === 'changes_requested' ? reviewNotes : undefined
    }).subscribe({
      next: () => {
        delete this.reviewActions[doctor.id];
        delete this.reviewComments[doctor.id];
        this.loadDoctorProfile(this.route.snapshot.queryParams);
      },
      error: (err) => {
        console.error('Failed to update doctor review', err);
      }
    });
  }

  loadSpecializations(): void {
    this.AdminService.getSpecializationList().subscribe({
      next: (response) => {
        this.specializationList = response;
      },
      error: (err) => {
        console.error('Failed to load specializations', err);
      }
    });
  }

  loadHospitals(): void {
    this.AdminService.getHospitals().subscribe({
      next: (response) => {
        this.hospitalsList = response;
      },
      error: (err) => {
        console.error('Failed to load hospitals', err);
      }
    });
  }

}
