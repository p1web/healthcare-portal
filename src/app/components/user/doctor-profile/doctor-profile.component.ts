import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import type { ProfileReviewStatus } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { DoctorProfileService } from '../../../services/doctor-profile.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';
import { HospitalService } from '../../../services/hospital.service';
import { Hospital } from '../../../models/hospital.model';

@Component({
  standalone: true,
  selector: 'app-doctor-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  doctorDocuments: File[] = [];
  specializations: Specializations[] = [];
  hospitals: Partial<Hospital>[] = [];
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  isSubmittingReview: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  currentStep = 0;
  visitedSteps = new Set<number>([0]);

  readonly steps = [
    {
      title: 'Review Status',
      subtitle: 'Verification progress',
      icon: 'bi-shield-check',
      controls: [] as string[]
    },
    {
      title: 'About you',
      subtitle: 'Personal details',
      icon: 'bi-person',
      controls: ['basic.name', 'basic.phone', 'basic.dateOfBirth', 'basic.gender']
    },
    {
      title: 'Address',
      subtitle: 'Contact location',
      icon: 'bi-geo-alt',
      controls: ['basic.address', 'basic.city', 'basic.state', 'basic.pincode']
    },
    {
      title: 'Professional',
      subtitle: 'Credentials & fee',
      icon: 'bi-briefcase',
      controls: [
        'doctor.hospitalId', 'doctor.registrationNumber', 'doctor.qualification',
        'doctor.specializationId', 'doctor.yearsOfExperience', 'doctor.consultationFee'
      ]
    },
    {
      title: 'Availability',
      subtitle: 'Weekly hours',
      icon: 'bi-calendar-week',
      controls: [] as string[]
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private doctorProfileService: DoctorProfileService,
    private specializationService: SpecializationService,
    private hospitalService: HospitalService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    this.loadSpecializations();
    this.loadHospitals();
  }

  initializeForm(): void {
    this.profileForm = this.fb.group({
      basic: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        role: [{ value: '', disabled: true }],
        dateOfBirth: [''],
        gender: [''],
        address: [''],
        city: [''],
        state: [''],
        pincode: ['', Validators.pattern(/^[0-9]{6}$/)],
        country: ['India']
      }),
      doctor: this.fb.group({
        hospitalId: ['', Validators.required],
        registrationNumber: ['', Validators.required],
        qualification: ['', Validators.required],
        specializationId: ['', Validators.required],
        yearsOfExperience: ['', Validators.required],
        consultationFee: ['', Validators.required],
        verificationDocuments: [[]],
      }),
      availability: this.fb.array(this.weekDays.map((_, dayOfWeek) => this.fb.group({
        dayOfWeek: [dayOfWeek],
        isAvailable: [false],
        startTime: ['09:00'],
        endTime: ['17:00']
      })))
    });
  }

  loadSpecializations(): void {
    this.specializationService.getSpecializations().subscribe({
      next: (data) => {
        this.specializations = data;
      },
      error: (err) => {
        console.error('Failed to load specializations', err);
      }
    });
  }

  loadHospitals(): void {
    this.hospitalService.getHospitalList().subscribe({
      next: (data) => {
        this.hospitals = data;
      },
      error: (err) => {
        console.error('Failed to load hospitals', err);
      }
    });
  }

  loadCurrentUser(): void {
    this.loading = true;

    this.doctorProfileService.getProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.user = response.data;
          this.authService.setCurrentUser(response.data);
          this.populateForms();
          this.updateFormAccess();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load user profile';
      }
    });
  }

  populateForms(): void {
    if (!this.user) return;

    this.profileForm.get('basic')?.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone,
      role: this.user.role,
      dateOfBirth: this.user.dateOfBirth ? this.formatDate(this.user.dateOfBirth) : '',
      gender: this.user.gender || '',
      address: this.user.address || '',
      city: this.user.city || '',
      state: this.user.state || '',
      pincode: this.user.pincode || '',
      country: this.user.country || 'India'
    });

    if (this.user.doctorProfile) {
      const d = this.user.doctorProfile;

      this.profileForm.get('doctor')?.patchValue({
        hospitalId: d.hospitalId || '',
        registrationNumber: d.registrationNumber || '',
        qualification: d.qualification || '',
        specializationId: d.specializationId || '',
        yearsOfExperience: d.yearsOfExperience ? Number(d.yearsOfExperience) : '',
        consultationFee: d.consultationFee ? Number(d.consultationFee) : '',
        verificationDocuments: d.verificationDocuments || []
      });

      const schedule = d.availability || (d.availabilities || []).map(slot => ({
        dayOfWeek: slot.day_of_week,
        startTime: String(slot.start_time).slice(0, 5),
        endTime: String(slot.end_time).slice(0, 5),
        isAvailable: slot.is_available
      }));
      this.availabilityArray.controls.forEach((control, dayOfWeek) => {
        const slot = schedule.find(item => item.dayOfWeek === dayOfWeek);
        control.patchValue(slot || { dayOfWeek, isAvailable: false, startTime: '09:00', endTime: '17:00' });
      });
    }
  }

  get availabilityArray(): FormArray {
    return this.profileForm.get('availability') as FormArray;
  }

  get availabilityControls(): FormGroup[] {
    return this.availabilityArray.controls as FormGroup[];
  }

  get hasInvalidAvailability(): boolean {
    return this.availabilityControls.some(control => {
      const value = control.getRawValue();
      return value.isAvailable && (!value.startTime || !value.endTime || value.startTime >= value.endTime);
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isStepValid(index: number): boolean {
    const step = this.steps[index];
    if (!step || !this.profileForm) return true;
    // Step 5 (availability) — validate every FormArray row via hasInvalidAvailability.
    if (index === 4) return !this.hasInvalidAvailability;
    return step.controls.every(path => {
      const control = this.profileForm.get(path);
      return !control || control.valid || control.disabled;
    });
  }

  isStepComplete(index: number): boolean {
    return index < this.currentStep && this.isStepValid(index);
  }

  markStepTouched(index: number): void {
    const step = this.steps[index];
    if (!step) return;
    if (index === 4) {
      this.availabilityControls.forEach(control => this.markFormGroupTouched(control));
      return;
    }
    step.controls.forEach(path => this.profileForm.get(path)?.markAsTouched());
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;
    if (index > this.currentStep && !this.isStepValid(this.currentStep)) {
      this.markStepTouched(this.currentStep);
      return;
    }
    this.currentStep = index;
    this.visitedSteps.add(index);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.markStepTouched(this.currentStep);
      return;
    }
    if (this.currentStep < this.steps.length - 1) {
      this.goToStep(this.currentStep + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.goToStep(this.currentStep - 1);
    }
  }

  get progressPercent(): number {
    if (this.steps.length <= 1) return 100;
    return (this.currentStep / (this.steps.length - 1)) * 100;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }

  get isFirstStep(): boolean {
    return this.currentStep === 0;
  }

  onDoctorDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      this.doctorDocuments.push(file);
    });
  }

  removeDoctorDocument(index: number): void {
    this.doctorDocuments.splice(index, 1);
  }

  get uploadedDoctorDocuments() {
    return this.user?.doctorProfile?.verificationDocuments || [];
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
    const profile = this.user?.doctorProfile;
    const isFinal = ['approved', 'rejected', 'changes_requested'].includes(this.reviewStatus);
    return [
      { label: 'Draft', date: this.user?.createdAt, comment: 'Profile created and available for editing.', complete: this.reviewStatus !== 'unknown', active: this.reviewStatus === 'draft' },
      { label: 'Submitted', date: profile?.submittedAt, comment: 'Profile submitted for verification.', complete: ['submitted', 'under_review', 'approved', 'rejected', 'changes_requested'].includes(this.reviewStatus), active: this.reviewStatus === 'submitted' },
      { label: 'Pending for Review', date: this.reviewStatus === 'under_review' ? profile?.reviewedAt : null, comment: this.reviewStatus === 'under_review' ? 'Your profile is being reviewed by the administration team.' : 'Profile queued for administrative review.', complete: ['under_review', 'approved', 'rejected', 'changes_requested'].includes(this.reviewStatus), active: this.reviewStatus === 'under_review' },
      { label: isFinal ? this.reviewStatusLabel : 'Decision', date: isFinal ? profile?.reviewedAt : null, comment: isFinal ? (profile?.reviewNotes || profile?.rejectionReason || 'Review decision recorded.') : 'Awaiting reviewer decision.', reviewer: isFinal ? profile?.reviewedBy?.name : null, complete: isFinal, active: isFinal, outcome: true }
    ];
  }

  private updateFormAccess(): void {
    if (this.isProfileEditable) {
      this.profileForm.enable({ emitEvent: false });
      this.profileForm.get('basic.email')?.disable({ emitEvent: false });
      this.profileForm.get('basic.role')?.disable({ emitEvent: false });
    } else {
      this.profileForm.disable({ emitEvent: false });
    }
  }

  submitForReview(): void {
    this.isSubmittingReview = true;
    this.error = '';
    this.success = '';

    this.doctorProfileService.submitForReview().subscribe({
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
          : (err.error?.message || 'Failed to submit profile for review. Please try again.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  onSubmit(): void {
    if (!this.isProfileEditable) {
      this.error = 'Profile can only be updated while in Draft or Returned status.';
      return;
    }
    const basicGroup = this.profileForm.get('basic') as FormGroup;
    const doctorGroup = this.profileForm.get('doctor') as FormGroup;

    if (!basicGroup.valid || !doctorGroup.valid || this.hasInvalidAvailability) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      this.markFormGroupTouched(doctorGroup);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      user: { ...basicGroup.getRawValue() },
      doctorProfile: { ...doctorGroup.value },
      availability: this.availabilityControls
        .map(control => control.getRawValue())
        .filter(slot => slot.isAvailable)
    };

    delete payload.user.email;
    delete payload.user.role;

    this.doctorProfileService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile updated successfully!';
          this.error = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });

          if (this.doctorDocuments.length) {
            this.uploadDocuments();
          }
        } else {
          this.error = response.message || 'Failed to update profile';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error updating profile:', err);
        this.error = err.error?.message || 'Failed to update profile. Please try again.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  private uploadDocuments(): void {
    const filesToUpload = [...this.doctorDocuments];

    this.doctorProfileService.uploadDocuments(filesToUpload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.doctorDocuments = [];
          this.success = 'Profile and documents updated successfully!';
        }
      },
      error: (err) => {
        console.error('Error uploading documents:', err);
        this.error = err.error?.message || 'Profile saved, but document upload failed. Please try again.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  private formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
