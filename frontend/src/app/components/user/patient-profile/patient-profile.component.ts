import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { PatientAllergy, PatientMedicalCondition } from '../../../models/patient-medical-record.model';
import { AuthService } from '../../../services/auth.service';
import { PatientProfileService } from '../../../services/patient-profile.service';
import { PatientMedicalRecordService } from '../../../services/patient-medical-record.service';
import { LocationMasterService, LocationState } from '../../../services/location-master.service';
import { districtsForState } from '../../../shared/data/location-master.options';
import { ProfileSaveConfirmationService } from '../../../shared/profile-save-confirmation';

@Component({
  standalone: true,
  selector: 'app-patient-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './patient-profile.component.html',
  styleUrl: './patient-profile.component.css'
})
export class PatientProfileComponent implements OnInit {
  locationStates: LocationState[] = [];
  isLoadingLocations = false;
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  bmi: number | null = null;
  bmiCategory: string = '';

  allergies: PatientAllergy[] = [];
  medicalConditions: PatientMedicalCondition[] = [];
  allergySeverities = ['mild', 'moderate', 'severe'];
  newAllergy = { name: '', severity: '', reaction: '', diagnosedDate: '', notes: '' };
  newCondition = { name: '', diagnosedDate: '', notes: '' };
  medicalRecordError: string = '';

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
      subtitle: 'Where you live',
      icon: 'bi-geo-alt',
      controls: ['basic.address', 'basic.districtId', 'basic.stateId', 'basic.pincode']
    },
    {
      title: 'Medical',
      subtitle: 'Health snapshot',
      icon: 'bi-heart-pulse',
      controls: ['patient.bloodGroup', 'patient.height', 'patient.weight']
    },
    {
      title: 'Emergency',
      subtitle: 'Contact of trust',
      icon: 'bi-telephone',
      controls: ['patient.emergencyContactName', 'patient.emergencyContactPhone', 'patient.emergencyContactRelation']
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private patientProfileService: PatientProfileService,
    private medicalRecordService: PatientMedicalRecordService,
    private locationMasterService: LocationMasterService,
    private profileSaveConfirmation: ProfileSaveConfirmationService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
    this.setupBMICalculation();
    this.loadAllergies();
    this.loadMedicalConditions();
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
      patient: this.fb.group({
        bloodGroup: [''],
        height: ['', [Validators.min(0), Validators.max(300)]],
        weight: ['', [Validators.min(0), Validators.max(500)]],
        emergencyContactName: ['', Validators.required],
        emergencyContactPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
        emergencyContactRelation: ['', Validators.required]
      })
    });
  }

  loadCurrentUser(): void {
    this.loading = true;

    this.patientProfileService.getProfile().subscribe({
      next: (response) => {
        if (response.success) {
          this.user = response.data;
          this.authService.setCurrentUser(response.data);
          this.populateForms();
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

    if (this.user.patientProfile) {
      const p = this.user.patientProfile;

      this.profileForm.get('patient')?.patchValue({
        bloodGroup: p.bloodGroup || '',
        height: p.height ? Number(p.height) : '',
        weight: p.weight ? Number(p.weight) : '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergencyContactRelation || ''
      });

      this.updateBMI(Number(p.height), Number(p.weight));
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

  isStepValid(index: number): boolean {
    const step = this.steps[index];
    if (!step || !this.profileForm) return true;
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
    step.controls.forEach(path => this.profileForm.get(path)?.markAsTouched());
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

  async onSubmit(): Promise<void> {
    const basicGroup = this.profileForm.get('basic') as FormGroup;
    const patientGroup = this.profileForm.get('patient') as FormGroup;

    if (!basicGroup.valid || !patientGroup.valid) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      this.markFormGroupTouched(patientGroup);
      return;
    }
    if (!await this.profileSaveConfirmation.confirm()) return;

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      user: { ...basicGroup.getRawValue() },
      patientProfile: {
        ...patientGroup.value,
        bloodGroup: patientGroup.value.bloodGroup === '' ? null : patientGroup.value.bloodGroup,
        height: patientGroup.value.height === '' ? null : patientGroup.value.height,
        weight: patientGroup.value.weight === '' ? null : patientGroup.value.weight
      }
    };

    delete payload.user.email;
    delete payload.user.role;

    this.patientProfileService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile updated successfully!';
          this.error = '';
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

  private formatDate(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ---------------- ALLERGIES ----------------

  loadAllergies(): void {
    this.medicalRecordService.getAllergies().subscribe({
      next: (res) => this.allergies = res.data || [],
      error: (err) => console.error('Failed to load allergies', err)
    });
  }

  addAllergy(): void {
    if (!this.newAllergy.name.trim()) {
      this.medicalRecordError = 'Allergy name is required';
      return;
    }

    this.medicalRecordError = '';

    this.medicalRecordService.addAllergy({
      name: this.newAllergy.name.trim(),
      severity: (this.newAllergy.severity || null) as any,
      reaction: this.newAllergy.reaction || null,
      diagnosedDate: this.newAllergy.diagnosedDate || null,
      notes: this.newAllergy.notes || null
    }).subscribe({
      next: (res) => {
        this.allergies.unshift(res.data);
        this.newAllergy = { name: '', severity: '', reaction: '', diagnosedDate: '', notes: '' };
      },
      error: (err) => {
        this.medicalRecordError = err.error?.message || 'Failed to add allergy';
      }
    });
  }

  toggleAllergyStatus(allergy: PatientAllergy): void {
    const status = allergy.status === 'active' ? 'resolved' : 'active';

    this.medicalRecordService.updateAllergy(allergy.id, { status }).subscribe({
      next: (res) => {
        const index = this.allergies.findIndex(a => a.id === allergy.id);
        if (index > -1) this.allergies[index] = res.data;
      },
      error: (err) => console.error('Failed to update allergy', err)
    });
  }

  deleteAllergy(allergy: PatientAllergy): void {
    this.medicalRecordService.deleteAllergy(allergy.id).subscribe({
      next: () => {
        this.allergies = this.allergies.filter(a => a.id !== allergy.id);
      },
      error: (err) => console.error('Failed to delete allergy', err)
    });
  }

  // ---------------- MEDICAL CONDITIONS ----------------

  loadMedicalConditions(): void {
    this.medicalRecordService.getMedicalConditions().subscribe({
      next: (res) => this.medicalConditions = res.data || [],
      error: (err) => console.error('Failed to load medical conditions', err)
    });
  }

  addMedicalCondition(): void {
    if (!this.newCondition.name.trim()) {
      this.medicalRecordError = 'Condition name is required';
      return;
    }

    this.medicalRecordError = '';

    this.medicalRecordService.addMedicalCondition({
      name: this.newCondition.name.trim(),
      diagnosedDate: this.newCondition.diagnosedDate || null,
      notes: this.newCondition.notes || null
    }).subscribe({
      next: (res) => {
        this.medicalConditions.unshift(res.data);
        this.newCondition = { name: '', diagnosedDate: '', notes: '' };
      },
      error: (err) => {
        this.medicalRecordError = err.error?.message || 'Failed to add medical condition';
      }
    });
  }

  toggleConditionStatus(condition: PatientMedicalCondition): void {
    const status = condition.status === 'active' ? 'resolved' : 'active';

    this.medicalRecordService.updateMedicalCondition(condition.id, { status }).subscribe({
      next: (res) => {
        const index = this.medicalConditions.findIndex(c => c.id === condition.id);
        if (index > -1) this.medicalConditions[index] = res.data;
      },
      error: (err) => console.error('Failed to update medical condition', err)
    });
  }

  deleteMedicalCondition(condition: PatientMedicalCondition): void {
    this.medicalRecordService.deleteMedicalCondition(condition.id).subscribe({
      next: () => {
        this.medicalConditions = this.medicalConditions.filter(c => c.id !== condition.id);
      },
      error: (err) => console.error('Failed to delete medical condition', err)
    });
  }

  // ---------------- BMI ----------------

  private setupBMICalculation(): void {
    this.profileForm.get('patient')?.valueChanges.subscribe(({ height, weight }) => {
      this.updateBMI(height, weight);
    });
  }

  private updateBMI(height: number, weight: number): void {
    if (height && weight && height > 0) {
      const h = height / 100;
      this.bmi = +(weight / (h * h)).toFixed(1);
      this.bmiCategory = this.getBMICategory(this.bmi);
    } else {
      this.bmi = null;
      this.bmiCategory = '';
    }
  }

  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
}
