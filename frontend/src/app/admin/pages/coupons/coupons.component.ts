import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, PaginationComponent],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.css'
})
export class CouponsComponent implements OnInit {
  couponsList: any[] = [];
  categoriesList: any[] = [];
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  showDeleted = false;
  searchTerm = '';
  filterCategoryId: string = '';

  bulkForm!: FormGroup;
  isBulkSubmitting = false;

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private router: Router, private adminService: AdminService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadCoupons();
    this.bulkForm = this.fb.group({
      count: [10, [Validators.required, Validators.min(1), Validators.max(500)]],
      prefix: ['BULK', Validators.required],
      categoryId: [null, Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      discountText: ['', Validators.required],
      discountType: ['percentage', Validators.required],
      discountValue: [null, [Validators.required, Validators.min(0.01)]],
      validFrom: ['', Validators.required],
      validUntil: ['', Validators.required],
      usageLimit: [null],
      maxUsesPerUser: [null]
    });
  }

  loadCategories(): void {
    this.adminService.getCouponCategories({ status: 'active' }).subscribe({
      next: (res) => { this.categoriesList = res?.data || []; },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadCoupons(): void {
    const filters: any = {};
    if (this.statusFilter !== 'all') filters.status = this.statusFilter;
    if (this.showDeleted) filters.includeDeleted = 'true';
    if (this.filterCategoryId) filters.categoryId = this.filterCategoryId;
    if (this.searchTerm) filters.search = this.searchTerm;

    this.adminService.getCoupons(filters).subscribe({
      next: (res) => { this.couponsList = res?.data || []; this.currentPage = 1; },
      error: (err) => console.error('Error loading coupons:', err)
    });
  }

  onFilterChange(): void { this.loadCoupons(); }

  get pagedCoupons(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.couponsList.slice(start, start + this.pageSize);
  }

  goToCreate(): void {
    this.router.navigate(['/admin/coupons/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/admin/coupons', id, 'edit']);
  }

  deleteCoupon(id: number): void {
    if (!confirm('Delete this coupon? It will be hidden from listings but can be restored.')) return;
    this.adminService.deleteCoupon(id).subscribe({
      next: () => { alert('Coupon deleted'); this.loadCoupons(); },
      error: (err) => this.handleError(err)
    });
  }

  restoreCoupon(id: number): void {
    this.adminService.restoreCoupon(id).subscribe({
      next: () => { alert('Coupon restored'); this.loadCoupons(); },
      error: (err) => this.handleError(err)
    });
  }

  private handleError(err: any): void {
    console.error(err);
    alert(err?.error?.message || 'Something went wrong');
  }

  openBulkModal(): void {
    this.bulkForm.patchValue({
      count: 10,
      prefix: 'BULK',
      discountType: 'percentage'
    });
  }

  submitBulk(): void {
    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      return;
    }
    const raw = this.bulkForm.value;
    const payload = {
      count: raw.count,
      prefix: raw.prefix,
      template: {
        title: raw.title,
        description: raw.description,
        discountText: raw.discountText,
        discountType: raw.discountType,
        discountValue: raw.discountValue,
        validFrom: raw.validFrom,
        validUntil: raw.validUntil,
        usageLimit: raw.usageLimit,
        maxUsesPerUser: raw.maxUsesPerUser,
        categoryId: raw.categoryId,
        terms: [],
        hospitalIds: []
      }
    };
    this.isBulkSubmitting = true;
    this.adminService.bulkGenerateCoupons(payload).subscribe({
      next: (res) => {
        this.isBulkSubmitting = false;
        alert(res?.message || 'Coupons generated');
        this.loadCoupons();
        (document.querySelector('#bulkCouponModal .btn-close') as HTMLElement | null)?.click();
      },
      error: (err) => {
        this.isBulkSubmitting = false;
        this.handleError(err);
      }
    });
  }
}
