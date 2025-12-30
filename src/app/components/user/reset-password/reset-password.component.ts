import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html'
})

export class ResetPasswordComponent {

  resetPasswordForm: FormGroup;
  token!: string;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) return;

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Call reset password API with token
    console.log('Reset token:', this.token);
  }
}
