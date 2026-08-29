import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PracticeService, HospitalSummary } from '../../../services/practice.service';

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hospital-dashboard.component.html',
  styleUrls: ['./hospital-dashboard.component.css']
})
export class HospitalDashboardComponent implements OnInit {
  pendingCount = 0;
  activeCount = 0;
  summary: HospitalSummary | null = null;
  isLoading = false;

  constructor(private practiceService: PracticeService) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      practices: this.practiceService.listHospitalPractices(),
      summary: this.practiceService.getHospitalSummary()
    }).subscribe({
      next: ({ practices, summary }) => {
        const rows = practices.data || [];
        this.pendingCount = rows.filter(p => p.status === 'pending_hospital_approval').length;
        this.activeCount = rows.filter(p => p.status === 'active').length;
        this.summary = summary.data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  get topDoctors() {
    return (this.summary?.perDoctor || []).slice(0, 5);
  }
}
