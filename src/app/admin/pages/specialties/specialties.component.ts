import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-specialties',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './specialties.component.html',
  styleUrl: './specialties.component.css'
})

export class SpecialtiesComponent implements OnInit {
  specialtyForm!: FormGroup;
  editSpecialtyForm!: FormGroup;

  specialtiesList: any[] = [];
  selectedSpecialty: any = null;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) { }


  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadSpecialties();
  }

  initForm(): void {
    this.specialtyForm = this.fb.group({
      specialty_name: ['', Validators.required],
      specialty_icon: [''],
      specialty_description: [''],
    });

    this.editSpecialtyForm = this.fb.group({
      specialty_name: ['', Validators.required],
      specialty_icon: [''],
      specialty_description: [''],
    });
  }

  loadSpecialties(): void {
    this.AdminService.getSpecialities().subscribe({
      next: (data) => {
        // console.log(data)
        this.specialtiesList = data;
      },
      error: (error) => {
        console.error('Error loading specialties:', error);
      }
    });
  }

  openAddSpecialtyModal(): void {
    this.editingId = null;
    this.specialtyForm.reset();
  }

  // Open Edit Modal
  openEditSpecialtyModal(selectedSpecialty: any): void {
    this.editingId = selectedSpecialty.id;
    console.log('Selected Specialty for Edit:', selectedSpecialty);
    this.editSpecialtyForm.patchValue({
      specialty_name: selectedSpecialty.name,
      specialty_icon: selectedSpecialty.icon,
      specialty_description: selectedSpecialty.description
    });
  }

  saveSpecialty(): void {
    if (this.specialtyForm.valid) {
      const payload = this.specialtyForm.value;
      this.isSubmitting = true;
      this.AdminService.addSpeciality(payload).subscribe({
        next: (res) => {
          this.afterSave('Specialty added successfully');
        },
        error: (err) => this.handleError(err)
      });
    }


  }

  // Common Success Handler
  private afterSave(message: string): void {
    this.isSubmitting = false;
    alert(message);
    this.specialtyForm.reset();
    this.editingId = null;
    this.loadSpecialties();
  }


  // Common Error Handler
  private handleError(err: any): void {
    this.isSubmitting = false;
    console.error(err);
    alert(err.error?.message || 'Something went wrong');
  }

  updateSpecialty(): void {

    if (this.editSpecialtyForm.valid && this.editingId !== null) {
      const payload = this.editSpecialtyForm.value;
      // UPDATE
      this.AdminService.updateSpeciality(this.editingId, payload).subscribe({
        next: () => {
          this.afterSave('Specialty updated successfully');
        },
        error: (err) => this.handleError(err)
      });

    }
  }

  deleteSpecialty(specialtyId: number): void {

    if (!confirm('Are you sure you want to delete this specialty?')) {
      return;
    }

    this.AdminService.deleteSpeciality(specialtyId).subscribe({
      next: () => {
        alert('Specialty deleted successfully');
        this.loadSpecialties();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to delete specialty');
      }
    });
  }
}
