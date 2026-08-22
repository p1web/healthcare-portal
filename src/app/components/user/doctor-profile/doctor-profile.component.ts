import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { DoctorProfileService } from '../../../services/doctor-profile.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';

@Component({
  standalone: true,
  selector: 'app-doctor-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './doctor-profile.component.html',
  styleUrl: './doctor-profile.component.css'
})
export class DoctorProfileComponent implements OnInit {
  doctorDocuments: File[] = [];
  specializations: Specializations[] = [];
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private doctorProfileService: DoctorProfileService,
    private specializationService: SpecializationService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
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
      doctor: this.fb.group({
        registrationNumber: ['', Validators.required],
        qualification: ['', Validators.required],
        specializationId: ['', Validators.required],
        yearsOfExperience: ['', Validators.required],
        consultationFee: ['', Validators.required],
        verificationDocuments: [[]],
      })
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
        registrationNumber: d.registrationNumber || '',
        qualification: d.qualification || '',
        specializationId: d.specializationId || '',
        yearsOfExperience: d.yearsOfExperience ? Number(d.yearsOfExperience) : '',
        consultationFee: d.consultationFee ? Number(d.consultationFee) : '',
        verificationDocuments: d.verificationDocuments || []
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

  onSubmit(): void {
    const basicGroup = this.profileForm.get('basic') as FormGroup;
    const doctorGroup = this.profileForm.get('doctor') as FormGroup;

    if (!basicGroup.valid || !doctorGroup.valid) {
      this.error = 'Please fill all required fields correctly.';
      this.markFormGroupTouched(basicGroup);
      this.markFormGroupTouched(doctorGroup);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      user: { ...basicGroup.getRawValue() },
      doctorProfile: { ...doctorGroup.value }
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
}
