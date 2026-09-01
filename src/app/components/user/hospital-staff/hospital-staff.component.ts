import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalStaffMember, HospitalStaffPayload, HospitalStaffService } from '../../../services/hospital-staff.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';
import { QualificationService, Qualification } from '../../../services/qualification.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-hospital-staff',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './hospital-staff.component.html',
  styleUrl: './hospital-staff.component.css'
})
export class HospitalStaffComponent implements OnInit {
  staff: HospitalStaffMember[] = [];
  specializations: Specializations[] = [];
  qualifications: Qualification[] = [];
  isLoading = false;
  isSaving = false;
  isUploadingAvatar = false;
  avatarError = '';
  readonly apiHost = 'http://localhost:3000';
  error = '';
  success = '';

  form!: FormGroup;
  editingId: number | null = null;
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private staffService: HospitalStaffService,
    private specializationService: SpecializationService,
    private qualificationService: QualificationService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit(): void {
    this.form = this.buildForm();
    this.loadMasters();
    this.load();
  }

  private loadMasters(): void {
    forkJoin({
      specializations: this.specializationService.getSpecializations(),
      qualifications: this.qualificationService.getQualifications()
    }).subscribe({
      next: ({ specializations, qualifications }) => {
        this.specializations = specializations || [];
        this.qualifications = qualifications || [];
      },
      error: () => {
        this.specializations = [];
        this.qualifications = [];
      }
    });
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      specialization: [''],
      qualification: [''],
      experienceYears: [null as number | null, [Validators.min(0), Validators.max(80)]],
      phone: [''],
      email: ['', [Validators.email]],
      bio: [''],
      avatarUrl: [''],
      isActive: [true],
      displayOrder: [0]
    });
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.staffService.listMine().subscribe({
      next: (res) => {
        this.staff = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load staff';
        this.isLoading = false;
      }
    });
  }

  openAdd(): void {
    this.showForm = true;
    this.editingId = null;
    this.form.reset({
      name: '', specialization: '', qualification: '', experienceYears: null,
      phone: '', email: '', bio: '', avatarUrl: '',
      isActive: true, displayOrder: 0
    });
    this.success = '';
    this.error = '';
  }

  openEdit(member: HospitalStaffMember): void {
    this.showForm = true;
    this.editingId = member.id;
    this.form.reset({
      name: member.name,
      specialization: member.specialization || '',
      qualification: member.qualification || '',
      experienceYears: member.experienceYears,
      phone: member.phone || '',
      email: member.email || '',
      bio: member.bio || '',
      avatarUrl: member.avatarUrl || '',
      isActive: member.isActive,
      displayOrder: member.displayOrder
    });
    this.success = '';
    this.error = '';
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value;
    const payload: HospitalStaffPayload = {
      name: String(raw.name).trim(),
      specialization: raw.specialization ? String(raw.specialization).trim() : null,
      qualification: raw.qualification ? String(raw.qualification).trim() : null,
      experienceYears: raw.experienceYears === null || raw.experienceYears === '' ? null : Number(raw.experienceYears),
      phone: raw.phone ? String(raw.phone).trim() : null,
      email: raw.email ? String(raw.email).trim() : null,
      bio: raw.bio ? String(raw.bio).trim() : null,
      avatarUrl: raw.avatarUrl ? String(raw.avatarUrl).trim() : null,
      isActive: !!raw.isActive,
      displayOrder: Number(raw.displayOrder) || 0
    };
    this.isSaving = true;
    this.error = '';
    const req = this.editingId
      ? this.staffService.update(this.editingId, payload)
      : this.staffService.create(payload);
    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.success = this.editingId ? 'Staff member updated.' : 'Staff member added.';
        this.showForm = false;
        this.editingId = null;
        this.load();
      },
      error: (err) => {
        this.isSaving = false;
        this.error = err?.error?.message || 'Failed to save';
      }
    });
  }

  remove(member: HospitalStaffMember): void {
    if (!confirm(`Remove ${member.name} from your hospital?`)) return;
    this.error = '';
    this.staffService.delete(member.id).subscribe({
      next: () => {
        this.success = `${member.name} removed.`;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to remove staff';
      }
    });
  }

  avatarPreviewUrl(url?: string | null): string | null {
    if (!url) return null;
    return url.startsWith('http') ? url : `${this.apiHost}${url}`;
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    this.avatarError = '';
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError = 'Please pick a JPG, PNG, or WEBP image.';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.avatarError = 'Image must be under 5 MB.';
      return;
    }
    this.isUploadingAvatar = true;
    this.imageUploadService.upload('staff-avatar', file).subscribe({
      next: (res) => {
        this.isUploadingAvatar = false;
        if (res.url) this.form.patchValue({ avatarUrl: res.url });
      },
      error: (err) => {
        this.isUploadingAvatar = false;
        this.avatarError = err?.error?.message || 'Failed to upload image.';
      }
    });
  }

  clearAvatar(): void {
    this.form.patchValue({ avatarUrl: '' });
    this.avatarError = '';
  }
}
