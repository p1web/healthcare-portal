import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { User } from '../../../models/user.model';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  profile: User | null = null;
  isLoading = true;
  isSubmitting = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: [''],
      city: [''],
      state: [''],
      pincode: ['', Validators.pattern(/^\d{6}$/)],
      country: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  get initials(): string {
    return (this.profile?.name || 'Admin')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  loadProfile(): void {
    this.isLoading = true;
    this.error = '';
    this.adminService.getProfile().subscribe({
      next: response => {
        this.profile = response.data;
        this.profileForm.patchValue(response.data);
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.adminService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: response => {
        this.profile = response.data;
        this.profileForm.patchValue(response.data);
        this.authService.setCurrentUser(response.data);
        this.success = response.message;
        this.isSubmitting = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Failed to update profile.';
        this.isSubmitting = false;
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    return !!(control?.invalid && control.touched);
  }
}
