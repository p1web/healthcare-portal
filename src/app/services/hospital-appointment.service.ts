import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HospitalAppointmentRow {
  id: number;
  bookingNumber: string | null;
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorProfileId: number | null;
  doctorName: string | null;
  specialization: string | null;
  isHospitalBooking: boolean;
  date: string;
  time: string | null;
  reason: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  rejectionReason: string | null;
  originalPrice: number | null;
  discountAmount: number;
  finalPrice: number | null;
  platformRevenueAmount: number;
  doctorPayoutAmount: number;
  paymentMode: 'online' | 'offline';
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  paidAt: string | null;
  paymentTransactionId: string | null;
  couponCode: string | null;
  cashbackAmount: number;
  cashbackStatus: 'none' | 'pending' | 'issued' | 'forfeited';
  cashbackIssuedAt: string | null;
  cashbackTransactionId: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalAppointmentService {
  private apiBase = 'http://localhost:3000/api/hospital/appointments';

  constructor(private http: HttpClient) {}

  list(filters?: { status?: string; fromDate?: string; toDate?: string }): Observable<{ success: boolean; data: HospitalAppointmentRow[] }> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.fromDate) params = params.set('fromDate', filters.fromDate);
    if (filters?.toDate) params = params.set('toDate', filters.toDate);
    return this.http.get<{ success: boolean; data: HospitalAppointmentRow[] }>(this.apiBase, { params });
  }

  confirm(id: number): Observable<{ success: boolean; message: string; data: HospitalAppointmentRow }> {
    return this.http.patch<{ success: boolean; message: string; data: HospitalAppointmentRow }>(`${this.apiBase}/${id}/confirm`, {});
  }

  complete(id: number): Observable<{ success: boolean; message: string; data: HospitalAppointmentRow }> {
    return this.http.patch<{ success: boolean; message: string; data: HospitalAppointmentRow }>(`${this.apiBase}/${id}/complete`, {});
  }

  reject(id: number, reason: string): Observable<{ success: boolean; message: string; data: HospitalAppointmentRow }> {
    return this.http.patch<{ success: boolean; message: string; data: HospitalAppointmentRow }>(`${this.apiBase}/${id}/reject`, { reason });
  }
}
