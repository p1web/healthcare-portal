import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})

export class ChangePasswordComponent implements OnInit {

  changePasswordForm: FormGroup;
  isSubmitting = false;
  error = '';
  success = '';

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.error = 'New password and confirm password do not match';
      return;
    }

    this.isSubmitting = true;

    // Call API here
    console.log('Change password payload:', this.changePasswordForm.value);

    setTimeout(() => {
      this.isSubmitting = false;
      this.success = 'Password updated successfully';
      this.changePasswordForm.reset();
    }, 600);
  }
}
