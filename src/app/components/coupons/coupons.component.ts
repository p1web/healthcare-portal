import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../services/coupon.service';
import { Coupon } from '../../models/coupon.model';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coupons.component.html',
  styleUrls: ['./coupons.component.css']
})

export class CouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  filteredCoupons: Coupon[] = [];
  selectedFilter: string = 'all';
  searchQuery: string = '';
  selectedCoupon: Coupon | null = null;
  copiedCode: string = '';

  constructor(private couponService: CouponService) {}

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.couponService.getCoupons().subscribe(
      data => {
        this.coupons = data;
        this.filteredCoupons = data;
      }
    );
  }

  filterCoupons(type: string) {
    this.selectedFilter = type;
    if (type === 'all') {
      this.filteredCoupons = this.coupons;
    } else {
      this.filteredCoupons = this.coupons.filter(c => c.applicableFor === type);
    }
  }

  searchCoupons() {
    if (!this.searchQuery.trim()) {
      this.filteredCoupons = this.coupons;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCoupons = this.coupons.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  }

  copyCouponCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedCode = code;
      setTimeout(() => {
        this.copiedCode = '';
      }, 2000);
    });
  }

  viewCouponDetails(coupon: Coupon) {
    this.selectedCoupon = coupon;
  }

  closeCouponDetails() {
    this.selectedCoupon = null;
  }

  isExpiringSoon(coupon: Coupon): boolean {
    const now = new Date();
    const daysUntilExpiry = Math.floor((coupon.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  }

  getUsagePercentage(coupon: Coupon): number {
    if (!coupon.usageLimit) return 0;
    return (coupon.usedCount / coupon.usageLimit) * 100;
  }

  getDaysRemaining(coupon: Coupon): number {
    const now = new Date();
    return Math.floor((coupon.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
}
