import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Coupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = 'http://localhost:3000/api/coupons';

  // Mock data for development
  private mockCoupons: Coupon[] = [
    {
      id: 1,
      code: 'HEALTH20',
      title: 'First Time Consultation',
      description: 'Get 20% off on your first consultation with any doctor',
      discount: '20% OFF',
      discountType: 'percentage',
      discountValue: 20,
      minAmount: 500,
      maxDiscount: 500,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      usageLimit: 1000,
      usedCount: 342,
      applicableFor: 'consultation',
      isActive: true,
      terms: [
        'Valid for first-time users only',
        'Minimum consultation fee of ₹500 required',
        'Cannot be combined with other offers',
        'Valid for online and offline consultations'
      ]
    },
    {
      id: 2,
      code: 'SURGERY30',
      title: 'Surgery Discount',
      description: 'Save 30% on all surgical procedures',
      discount: '30% OFF',
      discountType: 'percentage',
      discountValue: 30,
      minAmount: 10000,
      maxDiscount: 15000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-06-30'),
      usageLimit: 500,
      usedCount: 156,
      applicableFor: 'surgery',
      hospitals: ['City General Hospital', 'MediCare Plus'],
      isActive: true,
      terms: [
        'Valid at select hospitals only',
        'Minimum procedure cost of ₹10,000',
        'Maximum discount of ₹15,000',
        'Subject to doctor availability'
      ]
    },
    {
      id: 3,
      code: 'DIAGNOSTIC15',
      title: 'Lab Test Savings',
      description: 'Get 15% discount on all diagnostic tests',
      discount: '15% OFF',
      discountType: 'percentage',
      discountValue: 15,
      minAmount: 300,
      maxDiscount: 1000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      usageLimit: 2000,
      usedCount: 892,
      applicableFor: 'diagnostic',
      isActive: true,
      terms: [
        'Valid for all blood tests and imaging',
        'Home sample collection available',
        'Results within 24-48 hours',
        'No maximum usage limit per user'
      ]
    },
    {
      id: 4,
      code: 'WELLNESS500',
      title: 'Health Checkup Package',
      description: 'Flat ₹500 off on comprehensive health checkup packages',
      discount: '₹500 OFF',
      discountType: 'fixed',
      discountValue: 500,
      minAmount: 2000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      usageLimit: 1500,
      usedCount: 623,
      applicableFor: 'diagnostic',
      isActive: true,
      terms: [
        'Valid on packages worth ₹2,000 and above',
        'Includes full body checkup',
        'Free home sample collection',
        'Valid at all partner hospitals'
      ]
    },
    {
      id: 5,
      code: 'CARDIO25',
      title: 'Heart Health Special',
      description: '25% off on cardiology consultations and tests',
      discount: '25% OFF',
      discountType: 'percentage',
      discountValue: 25,
      minAmount: 1000,
      maxDiscount: 2000,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-03-31'),
      usageLimit: 300,
      usedCount: 87,
      applicableFor: 'consultation',
      hospitals: ['City General Hospital'],
      isActive: true,
      terms: [
        'Valid for cardiology department only',
        'Includes ECG and consultation',
        'Available at City General Hospital',
        'Limited time offer'
      ]
    },
    {
      id: 6,
      code: 'PHARMACY10',
      title: 'Medicine Discount',
      description: 'Get 10% off on all medicines',
      discount: '10% OFF',
      discountType: 'percentage',
      discountValue: 10,
      minAmount: 200,
      maxDiscount: 500,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      usageLimit: 5000,
      usedCount: 2341,
      applicableFor: 'pharmacy',
      isActive: true,
      terms: [
        'Valid on all prescription medicines',
        'Free home delivery on orders above ₹500',
        'Valid prescription required',
        'Can be used multiple times'
      ]
    }
  ];

  constructor(private http: HttpClient) { }

  getCoupons(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }


  getCouponByCode(code: string): Observable<Coupon | undefined> {
    return this.http.get<Coupon>(`${this.apiUrl}/code/${code}`);
    // return of(this.mockCoupons.find(c => c.code.toLowerCase() === code.toLowerCase()));
  }

  validateCoupon(code: string, amount: number): Observable<{ valid: boolean; message: string; discount?: number }> {
    const coupon = this.mockCoupons.find(c => c.code.toLowerCase() === code.toLowerCase());

    if (!coupon) {
      return of({ valid: false, message: 'Invalid coupon code' });
    }

    if (!coupon.isActive) {
      return of({ valid: false, message: 'This coupon is no longer active' });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return of({ valid: false, message: 'This coupon has expired' });
    }

    if (coupon.minAmount && amount < coupon.minAmount) {
      return of({ valid: false, message: `Minimum amount of ₹${coupon.minAmount} required` });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return of({ valid: false, message: 'This coupon has reached its usage limit' });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    return of({
      valid: true,
      message: 'Coupon applied successfully!',
      discount: discountAmount
    });
  }
}