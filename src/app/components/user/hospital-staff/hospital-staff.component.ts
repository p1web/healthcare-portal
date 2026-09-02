import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalStaffMember, HospitalStaffPayload, HospitalStaffService } from '../../../services/hospital-staff.service';
import { SpecializationService, Specializations } from '../../../services/specialization.service';
import { QualificationService, Qualification } from '../../../services/qualification.service';
import { ImageUploadService } from '../../../services/image-upload.service';
import { Department, DepartmentService } from '../../../services/department.service';
import { HospitalProfileService } from '../../../services/hospital-profile.service';
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
  departments: Department[] = [];
  specializations: Specializations[] = [];
  qualifications: Qualification[] = [];
  isLoading = false;
  isSaving = false;
  isUploadingAvatar = false;
  avatarError = '';
  readonly apiHost = 'http://localhost:3000';
  error = '';
  success = '';
  consultationFeeMode: 'STANDARD' | 'PER_DOCTOR' = 'STANDARD';
  defaultConsultationFee = 500;
  pricingSaving = false;
  newDepartmentName = '';
  newDepartmentDescription = '';
  departmentSaving = false;
  readonly days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  form!: FormGroup;
  editingId: number | null = null;
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private staffService: HospitalStaffService,
    private specializationService: SpecializationService,
    private qualificationService: QualificationService,
    private imageUploadService: ImageUploadService,
    private departmentService: DepartmentService,
    private hospitalProfileService: HospitalProfileService
  ) {}

  ngOnInit(): void {
    this.form = this.buildForm();
    this.loadMasters();
    this.loadDepartments();
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
      departmentId: [null as number | null, Validators.required],
      consultationFee: [null as number | null, Validators.min(0.01)],
      isBookable: [false],
      isActive: [true],
      displayOrder: [0],
      availability: this.fb.array([])
    });
  }

  get availability(): FormArray {
    return this.form.get('availability') as FormArray;
  }

  addAvailability(slot?: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }): void {
    this.availability.push(this.fb.group({
      dayOfWeek: [slot?.dayOfWeek ?? 1, [Validators.required, Validators.min(0), Validators.max(6)]],
      startTime: [(slot?.startTime || '09:00').slice(0, 5), Validators.required],
      endTime: [(slot?.endTime || '17:00').slice(0, 5), Validators.required],
      isAvailable: [slot?.isAvailable !== false]
    }));
  }

  removeAvailability(index: number): void {
    this.availability.removeAt(index);
  }

  loadDepartments(): void {
    this.departmentService.listMine().subscribe({
      next: (response) => this.departments = response.data || [],
      error: (err) => this.error = err?.error?.message || 'Failed to load departments'
    });
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.staffService.listMine().subscribe({
      next: (res) => {
        this.staff = res.data || [];
        this.consultationFeeMode = res.pricing?.consultationFeeMode || 'STANDARD';
        this.defaultConsultationFee = Number(res.pricing?.defaultConsultationFee) || 0;
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
      departmentId: this.activeDepartments.length === 1 ? this.activeDepartments[0].id : null,
      consultationFee: null, isBookable: false,
      isActive: true, displayOrder: 0
    });
    this.availability.clear();
    this.addAvailability();
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
      departmentId: member.departmentId,
      consultationFee: member.consultationFee,
      isBookable: member.isBookable,
      isActive: member.isActive,
      displayOrder: member.displayOrder
    });
    this.availability.clear();
    (member.availability || []).forEach(slot => this.addAvailability(slot));
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
      departmentId: Number(raw.departmentId),
      consultationFee: raw.consultationFee === null || raw.consultationFee === '' ? null : Number(raw.consultationFee),
      isBookable: !!raw.isBookable,
      isActive: !!raw.isActive,
      displayOrder: Number(raw.displayOrder) || 0,
      availability: (raw.availability || []).map((slot: any) => ({
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: !!slot.isAvailable
      }))
    };
    this.isSaving = true;
    this.error = '';
    const req = this.editingId
      ? this.staffService.update(this.editingId, payload)
      : this.staffService.create(payload);
    req.subscribe({
      next: () => {
        this.isSaving = false;
        this.success = this.editingId ? 'Doctor updated.' : 'Doctor added.';
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

  get activeDepartments(): Department[] {
    return this.departments.filter(department => department.isActive);
  }

  departmentName(id: number | null): string {
    return this.departments.find(department => department.id === id)?.name || 'Unassigned';
  }

  savePricing(): void {
    if (this.consultationFeeMode === 'STANDARD' && !(this.defaultConsultationFee > 0)) {
      this.error = 'Enter a standard consultation fee greater than zero.';
      return;
    }
    this.pricingSaving = true;
    this.error = '';
    this.hospitalProfileService.updateConsultationPricing(
      this.consultationFeeMode,
      this.defaultConsultationFee
    ).subscribe({
      next: () => {
        this.pricingSaving = false;
        this.success = 'Consultation pricing updated.';
        this.load();
      },
      error: (err) => {
        this.pricingSaving = false;
        this.error = err?.error?.message || 'Failed to update consultation pricing';
      }
    });
  }

  addDepartment(): void {
    const name = this.newDepartmentName.trim();
    if (!name) return;
    this.departmentSaving = true;
    this.departmentService.create({ name, description: this.newDepartmentDescription.trim() || null }).subscribe({
      next: () => {
        this.departmentSaving = false;
        this.newDepartmentName = '';
        this.newDepartmentDescription = '';
        this.success = 'Department added.';
        this.loadDepartments();
      },
      error: (err) => {
        this.departmentSaving = false;
        this.error = err?.error?.message || 'Failed to add department';
      }
    });
  }

  renameDepartment(department: Department): void {
    const name = prompt('Department name', department.name)?.trim();
    if (!name || name === department.name) return;
    this.departmentService.update(department.id, { name }).subscribe({
      next: () => {
        this.success = 'Department updated.';
        this.loadDepartments();
      },
      error: (err) => this.error = err?.error?.message || 'Failed to update department'
    });
  }

  toggleDepartment(department: Department): void {
    this.departmentService.update(department.id, { isActive: !department.isActive }).subscribe({
      next: () => {
        this.success = `Department ${department.isActive ? 'deactivated' : 'activated'}.`;
        this.loadDepartments();
      },
      error: (err) => this.error = err?.error?.message || 'Failed to update department'
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
