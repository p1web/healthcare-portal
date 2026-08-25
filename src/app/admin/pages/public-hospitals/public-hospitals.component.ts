import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../../services/admin.service';
import { HospitalProfileModalComponent } from '../../shared/hospital-profile-modal/hospital-profile-modal.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-public-hospitals',
  imports: [CommonModule, FormsModule, HospitalProfileModalComponent, PaginationComponent],
  templateUrl: './public-hospitals.component.html',
  styleUrl: './public-hospitals.component.css'
})
export class PublicHospitalsComponent {
  hospitalList: any[] = [];
  selectedHospital: any = null;

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}

  ngOnInit(): void {
  
    this.loadHospitalsList();
  }

  loadHospitalsList(): void {
    
    this.AdminService.getHospitals().subscribe({
      next: (response) => {
        this.hospitalList = response;
        this.currentPage = 1;
        // console.log('hospitals loaded:', this.hospitalList);
      },
      error: (err) => {
        console.error('Failed to load hospitals', err);
      }
    });
  }

  openHospitalModal(hospital: any): void {
    this.selectedHospital = hospital;
  }

  get pagedHospitals(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.hospitalList.slice(start, start + this.pageSize);
  }

}
