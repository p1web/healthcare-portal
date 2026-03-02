import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-hospital-specialty-mapping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './hospital-specialty-mapping.component.html',
  styleUrl: './hospital-specialty-mapping.component.css'
})
export class HospitalSpecialtyMappingComponent implements OnInit{
  editSpecialtyForm!: FormGroup;
  specialtiesList: any[] = [];
  selectedSpecialty: any = null
  isSubmitting = false;
  infoList: any[] = [];
  
  constructor(private adminService: AdminService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
    this.loadhospitalSpecialtyMapping();
    this.loadSpecialties();
  }

  initForm(): void {
    this.editSpecialtyForm = this.fb.group({
      hospital_id: [null],
      hospital_name: ['', Validators.required],
      specialties: ['', Validators.required]
    });

  }

  loadhospitalSpecialtyMapping(): void {
    this.adminService.getHospitalSpecialtyMapping().subscribe({
      next: (data) => {
        // console.log('Hospital Specialty Mapping Data:', data);
        this.infoList = data;
      },
      error: (error) => {
        console.error('Error loading hospital specialty mapping:', error);
      }
    });
  }
  
  // Open Edit Modal
  openEditSpecialtyModal(selectedSpecialty: any): void {
    this.selectedSpecialty = selectedSpecialty;
      // console.log('Selected Specialty for Edit:', selectedSpecialty);
      this.adminService.getHospitalWiseSpecialityList(selectedSpecialty.Hospital.id).subscribe({
        next: (data) => {
          const specialtyIds = data.map((item: any) => item.Specialty.id);
          this.editSpecialtyForm.patchValue({ 
            hospital_id: selectedSpecialty.Hospital.id, 
            hospital_name: selectedSpecialty.Hospital.name, 
            specialties: specialtyIds // array of IDs for Select2 multi-select });  
          });
        },
        error: (error) => {
          console.error('Error fetching hospital-wise specialty list:', error);
        }
      });    
  }

  loadSpecialties(): void {
    this.adminService.getSpecialities().subscribe({
      next: (data) => {
        this.specialtiesList = data;  
      },
      error: (error) => {
        console.error('Error loading specialties:', error);
      }
    }); 
  }

  updateSpecialty(): void {
    if (confirm('Are you sure you want to update the specialties for this hospital?')) {
      if (this.editSpecialtyForm.valid && this.selectedSpecialty?.id !== null) {
        const payload = this.editSpecialtyForm.value;

        // UPDATE
        this.isSubmitting = true;
        this.adminService.updateHospitalSpecialties(payload.hospital_id, payload.specialties).subscribe({
          next: (data) => {
            this.afterSave('Specialty updated successfully');
          },
          error: (err) => this.handleError(err)
        });
      }
    }
  }

  // Common Success Handler
  private afterSave(message: string): void {
    this.isSubmitting = false;
    alert(message);
    this.loadhospitalSpecialtyMapping();
  }


  // Common Error Handler
  private handleError(err: any): void {
    this.isSubmitting = false;
    console.error(err);
    alert(err.error?.message || 'Something went wrong');
  }

}
