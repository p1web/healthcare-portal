import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { CouponService } from '../../services/coupon.service';
import { PracticeService, Practice } from '../../services/practice.service';
import { Doctor, DoctorAvailabilitySlot } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './doctor-detail.component.html',
  styleUrls: ['./doctor-detail.component.css']
})
export class DoctorDetailComponent implements OnInit {
  readonly dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  doctor: Doctor | undefined;
  appointmentForm: FormGroup;
  isSubmitting = false;
  bookingSuccess = false;
  bookingResult: any = null;

  practices: Practice[] = [];
  selectedPractice: Practice | null = null;
  isLoadingPractices = false;

  // Coupon state
  applicableCoupons: any[] = [];
  isLoadingCoupons = false;
  couponInput = '';
  appliedCoupon: any = null;
  couponError = '';
  couponSuccess = '';
  isValidatingCoupon = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private couponService: CouponService,
    private practiceService: PracticeService,
    private fb: FormBuilder
  ) {
    this.appointmentForm = this.fb.group({
      reason: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      paymentMode: ['online', Validators.required]
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
        this.doctor = res.data;
        this.validateSelectedDate();
        this.loadPractices(id);
      },
      error: (err) => {
        console.error('Failed to load doctor', err);
      }
    });
  }

  loadPractices(doctorId: number): void {
    this.isLoadingPractices = true;
    this.practiceService.listForDoctor(doctorId).subscribe({
      next: (res) => {
        this.practices = res.data || [];
        const primary = this.practices.find(p => p.isPrimary) || this.practices[0] || null;
        this.selectPractice(primary);
        this.isLoadingPractices = false;
      },
      error: () => {
        this.practices = [];
        this.selectedPractice = null;
        this.isLoadingPractices = false;
        this.loadApplicableCoupons();
      }
    });
  }

  selectPractice(practice: Practice | null): void {
    this.selectedPractice = practice;
    this.removeCoupon();
    this.loadApplicableCoupons();
  }

  onPracticeChange(practiceId: number | string): void {
    const id = Number(practiceId);
    const found = this.practices.find(p => p.id === id) || null;
    this.selectPractice(found);
  }

  get activeHospitalId(): number | undefined {
    return this.selectedPractice?.hospitalProfileId ?? this.doctor?.hospital_id ?? undefined;
  }

  get activeConsultationFee(): number {
    if (this.selectedPractice) return this.selectedPractice.consultationFee || 0;
    return this.parsedFee;
  }

  loadApplicableCoupons(): void {
    if (!this.doctor) return;
    this.isLoadingCoupons = true;
    const amount = this.activeConsultationFee;
    const hospitalId = this.activeHospitalId;

    this.couponService.getCoupons().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.applicableCoupons = list.filter((c: any) => {
          if (!c?.isActive) return false;
          if (c.minAmount && amount < c.minAmount) return false;
          const hospitalIds: any[] = c.hospitalIds || [];
          if (hospitalIds.length > 0 && hospitalId) {
            return hospitalIds.includes(hospitalId);
          }
          return true;
        });
        this.isLoadingCoupons = false;
      },
      error: () => {
        this.applicableCoupons = [];
        this.isLoadingCoupons = false;
      }
    });
  }

  get parsedFee(): number {
    if (!this.doctor?.fee) return 0;
    const n = parseFloat(String(this.doctor.fee).replace(/[^\d.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  selectCoupon(code: string): void {
    this.couponInput = code;
    this.applyCoupon();
  }

  applyCoupon(): void {
    const code = (this.couponInput || '').trim();
    this.couponError = '';
    this.couponSuccess = '';
    if (!code) {
      this.couponError = 'Please enter a coupon code';
      return;
    }
    if (!this.doctor) return;

    this.isValidatingCoupon = true;
    this.couponService
      .validateCouponRemote(code, this.activeConsultationFee, this.activeHospitalId)
      .subscribe({
        next: (res: any) => {
          this.isValidatingCoupon = false;
          if (res?.success && res?.data) {
            this.appliedCoupon = {
              code: res.data.code,
              discountAmount: res.data.discountAmount,
              finalAmount: res.data.finalAmount
            };
            this.couponSuccess = `Coupon applied — you save ₹${res.data.discountAmount}`;
          } else {
            this.appliedCoupon = null;
            this.couponError = res?.message || 'Coupon could not be applied';
          }
        },
        error: (err) => {
          this.isValidatingCoupon = false;
          this.appliedCoupon = null;
          this.couponError = err?.error?.message || 'Coupon could not be applied';
        }
      });
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponInput = '';
    this.couponError = '';
    this.couponSuccess = '';
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
      this.submitBooking(this.activeConsultationFee);
    } else {
      Object.keys(this.appointmentForm.controls).forEach(key => {
        this.appointmentForm.get(key)?.markAsTouched();
      });
    }
  }

  private submitBooking(expectedFee: number): void {
    if (!this.doctor) return;
    this.isSubmitting = true;

    const appointmentData: any = {
      doctorId: this.doctor.id,
      ...this.appointmentForm.value,
      expectedFee
    };
    if (this.selectedPractice) {
      appointmentData.practiceId = this.selectedPractice.id;
    }
    if (this.appliedCoupon?.code) {
      appointmentData.couponCode = this.appliedCoupon.code;
    }

    this.appointmentService.bookAppointment(appointmentData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        const booked = response?.data;
        this.appointmentForm.reset({ paymentMode: 'online' });
        this.removeCoupon();

        if (!booked?.id) {
          this.bookingSuccess = true;
          this.bookingResult = booked || null;
          setTimeout(() => { this.bookingSuccess = false; this.bookingResult = null; }, 8000);
          return;
        }

        if (booked.paymentMode === 'online' && booked.paymentStatus !== 'paid') {
          this.router.navigate(['/appointments', booked.id, 'pay']);
        } else {
          this.router.navigate(['/appointments', booked.id, 'receipt']);
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        const code = error?.error?.code;
        const currentFee = Number(error?.error?.currentFee);
        if (code === 'FEE_CHANGED' && Number.isFinite(currentFee)) {
          this.handleFeeChange(currentFee, Number(error?.error?.previousFee));
          return;
        }
        console.error('Booking failed:', error);
        alert(error?.error?.message || 'Failed to book appointment. Please try again.');
      }
    });
  }

  private handleFeeChange(currentFee: number, previousFee: number): void {
    if (this.selectedPractice) {
      this.selectedPractice = { ...this.selectedPractice, consultationFee: currentFee };
    }
    const droppedCoupon = this.appliedCoupon?.code || null;
    this.removeCoupon();

    const priceLine = `The consultation fee changed from \u20b9${previousFee.toFixed(2)} to \u20b9${currentFee.toFixed(2)}.`;
    const couponLine = droppedCoupon ? `\nCoupon ${droppedCoupon} was removed; please re-apply if it still qualifies.` : '';
    if (confirm(`${priceLine}${couponLine}\n\nContinue booking at the new price?`)) {
      this.submitBooking(currentFee);
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