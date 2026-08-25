import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { Select2Directive } from '../../../../shared/directives/select2.directive';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, Select2Directive],
  templateUrl: './coupon-form.component.html',
  styleUrl: './coupon-form.component.css'
})
export class CouponFormComponent implements OnInit {
  form!: FormGroup;
  categoriesList: any[] = [];
  hospitalsList: any[] = [];
  hospitalOptions: { id: number; text: string }[] = [];
  isEdit = false;
  couponId: number | null = null;
  isSubmitting = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!idParam;
    this.couponId = idParam ? Number(idParam) : null;

    this.loadCategories();
    this.loadHospitals(() => {
      if (this.isEdit && this.couponId !== null) {
        this.loadCoupon(this.couponId);
      }
    });
  }

  initForm(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      title: ['', Validators.required],
      description: ['', Validators.required],
      discountText: ['', Validators.required],
      discountType: ['percentage', Validators.required],
      discountValue: [null, [Validators.required, Validators.min(0.01)]],
      minAmount: [null],
      maxDiscount: [null],
      validFrom: ['', Validators.required],
      validUntil: ['', Validators.required],
      usageLimit: [null],
      maxUsesPerUser: [null],
      categoryId: [null, Validators.required],
      terms: this.fb.array([]),
      hospitalIds: [[] as number[]],
      isActive: [true]
    });
  }

  get terms(): FormArray { return this.form.get('terms') as FormArray; }

  addTerm(): void { this.terms.push(this.fb.control('', Validators.required)); }
  removeTerm(index: number): void { this.terms.removeAt(index); }

  loadCategories(): void {
    this.adminService.getCouponCategories({ status: 'active' }).subscribe({
      next: (res) => { this.categoriesList = res?.data || []; },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadHospitals(cb?: () => void): void {
    this.adminService.getHospitals().subscribe({
      next: (res: any) => {
        this.hospitalsList = Array.isArray(res) ? res : (res?.data || []);
        this.hospitalOptions = this.hospitalsList.map(h => ({
          id: h.id,
          text: h.name || h.hospitalName || `Hospital #${h.id}`
        }));
        if (cb) cb();
      },
      error: (err) => {
        console.error('Error loading hospitals:', err);
        if (cb) cb();
      }
    });
  }

  loadCoupon(id: number): void {
    this.isLoading = true;
    this.adminService.getCouponById(id).subscribe({
      next: (res) => {
        const c = res?.data;
        if (!c) return;
        this.terms.clear();
        (c.terms || []).forEach((t: string) => {
          this.terms.push(this.fb.control(t, Validators.required));
        });
        this.form.patchValue({
          code: c.code,
          title: c.title,
          description: c.description,
          discountText: c.discountText,
          discountType: c.discountType,
          discountValue: c.discountValue,
          minAmount: c.minAmount,
          maxDiscount: c.maxDiscount,
          validFrom: this.toDateInput(c.validFrom),
          validUntil: this.toDateInput(c.validUntil),
          usageLimit: c.usageLimit,
          maxUsesPerUser: c.maxUsesPerUser,
          categoryId: c.categoryId,
          hospitalIds: c.hospitalIds || [],
          isActive: c.isActive
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        alert('Failed to load coupon');
      }
    });
  }

  private toDateInput(date: string | null): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const payload = this.form.value;

    const request$ = this.isEdit && this.couponId !== null
      ? this.adminService.updateCoupon(this.couponId, payload)
      : this.adminService.addCoupon(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        alert(this.isEdit ? 'Coupon updated successfully' : 'Coupon created successfully');
        this.router.navigate(['/admin/coupons']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        alert(err?.error?.message || 'Something went wrong');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/coupons']);
  }
}
