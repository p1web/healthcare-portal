import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { Doctor, DoctorAvailabilitySlot } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './doctor-detail.component.html',
  styleUrls: ['./doctor-detail.component.css']
})
export class DoctorDetailComponent implements OnInit {
  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  doctor: Doctor | undefined;
  appointmentForm: FormGroup;
  isSubmitting = false;
  bookingSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.appointmentForm = this.fb.group({
      reason: [''],
      date: ['', Validators.required],
      time: ['', Validators.required]
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
        this.validateSelectedDate();
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
    if (!this.isPatientLoggedIn) {
      this.goToLogin();
      return;
    }

    this.validateSelectedDate();
    this.validateSelectedTime();
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

  validateSelectedDate(): void {
    const dateControl = this.appointmentForm.get('date');
    const dateValue = dateControl?.value;
    if (!dateControl || !dateValue || !this.doctor) return;

    const [year, month, day] = String(dateValue).split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    const isAvailable = this.doctor.availabilitySchedule.some(slot => slot.isAvailable && slot.dayOfWeek === dayOfWeek);
    const errors = { ...(dateControl.errors || {}) };
    delete errors['unavailableDay'];
    if (!isAvailable) errors['unavailableDay'] = true;
    dateControl.setErrors(Object.keys(errors).length ? errors : null);
    this.validateSelectedTime();
  }

  validateSelectedTime(): void {
    const timeControl = this.appointmentForm.get('time');
    const timeValue = timeControl?.value;
    const selectedSlot = this.selectedAvailability;
    if (!timeControl) return;

    const errors = { ...(timeControl.errors || {}) };
    delete errors['outsideAvailability'];
    if (timeValue && selectedSlot && (timeValue < selectedSlot.startTime || timeValue > selectedSlot.endTime)) {
      errors['outsideAvailability'] = true;
    }
    timeControl.setErrors(Object.keys(errors).length ? errors : null);
  }

  get selectedAvailability(): DoctorAvailabilitySlot | undefined {
    const dateValue = this.appointmentForm.get('date')?.value;
    if (!dateValue || !this.doctor) return undefined;

    const [year, month, day] = String(dateValue).split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    return this.doctor.availabilitySchedule.find(slot => slot.isAvailable && slot.dayOfWeek === dayOfWeek);
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get isPatientLoggedIn(): boolean {
    return this.isLoggedIn && this.authService.getUserRole() === 'patient';
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  formatAvailabilitySlot(slot: DoctorAvailabilitySlot): string {
    return `${this.dayNames[slot.dayOfWeek]} · ${this.formatTime(slot.startTime)}-${this.formatTime(slot.endTime)}`;
  }

  private formatTime(time: string): string {
    const [hourValue, minute] = time.split(':').map(Number);
    return `${hourValue % 12 || 12}:${String(minute).padStart(2, '0')} ${hourValue >= 12 ? 'PM' : 'AM'}`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}