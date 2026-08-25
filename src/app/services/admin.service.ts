import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { AdminAppointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})

export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin'; // Replace with your API

  constructor(private http: HttpClient) {}

  getUsers(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params: filters });
  }

  updateUserAccountStatus(userId: number, status: 'active' | 'blocked'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/account-status`, { status });
  }

  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<User>): Observable<{ success: boolean; message: string; data: User }> {
    return this.http.put<{ success: boolean; message: string; data: User }>(`${this.apiUrl}/profile`, profile);
  }

  getAppointments(): Observable<{ success: boolean; data: AdminAppointment[] }> {
    return this.http.get<{ success: boolean; data: AdminAppointment[] }>(`${this.apiUrl}/appointments`);
  }

  getDoctorProfile(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors-profile`, { params: filters });
  }

  updateDoctorReview(doctorProfileId: number, review: { status: string; reviewNotes?: string; rejectionReason?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/doctors-profile/${doctorProfileId}/review`, review);
  }

  updateHospitalReview(hospitalProfileId: number, review: { status: string; reviewNotes?: string; rejectionReason?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/hospital-user-profile/${hospitalProfileId}/review`, review);
  }

  getSpecializationList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/specialization-list`);
  }

  getHospitals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/public-hospitals`);
  }

  getSpecialities(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/specialities`);
  }

  getSpecializations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/specializations`);
  }

  getDoctorSpecializationMapping(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctor-specialization-mapping`);
  }

  addSpeciality(specialityData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-speciality`, specialityData);
  }

  deleteSpeciality(specialityId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-speciality/${specialityId}`);
  } 

  updateSpeciality(specialityId: number, specialityData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-speciality/${specialityId}`, specialityData);
  }

  addSpecialization(specializationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-specialization`, specializationData);
  }

  updateSpecialization(specializationId: number, specializationData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-specialization/${specializationId}`, specializationData);
  }

  deleteSpecialization(specializationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-specialization/${specializationId}`);
  }

  // --- Coupon Categories ---
  getCouponCategories(filters: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupon-categories`, { params: filters });
  }
  getCouponCategoryById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupon-categories/${id}`);
  }

  addCouponCategory(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupon-categories`, data);
  }

  updateCouponCategory(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/coupon-categories/${id}`, data);
  }

  deleteCouponCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/coupon-categories/${id}`);
  }

  restoreCouponCategory(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/coupon-categories/${id}/restore`, {});
  }

  // --- Coupons ---
  getCoupons(filters: any = {}): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons`, { params: filters });
  }

  getCouponById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons/${id}`);
  }

  addCoupon(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupons`, data);
  }

  updateCoupon(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/coupons/${id}`, data);
  }

  deleteCoupon(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/coupons/${id}`);
  }

  restoreCoupon(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/coupons/${id}/restore`, {});
  }

  getCouponAnalytics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/coupons-analytics`);
  }

  bulkGenerateCoupons(payload: { count: number; prefix: string; template: any }): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupons/bulk`, payload);
  }

}