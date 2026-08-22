import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { HospitalProfileService } from '../../../services/hospital-profile.service';

@Component({
  standalone: true,
  selector: 'app-hospital-profile',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './hospital-profile.component.html',
  styleUrl: './hospital-profile.component.css'
})
export class HospitalProfileComponent implements OnInit {
  hospitalDocuments: File[] = [];
  profileForm!: FormGroup;
  user: User | null = null;
  isSubmitting: boolean = false;
  error: string = '';
  success: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private hospitalProfileService: HospitalProfileService,
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentUser();
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

    if (this.user.hospitalProfile) {
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

  onSubmit(): void {
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
