import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-coupon-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coupon-analytics.component.html',
  styleUrl: './coupon-analytics.component.css'
})
export class CouponAnalyticsComponent implements OnInit {
  data: any = null;
  isLoading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.adminService.getCouponAnalytics().subscribe({
      next: (res) => { this.data = res?.data; this.isLoading = false; },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }
}
