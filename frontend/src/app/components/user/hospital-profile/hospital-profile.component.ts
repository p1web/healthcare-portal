import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import type { ProfileReviewStatus } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { HospitalProfileService } from '../../../services/hospital-profile.service';
import { Specialty, SpecialtyService } from '../../../services/specialty.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-hospital-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './hospital-profile.component.html',
  styleUrl: './hospital-profile.component.css'
})
export class HospitalProfileComponent implements OnInit {
  hospitalDocuments: File[] = [];
  specialties: Specialty[] = [];
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  isSubmittingReview: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  readonly imageRules = {
    logo: {
      label: 'Profile / Logo',
      description: 'Shown next to your hospital name on the public listing.',
      maxSizeLabel: '2 MB',
      dimensionsLabel: '200×200px – 2048×2048px',
      aspectLabel: 'square (about 1:1)',
      accept: 'image/jpeg,image/png,image/webp'
    },
    banner: {
      label: 'Banner',
      description: 'Wide hero image shown on your public detail page.',
      maxSizeLabel: '5 MB',
      dimensionsLabel: '1200×300px – 3840×1440px',
      aspectLabel: 'wide (between 2:1 and 6:1)',
      accept: 'image/jpeg,image/png,image/webp'
    }
  };
  imageBusy: { logo: boolean; banner: boolean } = { logo: false, banner: false };
  imageError: { logo: string; banner: string } = { logo: '', banner: '' };
  readonly imageSlots: Array<'logo' | 'banner'> = ['logo', 'banner'];
  // Multi-step wizard state
  currentStep = 1;
  readonly stepDefs: { label: string; icon: string; groupPath: 'basic' | 'hospital' | null; controlNames: string[] }[] = [
    {
      label: 'Review Status',
      icon: 'bi-shield-check',
      groupPath: null,
      controlNames: []
    },
    {
      label: 'Account Holder',
      icon: 'bi-person-lines-fill',
      groupPath: 'basic',
      controlNames: ['name', 'phone', 'dateOfBirth', 'gender', 'address', 'city', 'state', 'pincode']
    },
    {
      label: 'Hospital Info',
      icon: 'bi-building',
      groupPath: 'hospital',
      controlNames: [
        'hospitalName', 'hospitalEmail', 'hospitalPhone', 'emergencyContactNumber',
        'hospitalAddress', 'hospitalCity', 'hospitalState', 'hospitalPincode',
        'website', 'registrationNumber', 'establishedYear', 'totalBeds',
        'hospitalType', 'operatingHours'
      ]
    },
    {
      label: 'Specialties & Services',
      icon: 'bi-heart-pulse',
      groupPath: 'hospital',
      controlNames: ['bio', 'specialtyIds', 'emergencyServices', 'ambulanceServices']
    },
    {
      label: 'Public Images',
      icon: 'bi-image',
      groupPath: null,
      controlNames: []
    },
    {
      label: 'Verification Documents',
      icon: 'bi-file-earmark-medical',
      groupPath: null,
      controlNames: []
    }
  ];

  get totalSteps(): number { return this.stepDefs.length; }
  get isLastStep(): boolean { return this.currentStep === this.totalSteps; }
  get isFirstStep(): boolean { return this.currentStep === 1; }
  get progressPercent(): number { return Math.round((this.currentStep / this.totalSteps) * 100); }

  isStepComplete(index: number): boolean {
    return index + 1 < this.currentStep && this.isStepValid(index);
  }

  isStepValid(index: number): boolean {
    const def = this.stepDefs[index];
    if (!def?.groupPath) return true;
    return def.controlNames.every((name) => {
      const control = this.profileForm.get(`${def.groupPath}.${name}`);
      return !control || control.disabled || control.valid;
    });
  }

  private markStepTouched(index: number): void {
    const def = this.stepDefs[index];
    if (!def?.groupPath) return;
    def.controlNames.forEach((name) => {
      this.profileForm.get(`${def.groupPath}.${name}`)?.markAsTouched();
    });
  }

  nextStep(): void {
    if (!this.isProfileEditable) {
      if (this.currentStep < this.totalSteps) this.currentStep++;
      return;
    }
    if (!this.isStepValid(this.currentStep - 1)) {
      this.markStepTouched(this.currentStep - 1);
      this.error = 'Please complete the required fields in this step.';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    this.error = '';
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps || step === this.currentStep) return;
    if (step < this.currentStep || !this.isProfileEditable) {
      this.currentStep = step;
      this.error = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    for (let i = this.currentStep - 1; i < step - 1; i++) {
      if (!this.isStepValid(i)) {
        this.markStepTouched(i);
        this.currentStep = i + 1;
        this.error = 'Complete this step before continuing.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    this.currentStep = step;
    this.error = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private hospitalProfileService: HospitalProfileService,
    private specialtyService: SpecialtyService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    this.loadSpecialties();
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
      hospital: this.fb.group({
        hospitalName: ['', [Validators.required, Validators.minLength(2)]],
        hospitalEmail: ['', [Validators.required, Validators.email]],
        hospitalPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
        emergencyContactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
        hospitalAddress: ['', Validators.required],
        hospitalCity: ['', Validators.required],
        hospitalState: ['', Validators.required],
        hospitalPincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
        website: ['', Validators.pattern(/^https?:\/\/.+/i)],
        registrationNumber: ['', Validators.required],
        bio: ['', Validators.maxLength(2000)],
        specialtyIds: [[], Validators.required],
        establishedYear: ['', [
          Validators.min(1800),
          Validators.max(new Date().getFullYear())
        ]],
        totalBeds: ['', Validators.min(0)],
        hospitalType: ['', Validators.required],
        operatingHours: [''],
        defaultConsultationFee: [500, [Validators.required, Validators.min(0)]],
        emergencyServices: [false],
        ambulanceServices: [false],
        verificationDocuments: [[]]
      })
    });
  }

  loadSpecialties(): void {
    this.specialtyService.getSpecialties().subscribe({
      next: (data) => {
        this.specialties = data;
      },
      error: (err) => {
        console.error('Failed to load specialties', err);
        this.error = 'Failed to load specialties. Please refresh and try again.';
      }
    });
  }

  isSpecialtySelected(specialtyId: number): boolean {
    return (this.profileForm.get('hospital.specialtyIds')?.value || []).includes(specialtyId);
  }

  toggleSpecialty(specialtyId: number, checked: boolean): void {
    const control = this.profileForm.get('hospital.specialtyIds');
    const selected = new Set<number>(control?.value || []);

    if (checked) {
      selected.add(specialtyId);
    } else {
      selected.delete(specialtyId);
    }

    control?.setValue(Array.from(selected));
    control?.markAsTouched();
  }

  loadCurrentUser(): void {
    this.loading = true;

    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
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

    if (this.user.hospitalProfile) {
      const h = this.user.hospitalProfile;
      this.profileForm.get('hospital')?.patchValue({
        hospitalName: h.hospitalName || '',
        hospitalEmail: h.hospitalEmail || '',
        hospitalPhone: h.hospitalPhone || '',
        emergencyContactNumber: h.emergencyContactNumber || '',
        hospitalAddress: h.hospitalAddress || '',
        hospitalCity: h.hospitalCity || '',
        hospitalState: h.hospitalState || '',
        hospitalPincode: h.hospitalPincode || '',
        website: h.website || '',
        registrationNumber: h.registrationNumber || '',
        bio: h.bio || '',
        specialtyIds: h.specialtyIds || [],
        establishedYear: h.establishedYear || '',
        totalBeds: h.totalBeds || '',
        hospitalType: h.hospitalType || '',
        operatingHours: h.operatingHours || '',
        defaultConsultationFee: h.defaultConsultationFee != null ? Number(h.defaultConsultationFee) : 500,
        emergencyServices: !!h.emergencyServices,
        ambulanceServices: !!h.ambulanceServices,
        verificationDocuments: h.verificationDocuments || []
      });
    }
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

  onHospitalDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      this.hospitalDocuments.push(file);
    });
  }

  removeHospitalDocument(index: number): void {
    this.hospitalDocuments.splice(index, 1);
  }

  get uploadedHospitalDocuments() {
    return this.user?.hospitalProfile?.verificationDocuments || [];
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
    const hospitalGroup = this.profileForm.get('hospital') as FormGroup;

    if (!basicGroup.valid || !hospitalGroup.valid) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      this.markFormGroupTouched(hospitalGroup);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      user: { ...basicGroup.getRawValue() },
      hospitalProfile: { ...hospitalGroup.value }
    };

    delete payload.user.email;
    delete payload.user.role;

    this.hospitalProfileService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile updated successfully!';
          this.error = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });

          if (this.hospitalDocuments.length) {
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
    const filesToUpload = [...this.hospitalDocuments];

    this.hospitalProfileService.uploadDocuments(filesToUpload).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.hospitalDocuments = [];
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

  // -----------------------------------------------------------------
  // Public profile & banner image uploads (require admin approval to
  // appear on the public listing / detail pages).
  // -----------------------------------------------------------------
  readonly apiHost = environment.apiHost;

  get profileImageUrl(): string | null { return this.buildImageUrl(this.user?.hospitalProfile?.profileImageUrl); }
  get profileImagePublished(): boolean { return !!this.user?.hospitalProfile?.profileImagePublished; }

  get bannerImageUrl(): string | null { return this.buildImageUrl(this.user?.hospitalProfile?.bannerImageUrl); }
  get bannerImagePublished(): boolean { return !!this.user?.hospitalProfile?.bannerImagePublished; }

  hasImage(slot: 'logo' | 'banner'): boolean {
    return slot === 'logo' ? !!this.profileImageUrl : !!this.bannerImageUrl;
  }

  isImagePublished(slot: 'logo' | 'banner'): boolean {
    return slot === 'logo' ? this.profileImagePublished : this.bannerImagePublished;
  }

  imageStatusBadgeClass(slot: 'logo' | 'banner'): string {
    if (!this.hasImage(slot)) return 'badge bg-secondary';
    return this.isImagePublished(slot) ? 'badge bg-success' : 'badge bg-secondary';
  }

  imageStatusLabel(slot: 'logo' | 'banner'): string {
    if (!this.hasImage(slot)) return 'Not uploaded';
    return this.isImagePublished(slot) ? 'Published — Visible publicly' : 'Unpublished — Hidden from public pages';
  }

  private buildImageUrl(url?: string | null): string | null {
    if (!url) return null;
    return /^https?:\/\//i.test(url) ? url : `${this.apiHost}${url}`;
  }

  onPublicImageSelected(slot: 'logo' | 'banner', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.imageError[slot] = '';
    this.imageBusy[slot] = true;

    this.hospitalProfileService.uploadPublicImage(slot, file).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, {
          url: response?.data?.url,
          published: !!response?.data?.published
        });
        this.success = response?.message || 'Image uploaded. Turn on Publish when you are ready.';
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        this.imageError[slot] = err.error?.message || 'Image upload failed. Please try again.';
      }
    });
  }

  removePublicImage(slot: 'logo' | 'banner'): void {
    this.imageError[slot] = '';
    this.imageBusy[slot] = true;
    this.hospitalProfileService.removePublicImage(slot).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, { url: null, published: false });
        this.success = response?.message || 'Image removed.';
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        this.imageError[slot] = err.error?.message || 'Failed to remove image.';
      }
    });
  }

  togglePublicImagePublished(slot: 'logo' | 'banner', event: Event): void {
    const desired = (event.target as HTMLInputElement).checked;
    this.imageError[slot] = '';
    this.imageBusy[slot] = true;
    this.hospitalProfileService.setPublicImagePublished(slot, desired).subscribe({
      next: (response: any) => {
        this.imageBusy[slot] = false;
        this.patchImageSlot(slot, {
          url: slot === 'logo' ? this.user?.hospitalProfile?.profileImageUrl ?? null : this.user?.hospitalProfile?.bannerImageUrl ?? null,
          published: !!response?.data?.published
        });
        this.success = response?.message || (desired ? 'Image published.' : 'Image unpublished.');
      },
      error: (err) => {
        this.imageBusy[slot] = false;
        (event.target as HTMLInputElement).checked = !desired;
        this.imageError[slot] = err.error?.message || 'Failed to update publish state.';
      }
    });
  }

  private patchImageSlot(
    slot: 'logo' | 'banner',
    update: { url: string | null; published: boolean }
  ): void {
    if (!this.user) return;
    const profile = this.user.hospitalProfile || {};
    const patched = { ...profile } as any;
    if (slot === 'logo') {
      patched.profileImageUrl = update.url;
      patched.profileImagePublished = update.published;
      patched.profileImageUploadedAt = update.url ? new Date().toISOString() : null;
    } else {
      patched.bannerImageUrl = update.url;
      patched.bannerImagePublished = update.published;
      patched.bannerImageUploadedAt = update.url ? new Date().toISOString() : null;
    }
    this.user = { ...this.user, hospitalProfile: patched };
  }
}
