import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-doctor-specialization-mapping',
  imports: [ CommonModule, FormsModule, PaginationComponent ],
  templateUrl: './doctor-specialization-mapping.component.html',
  styleUrl: './doctor-specialization-mapping.component.css'
})
export class DoctorSpecializationMappingComponent {
  infoList: any[] = [];

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDoctorSpecializationMapping();
  }

  loadDoctorSpecializationMapping(): void {
    this.adminService.getDoctorSpecializationMapping().subscribe({
      next: (data) => {
        console.log('Doctor Specialization Mapping Data:', data);
        this.infoList = data;
        this.currentPage = 1;
      },
      error: (error) => {
        console.error('Error loading Doctor Specialization mapping:', error);
      }
    });
  }

  get pagedInfoList(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.infoList.slice(start, start + this.pageSize);
  }
}
