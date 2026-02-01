import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-public-doctor',
  imports: [ CommonModule ],
  templateUrl: './public-doctor.component.html',
  styleUrl: './public-doctor.component.css'
})
export class PublicDoctorComponent {
  doctorList: any[] = [];
  statusFilter: string | null = null;
  pageTitle: string | null = null;
  selectedDoctor: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}


  ngOnInit(): void {
  
    this.loadDoctorslist();
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


  loadDoctorslist(): void {
    
    this.AdminService.getPublicDoctorlist().subscribe({
      next: (response) => {
        this.doctorList = response;
        // console.log('Users loaded:', this.doctorList);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  showStatusColumns(): boolean {
      return this.statusFilter === 'ALL';
  }

  openDoctorModal(doctor: any): void {
    this.selectedDoctor = doctor;
  }
}
