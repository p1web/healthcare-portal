import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { SpecializationService, Specializations } from '../../services/specialization.service';
import { HospitalService } from '../../services/hospital.service';
import { Doctor } from '../../models/doctor.model';
import { Hospital } from '../../models/hospital.model';


@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.css']
})

export class DoctorsComponent implements OnInit {

  doctors: Doctor[] = [];
  specializations: Specializations[] = [];
  hospitals: any[] = [];
  hospitalList: any[] = [];
  selectedSpecialization: any = '';

  filteredDoctors: Doctor[] = [];
  searchType: 'all' | 'doctor' | 'hospital' | 'specialization' = 'all';
  searchQuery: string = '';
  // selectedSpecialization: string = 'all';
  selectedHospital: any = '';
  selectedExperience: string = 'all';
  selectedRating: number = 0;
  sortBy: string = 'rating';
  viewMode: 'grid' | 'list' = 'grid';


  constructor(
    private doctorService: DoctorService,
    private specializationService: SpecializationService,
    private hospitalService: HospitalService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
  // Load specializations, hospitals, doctors
  this.loadSpecializations();
  this.loadhospitals();
  this.loadDoctors();

  // Handle query parameters
    this.route.queryParams.subscribe(params => {
      const search = params['search'];
      const type = params['type'];

      if (type === 'specialization' && search) {
        // Wait until specializations are loaded
        const spec = this.specializations.find(s => s.id === Number(search));
        if (spec) {
          this.selectedSpecialization = spec.id; // for filtering
          this.searchQuery = spec.name;          // for input display
        } else {
          // If not found yet, just store ID; you can later map after loadSpecializations()
          this.selectedSpecialization = Number(search);
        }
      } else if (search) {
        this.searchQuery = search; // normal text search
      }

      if (params['hospital']) {
        this.selectedHospital = Number(params['hospital']);
      }

      if (type) {
        this.searchType = type;
      }

      this.applyFiltersAndSort();
    });
  }



  loadSpecializations(): void {
    this.specializationService.getSpecializations().subscribe({
      next: (data) => {
        this.specializations = data;
      },
      error: (err) => {
        console.error('Failed to load specializations', err);
      }
    });
  }
  
  loadhospitals(): void {
    this.hospitalService.getHospitalList().subscribe({
      next: (res) => {
        this.hospitalList = res;
      },
      error: (err) => {
        console.error('Failed to load hospitals', err);
      }
    });
  }



  // hospitals = [
  //   'All Hospitals',
  //   'City General Hospital',
  //   'MediCare Plus',
  //   'HealthFirst Clinic',
  //   'Apollo Heart Center',
  //   'Neuro Care Hospital',
  //   'Women & Child Hospital'
  // ];
  

  experienceRanges = [
    { label: 'All Experience', value: 'all' },
    { label: '0-5 years', value: '0-5' },
    { label: '5-10 years', value: '5-10' },
    { label: '10-15 years', value: '10-15' },
    { label: '15+ years', value: '15+' }
  ];

  loadDoctors() {
    this.doctorService.getDoctors().subscribe({
      next: (res: any) => {
        // console.log(res);
        this.doctors = res.data;
        this.filteredDoctors = res.data;
        this.applyFiltersAndSort();
      },
      error: (err) => {
        console.error('Failed to load doctors', err);
      }
    });
  }


  searchDoctors() {
    this.applyFiltersAndSort();
  }

  filterBySpecialization(specId: any ) {
    this.searchQuery = '';
    this.selectedSpecialization = specId;
    this.applyFiltersAndSort();
  }

  filterByHospital(hospitalId: any) {
    this.selectedHospital = hospitalId;
    this.applyFiltersAndSort();
  }

  filterByExperience(experience: any) {
    this.selectedExperience = experience;
    this.applyFiltersAndSort();
  }

  filterByRating(rating: any) {
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
    if (this.selectedSpecialization !== '' && this.selectedSpecialization != null) {
      filtered = filtered.filter(d =>
        d.specialization_id === Number(this.selectedSpecialization)
      );
    }

    // Apply hospital filter
    if (this.selectedHospital !== '') {
      filtered = filtered.filter(d =>
        d.hospital_id === Number(this.selectedHospital)
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
    this.selectedSpecialization = '';
    this.selectedHospital = '';
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
