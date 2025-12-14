import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './doctor-detail.component.html',
  styleUrls: ['./doctor-detail.component.css']
})
export class DoctorDetailComponent implements OnInit {
  doctor: Doctor | undefined;
  appointmentForm: FormGroup;
  isSubmitting = false;
  bookingSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private fb: FormBuilder
  ) {
    this.appointmentForm = this.fb.group({
      patientName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      date: ['', Validators.required],
      reason: ['']
    });
  }

  ngOnInit() {
    const doctorId = Number(this.route.snapshot.paramMap.get('id'));
    if (doctorId) {
      this.loadDoctor(doctorId);
    }
  }

  loadDoctor(id: number) {
    this.doctorService.getDoctorById(id).subscribe({
      next: (res: any) => {
        this.doctor = res.data;  // <- assign the actual doctor object
        // console.log('Loaded doctor:', this.doctor);
      },
      error: (err) => {
        console.error('Failed to load doctor', err);
      }
    });
  }


  getDoctorInitial(): string {
    if (!this.doctor) return '';
    const parts = this.doctor.name.split(' ');
    return parts.length > 1 ? parts[1][0] : parts[0][0];
  }

  onSubmit() {
    if (this.appointmentForm.valid && this.doctor) {
      this.isSubmitting = true;
      
      const appointmentData = {
        doctorId: this.doctor.id,
        ...this.appointmentForm.value
      };

      this.appointmentService.bookAppointment(appointmentData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.bookingSuccess = true;
          this.appointmentForm.reset();
          
          setTimeout(() => {
            this.bookingSuccess = false;
          }, 5000);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Booking failed:', error);
          alert('Failed to book appointment. Please try again.');
        }
      });
    } else {
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
    }
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}