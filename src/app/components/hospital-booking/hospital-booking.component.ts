import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { CouponService } from '../../services/coupon.service';
import {
  BookingDepartment,
  BookingDoctor,
  HospitalBookingOptions,
  HospitalBookingOptionsService
} from '../../services/hospital-booking-options.service';

@Component({
  standalone: true,
  selector: 'app-hospital-booking',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './hospital-booking.component.html',
  styleUrl: './hospital-booking.component.css'
})
export class HospitalBookingComponent implements OnInit {
  hospitalId!: number;
  options: HospitalBookingOptions | null = null;
  form!: FormGroup;

  couponInput = '';
  appliedCoupon: { code: string; discountAmount: number; finalAmount: number } | null = null;
  couponError = '';
  couponSuccess = '';
  isValidatingCoupon = false;

  applicableCoupons: any[] = [];
  isLoadingCoupons = false;

  isLoading = false;
  isSubmitting = false;
  error = '';

  readonly days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookingOptionsService: HospitalBookingOptionsService,
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private couponService: CouponService
  ) {}

  ngOnInit(): void {
    this.hospitalId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.authService.isLoggedIn() || this.authService.getUserRole() !== 'patient') {
      this.goToLogin();
      return;
    }
    this.form = this.fb.group({
      departmentId: [null as number | null, Validators.required],
      hospitalStaffId: [null as number | null, Validators.required],
      reason: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      paymentMode: ['online', Validators.required]
    });
    this.form.get('departmentId')?.valueChanges.subscribe(() => {
      this.form.patchValue({ hospitalStaffId: null }, { emitEvent: false });
      this.removeCoupon();
      this.autoSelectDoctor();
      this.loadApplicableCoupons();
    });
    this.form.get('hospitalStaffId')?.valueChanges.subscribe(() => {
      this.removeCoupon();
      this.loadApplicableCoupons();
    });
    this.load();
  }

  get departments(): BookingDepartment[] {
    return this.options?.departments || [];
  }

  get selectedDepartment(): BookingDepartment | null {
    const id = Number(this.form?.value.departmentId);
    return this.departments.find(department => department.id === id) || null;
  }

  get doctorsInDepartment(): BookingDoctor[] {
    return this.selectedDepartment?.doctors || [];
  }

  get selectedDoctor(): BookingDoctor | null {
    const id = Number(this.form?.value.hospitalStaffId);
    return this.doctorsInDepartment.find(doctor => doctor.id === id) || null;
  }

  get consultationFee(): number {
    return this.selectedDoctor?.effectiveConsultationFee ?? this.options?.defaultConsultationFee ?? 0;
  }

  get isPatient(): boolean {
    const role = this.authService.getUserRole?.();
    return role === 'patient';
  }

  get acceptsBookings(): boolean {
    return this.options?.acceptsBookings !== false;
  }

  get availabilitySummary(): string {
    if (!this.selectedDoctor?.availability?.length) return 'No weekly hours listed';
    return this.selectedDoctor.availability
      .map(slot => `${this.days[slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}`)
      .join(' · ');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private load(): void {
    if (!this.hospitalId) {
      this.error = 'Invalid hospital reference.';
      return;
    }
    this.isLoading = true;
    this.bookingOptionsService.getBookingOptions(this.hospitalId).subscribe({
      next: (res) => {
        this.options = res?.data || null;
        this.isLoading = false;
        this.autoSelectSingletons();
        this.loadApplicableCoupons();
      },
      error: () => {
        this.error = 'Could not load booking options for this hospital.';
        this.isLoading = false;
      }
    });
  }

  private autoSelectSingletons(): void {
    if (this.departments.length === 1) {
      this.form.patchValue({ departmentId: this.departments[0].id });
    }
  }

  private autoSelectDoctor(): void {
    if (this.doctorsInDepartment.length === 1) {
      this.form.patchValue({ hospitalStaffId: this.doctorsInDepartment[0].id }, { emitEvent: false });
    }
  }

  loadApplicableCoupons(): void {
    if (!this.hospitalId) return;
    this.isLoadingCoupons = true;
    const amount = this.consultationFee;
    this.couponService.getCoupons().subscribe({
      next: (res: any) => {
        const list = res?.data || [];
        this.applicableCoupons = list.filter((coupon: any) => {
          if (!coupon?.isActive) return false;
          if (coupon.minAmount && amount > 0 && amount < coupon.minAmount) return false;
          const hospitalIds: any[] = coupon.hospitalIds || [];
          if (hospitalIds.length > 0) return hospitalIds.includes(this.hospitalId);
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

  selectCoupon(code: string): void {
    this.couponInput = code;
    this.applyCoupon();
  }

  applyCoupon(): void {
    const code = (this.couponInput || '').trim().toUpperCase();
    this.couponError = '';
    this.couponSuccess = '';
    if (!code) {
      this.couponError = 'Enter a coupon code first.';
      return;
    }
    if (!this.selectedDoctor) {
      this.couponError = 'Please choose a doctor before applying a coupon.';
      return;
    }
    if (this.consultationFee <= 0) {
      this.couponError = 'This doctor does not have a consultation fee configured yet.';
      return;
    }
    this.isValidatingCoupon = true;
    this.couponService.validateCouponRemote(code, this.consultationFee, this.hospitalId).subscribe({
      next: (res: any) => {
        this.isValidatingCoupon = false;
        if (res?.success && res?.data) {
          this.appliedCoupon = {
            code,
            discountAmount: Number(res.data.discountAmount || 0),
            finalAmount: Number(res.data.finalAmount || this.consultationFee)
          };
          this.couponSuccess = `Coupon applied — ₹${this.appliedCoupon.discountAmount} will be credited as cashback after the appointment.`;
        } else {
          this.couponError = res?.message || 'Coupon could not be applied.';
          this.appliedCoupon = null;
        }
      },
      error: (err) => {
        this.isValidatingCoupon = false;
        this.appliedCoupon = null;
        this.couponError = err?.error?.message || 'Coupon could not be applied.';
      }
    });
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponInput = '';
    this.couponError = '';
    this.couponSuccess = '';
  }

  onSubmit(): void {
    if (!this.isPatient) {
      this.goToLogin();
      return;
    }
    if (this.form.invalid || !this.selectedDoctor || !this.selectedDepartment) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitBooking(this.consultationFee);
  }

  private submitBooking(expectedFee: number): void {
    this.error = '';
    this.isSubmitting = true;
    const payload: any = {
      hospitalId: this.hospitalId,
      departmentId: this.selectedDepartment?.id,
      hospitalStaffId: this.selectedDoctor?.id,
      date: this.form.value.date,
      time: this.form.value.time,
      reason: this.form.value.reason || null,
      paymentMode: this.form.value.paymentMode,
      expectedFee
    };
    if (this.appliedCoupon?.code) payload.couponCode = this.appliedCoupon.code;

    this.appointmentService.bookAppointment(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const booked = res?.data;
        this.form.reset({ paymentMode: 'online' });
        this.removeCoupon();
        this.load();
        if (!booked?.id) return;
        if (booked.paymentMode === 'online' && booked.paymentStatus !== 'paid') {
          this.router.navigate(['/appointments', booked.id, 'pay']);
        } else {
          this.router.navigate(['/appointments', booked.id, 'receipt']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const code = err?.error?.code;
        if (code === 'FEE_CHANGED') {
          const currentFee = Number(err?.error?.currentFee);
          if (Number.isFinite(currentFee) && this.selectedDoctor) {
            this.selectedDoctor.effectiveConsultationFee = currentFee;
          }
          this.removeCoupon();
          if (confirm(`The consultation fee changed to \u20b9${Number(err?.error?.currentFee).toFixed(2)}. Continue booking at the new fee?`)) {
            this.submitBooking(currentFee);
          }
          return;
        }
        if (code === 'SLOT_TAKEN') {
          this.error = 'This slot was just booked. Please choose a different time.';
          return;
        }
        this.error = err?.error?.message || 'Failed to book appointment.';
      }
    });
  }
}
