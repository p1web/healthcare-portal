import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { SpecialtyService } from '../../services/specialty.service';
import { AuthService } from '../../services/auth.service';

import { Hospital } from '../../models/hospital.model';
import { environment } from '../../../environments/environment';

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
  viewMode: 'grid' | 'list' = 'list';
  selectedHospital: Hospital | null = null;
  specialties: string[] = ['All Specialties'];

  currentPage: number = 1;
  pageSize: number = 9;

  constructor(
    private hospitalService: HospitalService,
    private specialtyService: SpecialtyService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSpecialties();
    this.loadHospitals();
    
    // Check for search query parameter
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.searchHospitals();
      }
    });
  }

  loadSpecialties() {
    this.specialtyService.getSpecialties().subscribe(data => {

      // console.log(data);

      this.specialties = [
        'All Specialties',
        ...data.map(s => s.name)
      ];
    });
  }
  
  

  loadHospitals() {
    this.hospitalService.getHospitals().subscribe(
      res => {
        this.hospitals = res.data;       // extract the array
        this.filteredHospitals = res.data;
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
          const aDiscount = a.discount ? parseInt(a.discount) || 0 : 0;
          const bDiscount = b.discount ? parseInt(b.discount) || 0 : 0;
          return bDiscount - aDiscount;
        });
        break;
    }

    this.filteredHospitals = filtered;
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredHospitals.length / this.pageSize));
  }

  get pagedHospitals(): Hospital[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredHospitals.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredHospitals.length);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  viewHospitalDetails(hospital: Hospital) {
    this.router.navigate(['/hospital', hospital.id]);
  }

  closeHospitalDetails() {
    this.selectedHospital = null;
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedSpecialty = 'all';
    this.selectedRating = 0;
    this.sortBy = 'rating';
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery
      || (this.selectedSpecialty !== 'all' && this.selectedSpecialty !== 'All Specialties')
      || this.selectedRating > 0;
  }

  clearSpecialty() { this.filterBySpecialty('all'); }
  clearRating()    { this.filterByRating(0); }
  clearSearch()    { this.searchQuery = ''; this.searchHospitals(); }

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
    const target = `/hospital/${hospital.id}/book`;
    const isPatient = this.authService.isLoggedIn() && this.authService.getUserRole() === 'patient';
    if (!isPatient) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: target } });
      return;
    }
    this.router.navigateByUrl(target);
  }

  hospitalImageUrl(hospital: Hospital): string | null {
    const raw = hospital.profileImage || hospital.image;
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `${environment.apiHost}${raw}`;
  }
}