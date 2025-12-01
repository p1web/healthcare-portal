import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { Hospital } from '../../models/hospital.model';

@Component({
  selector: 'app-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospitals.component.html',
  styleUrls: ['./hospitals.component.css']
})

export class HospitalsComponent implements OnInit {
  hospitals: Hospital[] = [];
  filteredHospitals: Hospital[] = [];
  searchQuery: string = '';
  selectedSpecialty: string = 'all';
  selectedRating: number = 0;
  sortBy: string = 'rating';
  viewMode: 'grid' | 'list' = 'grid';
  selectedHospital: Hospital | null = null;

  specialties = [
    'All Specialties',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Dermatology',
    'General Medicine',
    'Oncology',
    'Gynecology',
    'ENT',
    'Ophthalmology'
  ];

  constructor(
    private hospitalService: HospitalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadHospitals();
    
    // Check for search query parameter
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.searchHospitals();
      }
    });
  }


  

  loadHospitals() {
    this.hospitalService.getHospitals().subscribe(
      data => {
        this.hospitals = data;
        this.filteredHospitals = data;
        this.applyFiltersAndSort();
      }
    );
  }

  searchHospitals() {
    this.applyFiltersAndSort();
  }

  filterBySpecialty(specialty: string) {
    this.selectedSpecialty = specialty;
    this.applyFiltersAndSort();
  }

  filterByRating(rating: number) {
    this.selectedRating = rating;
    this.applyFiltersAndSort();
  }

  sortHospitals(sortBy: string) {
    this.sortBy = sortBy;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let filtered = [...this.hospitals];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(query) ||
        h.location.toLowerCase().includes(query) ||
        h.specialties.some(s => s.toLowerCase().includes(query))
      );
    }

    // Apply specialty filter
    if (this.selectedSpecialty !== 'all' && this.selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter(h =>
        h.specialties.some(s => s.toLowerCase() === this.selectedSpecialty.toLowerCase())
      );
    }

    // Apply rating filter
    if (this.selectedRating > 0) {
      filtered = filtered.filter(h => h.rating >= this.selectedRating);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'discount':
        filtered.sort((a, b) => {
          const aDiscount = parseInt(a.discount);
          const bDiscount = parseInt(b.discount);
          return bDiscount - aDiscount;
        });
        break;
    }

    this.filteredHospitals = filtered;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  viewHospitalDetails(hospital: Hospital) {
    this.selectedHospital = hospital;
  }

  closeHospitalDetails() {
    this.selectedHospital = null;
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedSpecialty = 'all';
    this.selectedRating = 0;
    this.sortBy = 'rating';
    this.applyFiltersAndSort();
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isStarFilled(star: number, rating: number): boolean {
    return star <= Math.floor(rating);
  }

  isStarHalf(star: number, rating: number): boolean {
    return star === Math.ceil(rating) && rating % 1 !== 0;
  }

  bookAppointment(hospital: Hospital) {
    // Navigate to doctors page filtered by hospital
    this.router.navigate(['/doctors'], {
      queryParams: { hospital: hospital.name }
    });
  }
}