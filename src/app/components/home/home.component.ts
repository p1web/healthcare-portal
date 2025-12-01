import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { DoctorService } from '../../services/doctor.service';
import { Hospital } from '../../models/hospital.model';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  searchQuery = '';
  searchType = 'all';
  hospitals: Hospital[] = [];
  doctors: Doctor[] = [];
  specializations = [
    'Cardiology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'Neurology',
    'General Medicine'
  ];

  constructor(
    private hospitalService: HospitalService,
    private doctorService: DoctorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHospitals();
    this.loadDoctors();
  }

  loadHospitals() {
    this.hospitalService.getHospitals().subscribe(
      data => this.hospitals = data
    );
  }

  loadDoctors() {
    this.doctorService.getDoctors().subscribe(
      data => this.doctors = data
    );
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      if (this.searchType === 'hospital' || this.searchType === 'all') {
        this.router.navigate(['/hospitals'], { 
          queryParams: { search: this.searchQuery } 
        });
      } else if (this.searchType === 'doctor' || this.searchType === 'specialization') {
        this.router.navigate(['/doctors'], { 
          queryParams: { search: this.searchQuery, type: this.searchType } 
        });
      }
    }
  }

  viewDoctorDetail(doctorId: number) {
    this.router.navigate(['/doctor', doctorId]);
  }

  getDoctorInitial(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[1][0] : parts[0][0];
  }
}