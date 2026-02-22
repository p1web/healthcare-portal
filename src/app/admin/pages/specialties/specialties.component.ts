import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-specialties',
  imports: [ CommonModule ],
  templateUrl: './specialties.component.html',
  styleUrl: './specialties.component.css'
})

export class SpecialtiesComponent {  
  specialtiesList: any[] = [];

   constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadSpecialties();
  }

  loadSpecialties(): void {
    this.AdminService.getSpecialities().subscribe({
      next: (data) => {
        this.specialtiesList = data;
      },
      error: (error) => {
        console.error('Error loading specialties:', error);
      }
    });
  }
}
