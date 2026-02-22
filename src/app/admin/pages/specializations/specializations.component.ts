import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-specializations',
  imports: [ CommonModule ],
  templateUrl: './specializations.component.html',
  styleUrl: './specializations.component.css'
})
export class SpecializationsComponent {
  specializationList: any[] = [];

   constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadSpecializations();
  }

  loadSpecializations(): void {
    this.AdminService.getSpecializations().subscribe({
      next: (data) => {
        this.specializationList = data;
      },
      error: (error) => {
        console.error('Error loading specializations:', error);
      }
    });
  }
}
