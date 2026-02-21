import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-hospitals',
  imports: [CommonModule],
  templateUrl: './hospitals.component.html',
  styleUrl: './hospitals.component.css'
})
export class HospitalsComponent {
  hospitalsUserList: any[] = [];
  statusFilter: string | null = null;
  pageTitle: string | null = null;
  selectedHospitalUser: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) { }


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.statusFilter = params['status'] || null;
      this.pageTitle = this.statusFilter;
      this.loadHospitalUserProfile(params);
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


  loadHospitalUserProfile(filters: any): void {

    this.AdminService.getHospitalUserProfile(filters).subscribe({
      next: (response) => {
        this.hospitalsUserList = response;
        // console.log('Users loaded:', this.hospitalsUserList);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }


  showStatusColumns(): boolean {
    // console.log('Status Filter:', this.statusFilter);
    return this.statusFilter === 'ALL';
  }

  openHospitalUserModal(hospital: any): void {
    this.selectedHospitalUser = hospital;
  }

  openCreateModal(hospital: any): void {
    this.selectedHospitalUser = hospital;
    console.log('Creating new hospital profile', this.selectedHospitalUser);
  }

  toggleHospitalVerification(hospital: any): void {
    const newStatus = !hospital.isVerified;
  }
}
