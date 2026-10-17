import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { User } from '../../../models/user.model';
import type { ProfileReviewStatus } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { DoctorProfileService } from '../../../services/doctor-profile.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';
import { QualificationService, Qualification } from '../../../services/qualification.service';
import { PracticeService, Practice } from '../../../services/practice.service';
import { LocationMasterService, LocationState } from '../../../services/location-master.service';
import { environment } from '../../../../environments/environment';
import { districtsForState } from '../../../shared/data/location-master.options';
import { ProfileSaveConfirmationService } from '../../../shared/profile-save-confirmation';

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface DocUploadItem {
  file: File;
  status: UploadStatus;
  progress: number;   // 0-100
  errorMsg: string;
}

@Component({
  standalone: true,
  selector: 'app-doctor-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  doctorDocuments: DocUploadItem[] = [];
  specializations: Specializations[] = [];
  qualifications: Qualification[] = [];
  practices: Practice[] = [];
  locationStates: LocationState[] = [];
  isLoadingLocations = false;
  isLoadingPractices = false;
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  isUploadingAvatar = false;
  avatarError = '';
  readonly apiHost = environment.apiHost;
  error: string = '';
  success: string = '';
  loading: boolean = false;
  isDownloadingDoc: number | null = null;

  currentStep = 0;
  visitedSteps = new Set<number>([0]);

  readonly steps = [
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
      controls: ['basic.address', 'basic.districtId', 'basic.stateId', 'basic.pincode']
    },
    {
      title: 'Professional',
      subtitle: 'Credentials',
      icon: 'bi-briefcase',
      controls: [
        'doctor.registrationNumber', 'doctor.qualificationId',
        'doctor.specializationId', 'doctor.yearsOfExperience'
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
    private imageUploadService: ImageUploadService,
    private specializationService: SpecializationService,
    private qualificationService: QualificationService,
    private practiceService: PracticeService,
    private locationMasterService: LocationMasterService,
    private profileSaveConfirmation: ProfileSaveConfirmationService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    this.loadSpecializations();
    this.loadQualifications();
    this.loadPractices();
    this.loadLocationStates();
  }

  initializeForm(): void {
    this.profileForm = this.fb.group({
      basic: this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        role: [{ value: '', disabled: true }],
        dateOfBirth: ['', Validators.required],
        gender: ['', Validators.required],
        address: ['', Validators.required],
        districtId: ['', Validators.required],
        stateId: ['', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
        country: ['India']
      }),
      doctor: this.fb.group({
        registrationNumber: ['', Validators.required],
        qualificationId: ['', Validators.required],
        specializationId: ['', Validators.required],
        yearsOfExperience: ['', Validators.required],
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

  loadQualifications(): void {
    this.qualificationService.getQualifications().subscribe({
      next: (data) => {
        this.qualifications = data;
      },
      error: (err) => {
        console.error('Failed to load qualifications', err);
      }
    });
  }

  loadPractices(): void {
    this.isLoadingPractices = true;
    this.practiceService.listMine().subscribe({
      next: (res) => {
        this.practices = res.data || [];
        this.isLoadingPractices = false;
      },
      error: () => {
        this.practices = [];
        this.isLoadingPractices = false;
      }
    });
  }

  get primaryPractice(): Practice | null {
    return this.practices.find(p => p.isPrimary && p.isActive) || null;
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
      districtId: this.user.districtId ?? '',
      stateId: this.user.stateId ?? '',
      pincode: this.user.pincode || '',
      country: this.user.country || 'India'
    });

    if (this.user.doctorProfile) {
      const d = this.user.doctorProfile;

      this.profileForm.get('doctor')?.patchValue({
        registrationNumber: d.registrationNumber || '',
        qualificationId: d.qualificationId ?? d.qualification?.id ?? '',
        specializationId: d.specializationId || '',
        yearsOfExperience: d.yearsOfExperience ? Number(d.yearsOfExperience) : '',
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

  get hasAvailableDay(): boolean {
    return this.availabilityControls.some(control => control.get('isAvailable')?.value);
  }

  getDistrictOptions(stateId: number | string | null): LocationState['districts'] {
    return districtsForState(this.locationStates, stateId);
  }

  private loadLocationStates(): void {
    this.isLoadingLocations = true;
    this.locationMasterService.getStates().subscribe({
      next: states => {
        this.locationStates = states;
        this.isLoadingLocations = false;
      },
      error: () => {
        this.isLoadingLocations = false;
        this.error = 'Failed to load state and district options.';
      }
    });
  }

  onBasicStateChange(): void {
    this.profileForm.get('basic.districtId')?.setValue('');
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
    // Availability validates every FormArray row via hasInvalidAvailability.
    if (index === 3) return this.hasAvailableDay && !this.hasInvalidAvailability;
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
    if (index === 3) {
      this.availabilityControls.forEach(control => this.markFormGroupTouched(control));
      return;
    }
    step.controls.forEach(path => this.profileForm.get(path)?.markAsTouched());
  }

  goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) return;
    if (index > this.currentStep) {
      for (let stepIndex = this.currentStep; stepIndex < index; stepIndex++) {
        if (!this.isStepValid(stepIndex)) {
          this.currentStep = stepIndex;
          this.visitedSteps.add(stepIndex);
          this.markStepTouched(stepIndex);
          return;
        }
      }
    }
    this.currentStep = index;
    this.visitedSteps.add(index);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextStep(): void {
    if (!this.isStepValid(this.currentStep)) {
      this.visitedSteps.add(this.currentStep);
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

    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const MAX_SIZE_MB = 5;

    Array.from(input.files).forEach(file => {
      // Duplicate guard — skip if same name+size already queued
      const isDuplicate = this.doctorDocuments.some(
        d => d.file.name === file.name && d.file.size === file.size
      );
      if (isDuplicate) return;

      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.doctorDocuments.push({
          file,
          status: 'error',
          progress: 0,
          errorMsg: 'Only PDF, JPG, PNG allowed'
        });
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        this.doctorDocuments.push({
          file,
          status: 'error',
          progress: 0,
          errorMsg: `File exceeds ${MAX_SIZE_MB} MB limit`
        });
        return;
      }

      this.doctorDocuments.push({ file, status: 'idle', progress: 0, errorMsg: '' });
    });

    // Reset input so the same file can be re-selected after removal
    input.value = '';
  }

  removeDoctorDocument(index: number): void {
    // Don't remove while actively uploading
    if (this.doctorDocuments[index]?.status === 'uploading') return;
    this.doctorDocuments.splice(index, 1);
  }

  uploadSingleDocument(index: number): void {
    const item = this.doctorDocuments[index];
    if (!item || item.status === 'uploading' || item.status === 'done') return;

    item.status = 'uploading';
    item.progress = 0;
    item.errorMsg = '';

    this.doctorProfileService.uploadDocumentToAzure(item.file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          item.progress = Math.round((event.loaded / event.total) * 100);
        } else if (event.type === HttpEventType.Response) {
          item.status = 'done';
          item.progress = 100;
          // Refresh uploaded docs list from server response
          if (event.body?.success && event.body?.data) {
            this.user = event.body.data;
            this.authService.setCurrentUser(event.body.data);
          }
        }
      },
      error: (err: any) => {
        item.status = 'error';
        item.errorMsg = err?.error?.message || 'Upload failed. Try again.';
      }
    });
  }

  get allDocumentsUploaded(): boolean {
    return this.doctorDocuments.length > 0 &&
      this.doctorDocuments.every(d => d.status === 'done');
  }

  get hasPendingDocuments(): boolean {
    return this.doctorDocuments.some(d => d.status === 'idle' || d.status === 'error');
  }

  get doneDocumentsCount(): number {
    return this.doctorDocuments.filter(d => d.status === 'done').length;
  }

  viewUploadedDocument(index: number, doc: any): void {
    this.isDownloadingDoc = index;
    this.doctorProfileService.downloadDocument(index).subscribe({
      next: (blob: Blob) => {
        this.isDownloadingDoc = null;
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: (err: any) => {
        this.isDownloadingDoc = null;
        console.error('Error viewing document:', err);
        alert('Failed to load document: ' + (err?.error?.message || 'Storage error'));
      }
    });
  }

  get uploadedDoctorDocuments() {
    return this.user?.doctorProfile?.verificationDocuments || [];
  }

  get reviewStatus(): ProfileReviewStatus | 'unknown' {
    return this.user?.doctorProfile?.verificationStatus || 'unknown';
  }

  get canSubmitForReview(): boolean {
    return this.reviewStatus === 'draft' || this.reviewStatus === 'changes_requested';
  }

  get isProfileEditable(): boolean {
    return this.canSubmitForReview;
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

  async onSubmit(): Promise<void> {
    if (!this.isProfileEditable) {
      this.error = 'Profile can only be updated while in Draft or Returned status.';
      return;
    }
    const basicGroup = this.profileForm.get('basic') as FormGroup;
    const doctorGroup = this.profileForm.get('doctor') as FormGroup;

    if (!basicGroup.valid || !doctorGroup.valid || !this.hasAvailableDay || this.hasInvalidAvailability) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      this.markFormGroupTouched(doctorGroup);
      return;
    }
    if (!await this.profileSaveConfirmation.confirm()) return;

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
          this.error = '';

          if (this.hasPendingDocuments) {
            this.success = 'Profile updated! Remember to click "Upload" on your selected documents to upload them to Azure.';
          } else {
            this.success = response.message || 'Profile updated successfully!';
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Kept for backwards-compatibility; Azure upload is now done per-file via uploadSingleDocument()
  private uploadDocuments(): void {
    const filesToUpload = this.doctorDocuments
      .filter(d => d.status === 'idle')
      .map(d => d.file);
    if (!filesToUpload.length) return;

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

  profileImageUrl(): string | null {
    const img = this.user?.profileImage;
    if (!img) return null;
    return img.startsWith('http') ? img : `${this.apiHost}${img}`;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    this.avatarError = '';
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError = 'Please pick a JPG, PNG, or WEBP image.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError = 'Image must be under 5 MB.';
      return;
    }
    this.isUploadingAvatar = true;
    this.imageUploadService.upload('doctor-avatar', file).subscribe({
      next: (res) => {
        this.isUploadingAvatar = false;
        if (res.url && this.user) {
          this.user = { ...this.user, profileImage: res.url };
          this.authService.setCurrentUser(this.user);
          this.success = 'Profile picture updated.';
          setTimeout(() => (this.success = ''), 3000);
        }
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.avatarError = err?.error?.message || 'Failed to update profile picture.';
      }
    });
  }
}
