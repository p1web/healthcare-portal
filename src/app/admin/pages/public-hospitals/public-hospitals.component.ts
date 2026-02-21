import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-public-hospitals',
  imports: [ CommonModule ],
  templateUrl: './public-hospitals.component.html',
  styleUrl: './public-hospitals.component.css'
})
export class PublicHospitalsComponent {
  hospitalList: any[] = [];
  selectedHospital: any = null;

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

}
