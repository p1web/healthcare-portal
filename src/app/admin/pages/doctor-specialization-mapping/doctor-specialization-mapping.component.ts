import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-doctor-specialization-mapping',
  imports: [ CommonModule ],
  templateUrl: './doctor-specialization-mapping.component.html',
  styleUrl: './doctor-specialization-mapping.component.css'
})
export class DoctorSpecializationMappingComponent {
  infoList: any[] = [];
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDoctorSpecializationMapping();
  }

  loadDoctorSpecializationMapping(): void {
    this.adminService.getDoctorSpecializationMapping().subscribe({
      next: (data) => {
        console.log('Doctor Specialization Mapping Data:', data);
        this.infoList = data;
      },
      error: (error) => {
        console.error('Error loading Doctor Specialization mapping:', error);
      }
    });
  }
}
