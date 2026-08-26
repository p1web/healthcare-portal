import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { Hospital } from '../../models/hospital.model';

@Component({
  selector: 'app-hospital-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hospital-detail.component.html',
  styleUrls: ['./hospital-detail.component.css']
})
export class HospitalDetailComponent implements OnInit {
  hospital: Hospital | null = null;
  isLoading = true;
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private hospitalService: HospitalService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loadError = 'Invalid hospital reference.';
      this.isLoading = false;
      return;
    }
    this.loadHospital(id);
  }

  loadHospital(id: number): void {
    this.isLoading = true;
    this.loadError = '';
    this.hospitalService.getHospitalById(id).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        if (!data) {
          this.loadError = 'Hospital not found.';
          this.hospital = null;
        } else {
          this.hospital = data as Hospital;
        }
        this.isLoading = false;
      },
      error: () => {
        this.hospital = null;
        this.loadError = 'Could not load hospital details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  bookAppointment(): void {
    if (!this.hospital) return;
    this.router.navigate(['/doctors'], { queryParams: { hospital: this.hospital.id } });
  }

  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  isStarFilled(star: number, rating: number): boolean {
    return star <= Math.floor(rating);
  }

  isStarHalf(star: number, rating: number): boolean {
    return star === Math.ceil(rating) && rating % 1 !== 0;
  }
}
