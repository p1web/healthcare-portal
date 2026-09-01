import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PracticeService, HospitalSummary } from '../../../services/practice.service';
import { HospitalStaffService } from '../../../services/hospital-staff.service';
import { HospitalAppointmentService } from '../../../services/hospital-appointment.service';

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hospital-dashboard.component.html',
  styleUrls: ['./hospital-dashboard.component.css']
})
export class HospitalDashboardComponent implements OnInit {
  staffCount = 0;
  pendingCount = 0;
  activeCount = 0;
  summary: HospitalSummary | null = null;
  isLoading = false;

  constructor(
    private practiceService: PracticeService,
    private staffService: HospitalStaffService,
    private apptService: HospitalAppointmentService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    forkJoin({
      staff: this.staffService.listMine(),
      appts: this.apptService.list(),
      summary: this.practiceService.getHospitalSummary()
    }).subscribe({
      next: ({ staff, appts, summary }) => {
        this.staffCount = (staff.data || []).filter(s => s.isActive).length;
        const rows = appts.data || [];
        this.pendingCount = rows.filter(a => a.status === 'pending').length;
        this.activeCount = rows.filter(a => a.status === 'confirmed').length;
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
