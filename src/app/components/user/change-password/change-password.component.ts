import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

interface PasswordRule {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  changePasswordForm: FormGroup;
  isSubmitting = false;
  error = '';
  success = '';

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  readonly rules: PasswordRule[] = [
    { key: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { key: 'upper',  label: 'One uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
    { key: 'lower',  label: 'One lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
    { key: 'number', label: 'One number (0–9)', test: (v) => /\d/.test(v) },
    { key: 'symbol', label: 'One special character (!@#$…)', test: (v) => /[^A-Za-z0-9]/.test(v) }
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: [this.matchPasswords, this.differentFromCurrent] }
    );
  }

  get newPasswordValue(): string {
    return this.changePasswordForm.get('newPassword')?.value || '';
  }

  get confirmPasswordValue(): string {
    return this.changePasswordForm.get('confirmPassword')?.value || '';
  }

  get satisfiedRules(): number {
    return this.rules.filter((r) => r.test(this.newPasswordValue)).length;
  }

  get strengthScore(): number {
    return this.newPasswordValue ? this.satisfiedRules : 0;
  }

  get strengthLabel(): string {
    const s = this.strengthScore;
    if (!this.newPasswordValue) return '';
    if (s <= 1) return 'Very weak';
    if (s === 2) return 'Weak';
    if (s === 3) return 'Fair';
    if (s === 4) return 'Good';
    return 'Strong';
  }

  get strengthClass(): string {
    const s = this.strengthScore;
    if (s <= 1) return 'strength-very-weak';
    if (s === 2) return 'strength-weak';
    if (s === 3) return 'strength-fair';
    if (s === 4) return 'strength-good';
    return 'strength-strong';
  }

  get strengthPercent(): number {
    return (this.strengthScore / this.rules.length) * 100;
  }

  get passwordsMatch(): boolean {
    return !!this.confirmPasswordValue && this.newPasswordValue === this.confirmPasswordValue;
  }

  ruleSatisfied(key: string): boolean {
    const rule = this.rules.find((r) => r.key === key);
    return rule ? rule.test(this.newPasswordValue) : false;
  }

  isFieldInvalid(name: string): boolean {
    const control = this.changePasswordForm.get(name);
    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const newPwd = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!newPwd || !confirm) return null;
    return newPwd === confirm ? null : { mismatch: true };
  }

  private differentFromCurrent(group: AbstractControl): ValidationErrors | null {
    const current = group.get('currentPassword')?.value;
    const newPwd = group.get('newPassword')?.value;
    if (!current || !newPwd) return null;
    return current === newPwd ? { sameAsCurrent: true } : null;
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      if (this.changePasswordForm.hasError('mismatch')) {
        this.error = 'New password and confirm password do not match.';
      } else if (this.changePasswordForm.hasError('sameAsCurrent')) {
        this.error = 'New password must be different from your current password.';
      }
      return;
    }

    if (this.satisfiedRules < 4) {
      this.error = 'Please meet at least 4 of the 5 password requirements.';
      return;
    }

    this.isSubmitting = true;

    // Simulate API — replace with real endpoint when the backend is wired.
    setTimeout(() => {
      this.isSubmitting = false;
      this.success = 'Password updated successfully. Please use your new password next time you sign in.';
      this.changePasswordForm.reset();
    }, 700);
  }

  onCancel(): void {
    this.router.navigate(['/profile']);
  }
}
