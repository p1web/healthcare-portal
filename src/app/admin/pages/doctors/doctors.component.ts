import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.css'
})

export class DoctorsComponent implements OnInit{

  doctorList: any[] = [];
  publicDoctorsList: any[] = [];
  hospitalsList: any[] = [];
  specializationList: any[] = [];
  statusFilter: string | null = null;
  pageTitle: string | null = null;
  selectedDoctor: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
    this.statusFilter = params['status'] || null;
    this.pageTitle = this.statusFilter;
    this.loadDoctorProfile(params);
    this.loadSpecializations();
    this.loadHospitals();
  });
  }

  getRoleClass(role: 'patient' | 'doctor' | 'hospital' | 'admin'): string {
    switch (role) {
      case 'admin':
        return 'badge bg-dark';

      case 'doctor':
        return 'badge bg-primary';

      case 'hospital':
        return 'badge bg-success';

      case 'patient':
        return 'badge bg-info';

      default:
        return 'badge bg-secondary';
    }
  }


  loadDoctorProfile(filters: any): void {
    
    this.AdminService.getDoctorProfile(filters).subscribe({
      next: (response) => {
        this.doctorList = response;
        // console.log('Users loaded:', this.doctorList);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  loadPublicDoctorlist(): void {
    this.AdminService.getPublicDoctorlist().subscribe({
      next: (response) => { 
        this.publicDoctorsList = response;
      },
      error: (err) => {
        console.error('Failed to load public doctors', err);
      }
    });
  }
  
  showStatusColumns(): boolean {
    // console.log('Status Filter:', this.statusFilter);
      return this.statusFilter === 'ALL';
  }

  openDoctorModal(doctor: any): void {
    this.selectedDoctor = doctor;
  }

  openCreateModal(doctor: any): void {
    this.selectedDoctor = doctor; 
    console.log('Creating new doctor profile',this.selectedDoctor);
  }

  toggleDoctorVerification(doctor: any): void {
    const newStatus = !doctor.isVerified; 
  }

  loadSpecializations(): void {
    this.AdminService.getSpecializations().subscribe({
      next: (response) => {
        this.specializationList = response;
      },
      error: (err) => {
        console.error('Failed to load specializations', err);
      }
    });
  }

  loadHospitals(): void {
    this.AdminService.getHospitals().subscribe({
      next: (response) => {
        this.hospitalsList = response;
      },
      error: (err) => {
        console.error('Failed to load hospitals', err);
      }
    });
  }

}
