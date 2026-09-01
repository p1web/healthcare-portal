import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HospitalAvailabilityService, HospitalAvailabilitySlot } from '../../../services/hospital-availability.service';
import { HospitalProfileService } from '../../../services/hospital-profile.service';

@Component({
  standalone: true,
  selector: 'app-hospital-availability',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hospital-availability.component.html',
  styleUrl: './hospital-availability.component.css'
})
export class HospitalAvailabilityComponent implements OnInit {
  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  form!: FormGroup;
  feeForm!: FormGroup;
  acceptsBookings = true;
  currentVersion = 0;
  acceptsToggleBusy = false;
  isLoading = false;
  isSaving = false;
  isSavingFee = false;
  error = '';
  success = '';
  feeSuccess = '';
  feeError = '';

  constructor(
    private fb: FormBuilder,
    private svc: HospitalAvailabilityService,
    private http: HttpClient,
    private hospitalProfileService: HospitalProfileService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      slots: this.fb.array(
        this.weekDays.map((_, day) => this.fb.group({
          dayOfWeek: [day],
          isAvailable: [false],
          startTime: ['09:00'],
          endTime: ['17:00']
        }))
      )
    });
    this.feeForm = this.fb.group({
      defaultConsultationFee: [500, [Validators.required, Validators.min(0)]]
    });
    this.load();
    this.loadFee();
  }

  get slots(): FormArray {
    return this.form.get('slots') as FormArray;
  }

  loadFee(): void {
    this.hospitalProfileService.getProfile().subscribe({
      next: (res: any) => {
        const fee = res?.data?.hospitalProfile?.defaultConsultationFee;
        if (fee != null) this.feeForm.patchValue({ defaultConsultationFee: Number(fee) });
      },
      error: () => { /* silent */ }
    });
  }

  saveFee(): void {
    this.feeError = '';
    this.feeSuccess = '';
    if (this.feeForm.invalid) { this.feeError = 'Please enter a valid fee.'; return; }
    this.isSavingFee = true;
    this.http.patch<any>(
      'http://localhost:3000/api/hospital/consultation-fee',
      { defaultConsultationFee: Number(this.feeForm.value.defaultConsultationFee) }
    ).subscribe({
      next: () => {
        this.isSavingFee = false;
        this.feeSuccess = 'Consultation fee updated. Applies to new bookings.';
      },
      error: (err) => {
        this.isSavingFee = false;
        this.feeError = err?.error?.message || 'Failed to update fee';
      }
    });
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.svc.listMine().subscribe({
      next: (res) => {
        this.applyServerState(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load hospital hours';
        this.isLoading = false;
      }
    });
  }

  private applyServerState(data: { acceptsBookings?: boolean; version?: number; slots?: HospitalAvailabilitySlot[] } | undefined): void {
    if (!data) return;
    this.acceptsBookings = data.acceptsBookings !== false;
    this.currentVersion = Number(data.version) || 0;
    const slots = data.slots || [];
    this.slots.controls.forEach((ctrl, day) => {
      const row = slots.find(r => r.dayOfWeek === day);
      if (row) {
        ctrl.patchValue({
          dayOfWeek: day,
          isAvailable: true,
          startTime: row.startTime,
          endTime: row.endTime
        }, { emitEvent: false });
      } else {
        ctrl.patchValue({ isAvailable: false, startTime: '09:00', endTime: '17:00' }, { emitEvent: false });
      }
    });
  }

  private handleStaleError(err: any): boolean {
    if (err?.error?.code !== 'STALE_AVAILABILITY') return false;
    if (err.error.currentData) this.applyServerState(err.error.currentData);
    this.error = err.error.message || 'Someone else updated hospital hours. The latest version is now shown.';
    return true;
  }

  get hasAnyEnabledDay(): boolean {
    return (this.slots.value as Array<{ isAvailable: boolean }>).some(s => !!s.isAvailable);
  }

  toggleAcceptsBookings(next: boolean): void {
    if (this.acceptsToggleBusy) return;
    this.acceptsToggleBusy = true;
    this.error = '';
    this.success = '';
    this.svc.setAcceptsBookings(next, this.currentVersion).subscribe({
      next: (res) => {
        this.acceptsBookings = res.data.acceptsBookings;
        this.currentVersion = Number(res.data.version) || this.currentVersion + 1;
        this.acceptsToggleBusy = false;
        this.success = this.acceptsBookings
          ? 'Bookings enabled. Patients can now book at your hospital.'
          : 'Bookings paused. Patients will see a closed message when they try to book.';
      },
      error: (err) => {
        this.acceptsToggleBusy = false;
        if (this.handleStaleError(err)) return;
        this.error = err?.error?.message || 'Failed to update';
      }
    });
  }

  save(): void {
    this.error = '';
    this.success = '';
    const raw = this.form.value.slots as HospitalAvailabilitySlot[];
    const enabled = raw.filter(s => s.isAvailable);
    if (enabled.some(s => s.startTime >= s.endTime)) {
      this.error = 'End time must be after start time for every enabled day.';
      return;
    }
    this.isSaving = true;
    this.svc.replaceMine(enabled, this.currentVersion).subscribe({
      next: (res) => {
        this.applyServerState(res.data);
        this.isSaving = false;
        this.success = 'Hours saved. Patients will only be able to book within these windows.';
      },
      error: (err) => {
        this.isSaving = false;
        if (this.handleStaleError(err)) return;
        this.error = err?.error?.message || 'Failed to save hours';
      }
    });
  }
}
