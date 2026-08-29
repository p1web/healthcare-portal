import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  standalone: true,
  selector: 'app-admin-commission-settings',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './commission-settings.component.html',
  styleUrl: './commission-settings.component.css'
})
export class AdminCommissionSettingsComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  isSaving = false;
  error = '';
  success = '';
  updatedAt: string | null = null;

  constructor(private fb: FormBuilder, private admin: AdminService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      defaultSoloCommissionPercent: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      defaultSplitPlatformCommissionPercent: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      defaultSplitHospitalPayoutPercent: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      defaultSplitDoctorPayoutPercent: [75, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.admin.getCommissionSettings().subscribe({
      next: (res: any) => {
        this.form.patchValue({
          defaultSoloCommissionPercent: res.data.defaultSoloCommissionPercent,
          defaultSplitPlatformCommissionPercent: res.data.defaultSplitPlatformCommissionPercent,
          defaultSplitHospitalPayoutPercent: res.data.defaultSplitHospitalPayoutPercent,
          defaultSplitDoctorPayoutPercent: res.data.defaultSplitDoctorPayoutPercent
        });
        this.updatedAt = res.data.updatedAt || null;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load settings';
        this.isLoading = false;
      }
    });
  }

  get splitSum(): number {
    const v = this.form.value;
    return Number(v.defaultSplitPlatformCommissionPercent || 0)
      + Number(v.defaultSplitHospitalPayoutPercent || 0)
      + Number(v.defaultSplitDoctorPayoutPercent || 0);
  }

  submit(): void {
    this.error = '';
    this.success = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.splitSum > 100) {
      this.error = 'Split percents must sum to 100 or less.';
      return;
    }
    this.isSaving = true;
    this.admin.updateCommissionSettings(this.form.value).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Commission defaults updated. New practices (and admin resets) will use these values.';
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to update settings';
      }
    });
  }
}
