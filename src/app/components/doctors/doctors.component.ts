import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css']
})
export class DoctorsComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  searchQuery: string = '';
  selectedSpecialization: string = 'all';
  selectedHospital: string = 'all';
  selectedExperience: string = 'all';
  selectedRating: number = 0;
  sortBy: string = 'rating';
  viewMode: 'grid' | 'list' = 'grid';

  specializations = [
    'All Specializations',
    'Cardiologist',
    'Pediatrician',
    'Orthopedic',
    'Dermatologist',
    'Neurologist',
    'General Physician',
    'Psychiatrist',
    'Gynecologist',
    'ENT Specialist',
    'Ophthalmologist'
  ];

  hospitals = [
    'All Hospitals',
    'City General Hospital',
    'MediCare Plus',
    'HealthFirst Clinic',
    'Apollo Heart Center',
    'Neuro Care Hospital',
    'Women & Child Hospital'
  ];

  experienceRanges = [
    { label: 'All Experience', value: 'all' },
    { label: '0-5 years', value: '0-5' },
    { label: '5-10 years', value: '5-10' },
    { label: '10-15 years', value: '10-15' },
    { label: '15+ years', value: '15+' }
  ];

  constructor(
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDoctors();
    
    // Check for query parameters
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['type'] === 'specialization' && params['search']) {
        this.selectedSpecialization = params['search'];
      }
      if (params['hospital']) {
        this.selectedHospital = params['hospital'];
      }
      this.applyFiltersAndSort();
    });
  }

  loadDoctors() {
    this.doctorService.getDoctors().subscribe(
      data => {
        this.doctors = data;
        this.filteredDoctors = data;
        this.applyFiltersAndSort();
      }
    );
  }

  searchDoctors() {
    this.applyFiltersAndSort();
  }

  filterBySpecialization(specialization: string) {
    this.selectedSpecialization = specialization;
    this.applyFiltersAndSort();
  }

  filterByHospital(hospital: string) {
    this.selectedHospital = hospital;
    this.applyFiltersAndSort();
  }

  filterByExperience(experience: string) {
    this.selectedExperience = experience;
    this.applyFiltersAndSort();
  }

  filterByRating(rating: number) {
    this.selectedRating = rating;
    this.applyFiltersAndSort();
  }

  sortDoctors(sortBy: string) {
    this.sortBy = sortBy;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let filtered = [...this.doctors];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.specialization.toLowerCase().includes(query) ||
        d.hospital.toLowerCase().includes(query)
      );
    }

    // Apply specialization filter
    if (this.selectedSpecialization !== 'all' && this.selectedSpecialization !== 'All Specializations') {
      filtered = filtered.filter(d =>
        d.specialization.toLowerCase() === this.selectedSpecialization.toLowerCase()
      );
    }

    // Apply hospital filter
    if (this.selectedHospital !== 'all' && this.selectedHospital !== 'All Hospitals') {
      filtered = filtered.filter(d =>
        d.hospital.toLowerCase() === this.selectedHospital.toLowerCase()
      );
    }

    // Apply experience filter
    if (this.selectedExperience !== 'all') {
      filtered = filtered.filter(d => {
        const years = parseInt(d.experience);
        switch(this.selectedExperience) {
          case '0-5':
            return years >= 0 && years <= 5;
          case '5-10':
            return years > 5 && years <= 10;
          case '10-15':
            return years > 10 && years <= 15;
          case '15+':
            return years > 15;
          default:
            return true;
        }
      });
    }

    // Apply rating filter
    if (this.selectedRating > 0) {
      filtered = filtered.filter(d => d.rating >= this.selectedRating);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'experience':
        filtered.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
        break;
      case 'fee':
        filtered.sort((a, b) => {
          const aFee = parseInt(a.fee.replace(/[^0-9]/g, ''));
          const bFee = parseInt(b.fee.replace(/[^0-9]/g, ''));
          return aFee - bFee;
        });
        break;
    }

    this.filteredDoctors = filtered;
  }

  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedSpecialization = 'all';
    this.selectedHospital = 'all';
    this.selectedExperience = 'all';
    this.selectedRating = 0;
    this.sortBy = 'rating';
    this.applyFiltersAndSort();
  }

  viewDoctorProfile(doctorId: number) {
    this.router.navigate(['/doctor', doctorId]);
  }

  getDoctorInitial(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1 ? parts[1][0] : parts[0][0];
  }

  getExperienceYears(experience: string): number {
    return parseInt(experience);
  }
}
