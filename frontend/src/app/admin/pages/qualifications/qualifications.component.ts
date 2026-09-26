import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-qualifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, PaginationComponent],
  templateUrl: './qualifications.component.html',
  styleUrl: './qualifications.component.css'
})
export class QualificationsComponent implements OnInit {
  isSubmitting = false;
  editingId: number | null = null;
  qualificationList: any[] = [];
  qualificationForm!: FormGroup;
  editQualificationForm!: FormGroup;

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadQualifications();
  }

  initForm(): void {
    this.qualificationForm = this.fb.group({
      qualification_name: ['', Validators.required],
      qualification_description: ['']
    });
    this.editQualificationForm = this.fb.group({
      qualification_name: ['', Validators.required],
      qualification_description: ['']
    });
  }

  loadQualifications(): void {
    this.adminService.getQualifications().subscribe({
      next: (data) => {
        this.qualificationList = data;
        this.currentPage = 1;
      },
      error: (err) => console.error('Error loading qualifications:', err)
    });
  }

  get pagedQualifications(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.qualificationList.slice(start, start + this.pageSize);
  }

  openAddQualificationModal(): void {
    this.editingId = null;
    this.qualificationForm.reset();
  }

  openEditQualificationModal(row: any): void {
    this.editingId = row.id;
    this.editQualificationForm.patchValue({
      qualification_name: row.name,
      qualification_description: row.description
    });
  }

  saveQualification(): void {
    if (!this.qualificationForm.valid) return;
    this.isSubmitting = true;
    this.adminService.addQualification(this.qualificationForm.value).subscribe({
      next: () => this.afterSave('Qualification added successfully'),
      error: (err) => this.handleError(err)
    });
  }

  updateQualification(): void {
    if (!this.editQualificationForm.valid || this.editingId === null) return;
    this.isSubmitting = true;
    this.adminService.updateQualification(this.editingId, this.editQualificationForm.value).subscribe({
      next: () => this.afterSave('Qualification updated successfully'),
      error: (err) => this.handleError(err)
    });
  }

  deleteQualification(id: number): void {
    if (!confirm('Are you sure you want to delete this qualification?')) return;
    this.adminService.deleteQualification(id).subscribe({
      next: () => {
        alert('Qualification deleted successfully');
        this.loadQualifications();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to delete qualification');
      }
    });
  }

  private afterSave(message: string): void {
    this.isSubmitting = false;
    alert(message);
    this.qualificationForm.reset();
    this.editingId = null;
    this.loadQualifications();
  }

  private handleError(err: any): void {
    this.isSubmitting = false;
    console.error(err);
    alert(err.error?.message || 'Something went wrong');
  }
}
