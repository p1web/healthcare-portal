import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PracticeService, Practice, PracticeAvailabilitySlot } from '../../../services/practice.service';
import { HospitalService } from '../../../services/hospital.service';
import { Hospital } from '../../../models/hospital.model';

@Component({
  standalone: true,
  selector: 'app-doctor-practices',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './doctor-practices.component.html',
  styleUrl: './doctor-practices.component.css'
})
export class DoctorPracticesComponent implements OnInit {
  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  practices: Practice[] = [];
  hospitals: Partial<Hospital>[] = [];
  addForm!: FormGroup;
  editForm!: FormGroup;
  editingId: number | null = null;
  availabilityId: number | null = null;
  availabilityForm!: FormGroup;
  isLoadingAvailability = false;
  showAdd = false;
  isLoading = false;
  isSaving = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private practiceService: PracticeService,
    private hospitalService: HospitalService
  ) {}

  ngOnInit(): void {
    this.addForm = this.fb.group({
      hospitalProfileId: ['', Validators.required],
      consultationFee: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
    this.editForm = this.fb.group({
      consultationFee: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
    this.availabilityForm = this.fb.group({
      slots: this.fb.array(
        this.weekDays.map((_, day) => this.fb.group({
          dayOfWeek: [day],
          isAvailable: [false],
          startTime: ['09:00'],
          endTime: ['17:00']
        }))
      )
    });
    this.loadPractices();
    this.loadHospitals();
  }

  get availabilitySlots(): FormArray {
    return this.availabilityForm.get('slots') as FormArray;
  }

  loadPractices(): void {
    this.isLoading = true;
    this.practiceService.listMine().subscribe({
      next: (res) => {
        this.practices = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load practices';
        this.isLoading = false;
      }
    });
  }

  loadHospitals(): void {
    this.hospitalService.getHospitalList().subscribe({
      next: (data) => { this.hospitals = data; },
      error: () => { this.hospitals = []; }
    });
  }

  availableHospitals(): Partial<Hospital>[] {
    const taken = new Set(this.practices.map(p => p.hospitalProfileId));
    return this.hospitals.filter(h => h.id !== undefined && !taken.has(h.id as number));
  }

  toggleAdd(): void {
    this.showAdd = !this.showAdd;
    this.error = '';
    this.success = '';
    if (this.showAdd) this.addForm.reset({ hospitalProfileId: '', consultationFee: 0, notes: '' });
  }

  submitAdd(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.error = '';
    const { hospitalProfileId, consultationFee, notes } = this.addForm.value;
    this.practiceService.create({
      hospitalProfileId: Number(hospitalProfileId),
      consultationFee: Number(consultationFee),
      notes: notes || undefined
    }).subscribe({
      next: () => {
        this.success = 'Practice request submitted.';
        this.showAdd = false;
        this.isSaving = false;
        this.loadPractices();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to add practice';
        this.isSaving = false;
      }
    });
  }

  startEdit(p: Practice): void {
    this.editingId = p.id;
    this.editForm.reset({ consultationFee: p.consultationFee, notes: p.notes || '' });
    this.error = '';
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  submitEdit(p: Practice): void {
    if (this.editForm.invalid) return;
    this.isSaving = true;
    this.practiceService.update(p.id, {
      consultationFee: Number(this.editForm.value.consultationFee),
      notes: this.editForm.value.notes || undefined
    }).subscribe({
      next: () => {
        this.editingId = null;
        this.isSaving = false;
        this.success = 'Practice updated.';
        this.loadPractices();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update practice';
        this.isSaving = false;
      }
    });
  }

  markPrimary(p: Practice): void {
    if (p.isPrimary) return;
    this.isSaving = true;
    this.practiceService.update(p.id, { isPrimary: true }).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Primary practice updated.';
        this.loadPractices();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to set primary';
        this.isSaving = false;
      }
    });
  }

  deactivate(p: Practice): void {
    if (p.isPrimary) {
      this.error = 'Mark another practice as primary before deactivating this one.';
      return;
    }
    if (!confirm(`Deactivate your practice at ${p.hospital?.hospitalName}? Patients will no longer be able to book you here.`)) return;
    this.isSaving = true;
    this.practiceService.deactivate(p.id).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = 'Practice deactivated.';
        this.loadPractices();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to deactivate';
        this.isSaving = false;
      }
    });
  }

  statusLabel(status: Practice['status']): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_hospital_approval': return 'Pending hospital approval';
      case 'rejected': return 'Rejected';
      case 'inactive': return 'Inactive';
    }
  }

  statusBadgeClass(status: Practice['status']): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'pending_hospital_approval': return 'bg-warning text-dark';
      case 'rejected': return 'bg-danger';
      case 'inactive': return 'bg-secondary';
    }
  }

  toggleAvailability(p: Practice): void {
    if (this.availabilityId === p.id) {
      this.availabilityId = null;
      return;
    }
    this.availabilityId = p.id;
    this.isLoadingAvailability = true;
    this.availabilitySlots.controls.forEach((ctrl, day) => {
      ctrl.reset({ dayOfWeek: day, isAvailable: false, startTime: '09:00', endTime: '17:00' });
    });
    this.practiceService.getMyPracticeAvailability(p.id).subscribe({
      next: (res) => {
        (res.data || []).forEach(slot => {
          const ctrl = this.availabilitySlots.at(slot.dayOfWeek);
          if (ctrl) ctrl.patchValue({
            dayOfWeek: slot.dayOfWeek,
            isAvailable: slot.isAvailable !== false,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        });
        this.isLoadingAvailability = false;
      },
      error: () => { this.isLoadingAvailability = false; }
    });
  }

  saveAvailability(p: Practice): void {
    const slots: PracticeAvailabilitySlot[] = this.availabilitySlots.controls
      .map(ctrl => ctrl.value as PracticeAvailabilitySlot)
      .filter(s => s.isAvailable);
    if (slots.some(s => !/^\d{2}:\d{2}$/.test(s.startTime) || !/^\d{2}:\d{2}$/.test(s.endTime))) {
      this.error = 'Times must use HH:mm format.';
      return;
    }
    if (slots.some(s => s.startTime >= s.endTime)) {
      this.error = 'End time must be after start time.';
      return;
    }
    this.isSaving = true;
    this.error = '';
    this.practiceService.replaceMyPracticeAvailability(p.id, slots).subscribe({
      next: () => {
        this.isSaving = false;
        this.success = `Hours saved for ${p.hospital?.hospitalName}.`;
        this.availabilityId = null;
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to save availability';
      }
    });
  }
}
