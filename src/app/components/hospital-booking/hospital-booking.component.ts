import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { CouponService } from '../../services/coupon.service';
import { HospitalStaffMember, HospitalStaffService } from '../../services/hospital-staff.service';

@Component({
  standalone: true,
  selector: 'app-hospital-booking',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './hospital-booking.component.html',
  styleUrl: './hospital-booking.component.css'
})
export class HospitalBookingComponent implements OnInit {
  hospitalId!: number;
  hospital: any = null;
  staff: HospitalStaffMember[] = [];
  form!: FormGroup;

  couponInput = '';
  appliedCoupon: { code: string; discountAmount: number; finalAmount: number } | null = null;
  couponError = '';
  couponSuccess = '';
  isValidatingCoupon = false;

  isLoading = false;
  isSubmitting = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private hospitalService: HospitalService,
    private staffService: HospitalStaffService,
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
      reason: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      paymentMode: ['online', Validators.required]
    });
    this.load();
  }

  get consultationFee(): number {
    return Number(this.hospital?.consultationFee || this.hospital?.defaultConsultationFee || 0);
  }

  get isPatient(): boolean {
    const role = this.authService.getUserRole?.();
    return role === 'patient';
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }

  private load(): void {
    if (!this.hospitalId) {
      this.error = 'Invalid hospital reference.';
      return;
    }
    this.isLoading = true;
    this.hospitalService.getHospitalById(this.hospitalId).subscribe({
      next: (res: any) => {
        this.hospital = res?.data ?? res;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Could not load hospital.';
        this.isLoading = false;
      }
    });
    this.staffService.listPublic(this.hospitalId).subscribe({
      next: (res) => { this.staff = res.data || []; },
      error: () => { this.staff = []; }
    });
  }

  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  applyCoupon(): void {
    const code = (this.couponInput || '').trim().toUpperCase();
    this.couponError = '';
    this.couponSuccess = '';
    if (!code) {
      this.couponError = 'Enter a coupon code first.';
      return;
    }
    if (this.consultationFee <= 0) {
      this.couponError = 'Hospital has not set a consultation fee yet.';
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
          this.couponSuccess = `Coupon applied — ₹${this.appliedCoupon.discountAmount} will be issued as cashback after the appointment.`;
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error = '';
    this.isSubmitting = true;
    const payload: any = {
      hospitalId: this.hospitalId,
      date: this.form.value.date,
      time: this.form.value.time,
      reason: this.form.value.reason || null,
      paymentMode: this.form.value.paymentMode
    };
    if (this.appliedCoupon?.code) payload.couponCode = this.appliedCoupon.code;

    this.appointmentService.bookAppointment(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        const booked = res?.data;
        this.form.reset({ paymentMode: 'online' });
        this.removeCoupon();
        if (!booked?.id) return;
        if (booked.paymentMode === 'online' && booked.paymentStatus !== 'paid') {
          this.router.navigate(['/appointments', booked.id, 'pay']);
        } else {
          this.router.navigate(['/appointments', booked.id, 'receipt']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.error?.message || 'Failed to book appointment.';
      }
    });
  }
}
