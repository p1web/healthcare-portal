export interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string;
  discount: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  applicableFor: 'all' | 'consultation' | 'surgery' | 'diagnostic' | 'pharmacy';
  hospitals?: string[];
  isActive: boolean;
  terms?: string[];
}
