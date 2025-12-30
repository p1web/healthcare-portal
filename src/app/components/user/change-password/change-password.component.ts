import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './change-password.component.html'
})

export class ChangePasswordComponent {

  changePasswordForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) return;

    const { newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Call API here
    console.log('Change password payload:', this.changePasswordForm.value);
  }
}
