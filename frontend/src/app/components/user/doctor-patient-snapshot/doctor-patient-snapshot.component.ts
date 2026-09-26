import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DoctorService, PatientSnapshot } from '../../../services/doctor.service';

@Component({
  standalone: true,
  selector: 'app-doctor-patient-snapshot',
  imports: [CommonModule, RouterLink],
  templateUrl: './doctor-patient-snapshot.component.html',
  styleUrl: './doctor-patient-snapshot.component.css'
})
export class DoctorPatientSnapshotComponent implements OnInit {
  patientUserId!: number;
  snapshot: PatientSnapshot | null = null;
  isLoading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private doctorService: DoctorService
  ) {}

  ngOnInit(): void {
    this.patientUserId = Number(this.route.snapshot.paramMap.get('userId'));
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.doctorService.getPatientSnapshot(this.patientUserId).subscribe({
      next: (res) => {
        this.snapshot = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load patient snapshot';
        this.isLoading = false;
      }
    });
  }

  severityBadgeClass(severity?: string | null): string {
    switch ((severity || '').toLowerCase()) {
      case 'severe':
      case 'high':
      case 'critical':
        return 'bg-danger';
      case 'moderate':
      case 'medium':
        return 'bg-warning text-dark';
      case 'mild':
      case 'low':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-warning text-dark';
      case 'resolved': return 'bg-success';
      case 'chronic': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
