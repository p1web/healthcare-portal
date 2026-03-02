import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-specializations',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './specializations.component.html',
  styleUrl: './specializations.component.css'
})
export class SpecializationsComponent implements OnInit{
  isSubmitting = false;
  editingId: number | null = null;
  specializationList: any[] = [];
  specializationForm!: FormGroup;
  editSpecializationForm!: FormGroup;

 constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSpecializations();
  }

  initForm(): void {
    this.specializationForm = this.fb.group({
      specialization_name: ['', Validators.required],      
      specialization_icon: [''],
      specialization_description: [''],
    });

    this.editSpecializationForm = this.fb.group({
      specialization_name: ['', Validators.required],      
      specialization_icon: [''],
      specialization_description: [''],
    });
  }

  loadSpecializations(): void {
    this.AdminService.getSpecializations().subscribe({
      next: (data) => {
        this.specializationList = data;
      },
      error: (error) => {
        console.error('Error loading specializations:', error);
      }
    });
  }

  openAddSpecialtizationModal(): void {
    this.editingId = null;
    this.specializationForm.reset();
  }

  // Open Edit Modal
  openEditSpecializationModal(selectedSpecialization: any): void {
    this.editingId = selectedSpecialization.id;
    console.log('Selected Specialization for Edit:', selectedSpecialization);
    this.editSpecializationForm.patchValue({
      specialization_name: selectedSpecialization.name,
      specialization_icon: selectedSpecialization.icon,
      specialization_description: selectedSpecialization.description
    });
  }

  saveSpecialization(): void {
    if (this.specializationForm.valid) {
     const payload = this.specializationForm.value;
     this.isSubmitting = true;
      this.AdminService.addSpecialization(payload).subscribe({
        next: (res) => {
          this.afterSave('Specialization added successfully');
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  // Common Success Handler
  private afterSave(message: string): void {
    this.isSubmitting = false;
    alert(message);
    this.specializationForm.reset();
    this.editingId = null;
    this.loadSpecializations();
  }


  // Common Error Handler
  private handleError(err: any): void {
    this.isSubmitting = false;
    console.error(err);
    alert(err.error?.message || 'Something went wrong');
  }

  updateSpecialization(): void {
    
     if (this.editSpecializationForm.valid && this.editingId !== null) {
      const payload = this.editSpecializationForm.value;
      // UPDATE
      this.AdminService.updateSpecialization(this.editingId, payload).subscribe({
        next: () => {
          this.afterSave('Specialization updated successfully');
        },
        error: (err) => this.handleError(err)
      });

    } 
  }

  deleteSpecialization(specializationId: number): void {

    if (!confirm('Are you sure you want to delete this specialization?')) {
      return;
    }

    this.AdminService.deleteSpecialization(specializationId).subscribe({
      next: () => {
        alert('Specialization deleted successfully');
        this.loadSpecializations();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to delete specialization');
      }
    });
  }
}
