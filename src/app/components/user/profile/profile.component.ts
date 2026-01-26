import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { User, PatientProfile, DoctorProfile, } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { ProfileService } from '../../../services/profile.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';

@Component({  
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit {
  hospitalDocuments: File[] = [];
  doctorDocuments: File[] = [];
  specializations: Specializations[] = [];
  profileForm!: FormGroup;
  patientProfileForm!: FormGroup;
  user: User | null = null;
  currentStep: number = 1;
  isSubmitting: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;
  profileTitle: string = '';

  // Blood group options
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  bmi: number | null = null;
  bmiCategory: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private profileService: ProfileService,
    private specializationService: SpecializationService,
  ) { }

  ngOnInit(): void {
    this.setRoleSpecificInfo();    
    this.initializeForm();  // FIRST
    this.loadCurrentUser();  // SECOND
    this.setupBMICalculation();
    this.loadSpecializations();
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

      patient: this.fb.group({
        bloodGroup: [''],
        height: ['', [Validators.min(0), Validators.max(300)]],
        weight: ['', [Validators.min(0), Validators.max(500)]],
        allergies: [''],
        medicalConditions: [''],
        emergencyContactName: [''],
        emergencyContactPhone: ['', Validators.pattern(/^[0-9]{10}$/)],
        emergencyContactRelation: ['']
      }),

      doctor: this.fb.group({
        registrationNumber: ['', Validators.required],
        qualification: ['', Validators.required],
        specializationId: ['', Validators.required],
        yearsOfExperience: ['', Validators.required],
        consultationFee: ['', Validators.required],
        verificationDocuments: [[]],
      }),

      hospital: this.fb.group({
        registrationNumber: ['', Validators.required],
        establishedYear: ['', [
          Validators.min(1800),
          Validators.max(new Date().getFullYear())
        ]],
        totalBeds: ['', Validators.min(0)],
        hospitalType: ['', Validators.required],
        operatingHours: [''],
        emergencyServices: [false],
        ambulanceServices: [false],
        verificationDocuments: [[]]
      })

    });
  }


  setRoleSpecificInfo(): void {
    if(this.authService.getUserRole() === 'patient') {
      this.profileTitle = 'Patient Details';
    } else if(this.authService.getUserRole() === 'doctor') {
      this.profileTitle = 'Doctor Details';
    } else if(this.authService.getUserRole() === 'hospital') {
      this.profileTitle = 'Hospital Details'; 
    }else{
      this.profileTitle = 'User Profile';
    }
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

  loadCurrentUser(): void {
    this.loading = true;

    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
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
      dateOfBirth: this.user.dateOfBirth
        ? this.formatDate(this.user.dateOfBirth)
        : '',
      gender: this.user.gender || '',
      address: this.user.address || '',
      city: this.user.city || '',
      state: this.user.state || '',
      pincode: this.user.pincode || '',
      country: this.user.country || 'India'
    });

     // PATIENT PROFILE
    if (this.isPatient() && this.user.patientProfile) {
      const p = this.user.patientProfile;

      this.profileForm.get('patient')?.patchValue({
        bloodGroup: p.bloodGroup || '',
        height: p.height ? Number(p.height) : '',
        weight: p.weight ? Number(p.weight) : '',
        allergies: p.allergies?.join(', ') || '',
        medicalConditions: p.medicalConditions?.join(', ') || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '',
        emergencyContactRelation: p.emergencyContactRelation || ''
      });

      this.updateBMI(Number(p.height), Number(p.weight));
    }

     // DOCTOR PROFILE
    if (this.isDoctor() && this.user.doctorProfile) {
      
      const d = this.user.doctorProfile;
      
      this.profileForm.get('doctor')?.patchValue({
        registrationNumber: d.registrationNumber || '',
        qualification: d.qualification || '',
        specializationId: d.specializationId || '',
        yearsOfExperience: d.yearsOfExperience ? Number(d.yearsOfExperience) : '',
        consultationFee: d.consultationFee ? Number(d.consultationFee) : '',
        verificationDocuments: d.verificationDocuments || []
      });
    }

    if (this.isHospital() && this.user.hospitalProfile) {
      const h = this.user.hospitalProfile;
      this.profileForm.get('hospital')?.patchValue({
        registrationNumber: h.registrationNumber || '',
        establishedYear: h.establishedYear || '',
        totalBeds: h.totalBeds || '',
        hospitalType: h.hospitalType || '',
        operatingHours: h.operatingHours || '',
        emergencyServices: !!h.emergencyServices,
        ambulanceServices: !!h.ambulanceServices,
        verificationDocuments: h.verificationDocuments || []
      });
    }

  }


  nextStep(): void {
    const basicGroup = this.profileForm.get('basic') as FormGroup;

    if (basicGroup.valid) {
      this.currentStep = 2;
      this.success = '';
      this.error = '';
    } else {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
    }
  }

  previousStep(): void {
    this.currentStep = 1;
    this.success = '';
    this.error = '';
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

  /** Handle file selection */
  onDoctorDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      this.doctorDocuments.push(file);
    });
  }

  /** Remove selected file */
  removeDoctorDocument(index: number): void {
    this.doctorDocuments.splice(index, 1);
  }

  onSubmit(): void {
    const basicGroup = this.profileForm.get('basic') as FormGroup;
    const patientGroup = this.profileForm.get('patient') as FormGroup;

    // Validate both form groups
    if (!basicGroup.valid || (this.isPatient() && !patientGroup.valid)) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      if (this.isPatient()) {
        this.markFormGroupTouched(patientGroup);
      }
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Prepare data in the format expected by backend
    const payload = {
      user: {
        ...basicGroup.getRawValue()
      },
      patientProfile: this.isPatient() ? {
        ...patientGroup.value
      } : {}
    };

    // Remove email and role from user object as they're readonly
    delete payload.user.email;
    delete payload.user.role;

    // Call profile service to update
    this.profileService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        if (response.success) {
          this.authService.setCurrentUser(response.data);
          this.success = response.message || 'Profile updated successfully!';
          this.error = '';

          // Scroll to top to show success message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          this.error = response.message || 'Failed to update profile';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error updating profile:', err);
        this.error = err.error?.message || 'Failed to update profile. Please try again.';

        // Scroll to top to show error message
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

  private handleSuccess(message: string): void {
    this.success = message;
    this.isSubmitting = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private handleError(message: string): void {
    this.error = message;
    this.isSubmitting = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private stringToArray(value: string | null): string[] {
    return value
      ? value.split(',').map(v => v.trim()).filter(Boolean)
      : [];
  }


  calculateBMI(): string {
    const height = this.patientProfileForm.get('height')?.value;
    const weight = this.patientProfileForm.get('weight')?.value;

    if (height && weight && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }

    return '-';
  }

  private setupBMICalculation(): void {
    if (!this.patientProfileForm) return;

    this.patientProfileForm.valueChanges.subscribe(({ height, weight }) => {
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

  isPatient(): boolean {
    return this.authService.getUserRole() === 'patient';
  }

  isDoctor(): boolean {
    return this.authService.getUserRole() === 'doctor';
  }

  isHospital(): boolean {
    return this.authService.getUserRole() === 'hospital';
  }

  onHospitalDocumentsSelected(event:Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      this.hospitalDocuments.push(file);
    });
  }

}