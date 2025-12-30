import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { DoctorService } from '../../services/doctor.service';
import { Hospital } from '../../models/hospital.model';
import { Doctor } from '../../models/doctor.model';
import { SpecializationService, Specializations } from '../../services/specialization.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  searchQuery = '';
  searchType = '';
  hospitals: Hospital[] = [];
  doctors: Doctor[] = [];
  specializations: Specializations[] = [];
  selectedSpecialization: any = '';
  isLoadingDoctors = false;
  isLoadingHospitals = false;
  isLoadingSpecialization = false;

  constructor(
    private hospitalService: HospitalService,
    private doctorService: DoctorService,
    private specializationService: SpecializationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHospitals();
    this.loadDoctors();
    this.loadSpecializations();
  }
  
  loadHospitals() {
    this.isLoadingHospitals = true;
    this.hospitalService.getHospitals().subscribe(
      res => {
        this.isLoadingHospitals=false;
        this.hospitals = res.data
      }
    );
  }

  loadDoctors() {
    this.isLoadingDoctors = true;
    this.doctorService.getDoctors().subscribe({
      next: (res: any) => {
        this.isLoadingDoctors = false;
        this.doctors = res.data;
      },
      error: (err) => {
        console.error('Failed to load doctors', err);
      }
    });
  }

  loadSpecializations(): void {
    this.isLoadingSpecialization=true;
    this.specializationService.getSpecializations().subscribe({
      next: (data) => {
        this.isLoadingSpecialization=false;
        this.specializations = data;
      },
      error: (err) => {
        console.error('Failed to load specializations', err);
      }
    });
  }

  onSearchTypeChange() {
    if (this.searchType === 'specialization') {
      this.searchQuery = '';
    } else {
      this.selectedSpecialization = '';
    }
  }


  onSearch() {
    if (this.searchType === 'specialization') {
      if (this.selectedSpecialization) {
        // Navigate to doctors with specialization ID
        this.router.navigate(['/doctors'], {
          queryParams: { search: this.selectedSpecialization, type: this.searchType }
        });
      }
    } else if (this.searchQuery?.trim()) {
      if (this.searchType === 'hospital' || this.searchType === 'all') {
        this.router.navigate(['/hospitals'], {
          queryParams: { search: this.searchQuery }
        });
      } else if (this.searchType === 'doctor') {
        this.router.navigate(['/doctors'], {
          queryParams: { search: this.searchQuery, type: this.searchType }
        });
      }
    }
  }


  searchBySpecialization(specId: number) {
    this.router.navigate(['/doctors'], {
      queryParams: { search: specId, type: 'specialization' }
    });
  }



  viewDoctorDetail(doctorId: number) {
    this.router.navigate(['/doctor', doctorId]);
  }

  getDoctorInitial(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[1][0] : parts[0][0];
  }
}