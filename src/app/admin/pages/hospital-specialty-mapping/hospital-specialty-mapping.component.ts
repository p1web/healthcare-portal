import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-hospital-specialty-mapping',
  imports: [CommonModule],
  templateUrl: './hospital-specialty-mapping.component.html',
  styleUrl: './hospital-specialty-mapping.component.css'
})
export class HospitalSpecialtyMappingComponent implements OnInit{

  infoList: any[] = [];
  
  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadhospitalSpecialtyMapping();
  }

  loadhospitalSpecialtyMapping(): void {
    this.adminService.getHospitalSpecialtyMapping().subscribe({
      next: (data) => {
        console.log('Hospital Specialty Mapping Data:', data);
        this.infoList = data;
      },
      error: (error) => {
        console.error('Error loading hospital specialty mapping:', error);
      }
    });
  }

}
