import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';

type SortOption = 'expiry' | 'discount' | 'newest';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.css']
})

export class CouponsComponent implements OnInit, OnDestroy {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  selectedFilter: string = 'all';
  searchQuery: string = '';
  sortBy: SortOption = 'expiry';
  selectedCoupon: Coupon | null = null;
  copiedCode: string = '';

  isLoading = true;
  loadError = '';

  toastMessage = '';
  toastType: 'success' | 'danger' = 'success';
  private toastTimeout: any;

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  constructor(private couponService: CouponService, private router: Router) {}

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300))
      .subscribe(() => this.applyFilters());

    this.loadCoupons();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    clearTimeout(this.toastTimeout);
  }

  loadCoupons() {
    this.isLoading = true;
    this.loadError = '';

    this.couponService.getCoupons().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.success) {
          this.coupons = res.data;
        } else {
          this.coupons = [];
          this.loadError = 'No coupons available right now.';
        }
        this.applyFilters();
      },
      error: () => {
        this.isLoading = false;
        this.coupons = [];
        this.filteredCoupons = [];
        this.loadError = 'Failed to load coupons. Please try again later.';
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  filterCoupons(type: string) {
    this.selectedFilter = type;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = this.coupons;

    if (this.selectedFilter !== 'all') {
      result = result.filter(c => c.applicableFor === this.selectedFilter);
    }

    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(c =>
        c.code.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    this.filteredCoupons = this.sortCoupons(result);
  }

  private sortCoupons(list: Coupon[]): Coupon[] {
    const usable = list.filter(c => this.isUsable(c));
    const unusable = list.filter(c => !this.isUsable(c));

    const compareFn = (a: Coupon, b: Coupon): number => {
      switch (this.sortBy) {
        case 'discount':
          return b.discountValue - a.discountValue;
        case 'newest':
          return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
        case 'expiry':
        default:
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
      }
    };

    // Usable coupons are always shown before expired/fully-redeemed ones
    return [...usable.sort(compareFn), ...unusable.sort(compareFn)];
  }

  copyCouponCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      setTimeout(() => {
        this.copiedCode = '';
      }, 2000);
    }).catch(() => {
      this.showToast('danger', 'Could not copy code. Please copy it manually.');
    });
  }

  useCoupon(coupon: Coupon, event?: Event): void {
    event?.stopPropagation();

    if (!this.isUsable(coupon)) {
      return;
    }

    navigator.clipboard.writeText(coupon.code).catch(() => {});
    this.copiedCode = coupon.code;
    setTimeout(() => {
      this.copiedCode = '';
    }, 2000);
    this.showToast('success', `Code ${coupon.code} copied! Redirecting to book a service...`);

    setTimeout(() => {
      this.router.navigate(['/doctors'], { queryParams: { coupon: coupon.code } });
    }, 900);
  }

  viewCouponDetails(coupon: Coupon) {
    this.selectedCoupon = coupon;
  }

  closeCouponDetails() {
    this.selectedCoupon = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedCoupon) {
      this.closeCouponDetails();
    }
  }

  private showToast(type: 'success' | 'danger', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => (this.toastMessage = ''), 3000);
  }

  isExpiringSoon(coupon: Coupon): boolean {
    const daysUntilExpiry = this.getDaysRemaining(coupon);
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }

  isExpired(coupon: Coupon): boolean {
    return this.getDaysRemaining(coupon) < 0;
  }

  isFullyUsed(coupon: Coupon): boolean {
    return !!coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
  }

  isUsable(coupon: Coupon): boolean {
    return coupon.isActive !== false && !this.isExpired(coupon) && !this.isFullyUsed(coupon);
  }

  getUsagePercentage(coupon: Coupon): number {
    if (!coupon.usageLimit) return 0;
    return (coupon.usedCount / coupon.usageLimit) * 100;
  }

  getDaysRemaining(coupon: Coupon): number {
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);

    return Math.floor(
      (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'consultation': 'bi-stethoscope',
      'surgery': 'bi-heart-pulse',
      'diagnostic': 'bi-clipboard2-pulse',
      'pharmacy': 'bi-capsule',
      'all': 'bi-grid'
    };
    return icons[category] || 'bi-tag';
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'consultation': 'primary',
      'surgery': 'danger',
      'diagnostic': 'info',
      'pharmacy': 'success',
      'all': 'secondary'
    };
    return colors[category] || 'secondary';
  }

  // Centralizes the category -> Bootstrap class composition used throughout the template
  colorClass(category: string, prefix: string): string {
    return `${prefix}-${this.getCategoryColor(category)}`;
  }
}
