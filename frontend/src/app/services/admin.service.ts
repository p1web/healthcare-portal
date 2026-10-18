import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { AdminAppointment } from '../models/appointment.model';
import { environment } from '../../environments/environment';

export interface AdminProviderBankAccount {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName?: string;
  accountType?: string;
  upiId?: string;
}

export interface ActivityLogEntry {
  id: number;
  userId: number | null;
  subjectUserId: number | null;
  actorRole: string | null;
  category: string;
  actionType: string;
  result: 'success' | 'failure' | 'aborted' | string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  requestId: string | null;
  httpMethod: string | null;
  requestPath: string | null;
  ipAddress: string | null;
  browser: string | null;
  userAgent: string | null;
  sqlQuery: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: { id: number; name: string; email: string; role: string } | null;
}

export interface ActivityLogFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  result?: string;
  userId?: number;
  from?: string;
  to?: string;
}

export interface ActivityLogResponse {
  success: boolean;
  data: ActivityLogEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({
  providedIn: 'root'
})

export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getUsers(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params: filters });
  }

  getProviderBankAccount(userId: number): Observable<{ success: boolean; data: AdminProviderBankAccount | null }> {
    return this.http.get<{ success: boolean; data: AdminProviderBankAccount | null }>(
      `${this.apiUrl}/users/${userId}/bank-account`
    );
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

  getActivityLogs(filters: ActivityLogFilters): Observable<ActivityLogResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, value);
    }
    return this.http.get<ActivityLogResponse>(`${this.apiUrl}/activity-logs`, { params });
  }

  getDoctorProfile(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors-profile`, { params: filters });
  }

  updateDoctorReview(doctorProfileId: number, review: { status: string; reviewNotes?: string; rejectionReason?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/doctors-profile/${doctorProfileId}/review`, review);
  }

  downloadDoctorDocument(profileId: number, index: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/doctors-profile/${profileId}/documents/${index}/download`, {
      responseType: 'blob'
    });
  }

  updateHospitalReview(hospitalProfileId: number, review: { status: string; reviewNotes?: string; rejectionReason?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/hospital-user-profile/${hospitalProfileId}/review`, review);
  }

  downloadHospitalDocument(profileId: number, index: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/hospital-user-profile/${profileId}/documents/${index}/download`, {
      responseType: 'blob'
    });
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

  getQualifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/qualifications`);
  }

  addQualification(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-qualification`, data);
  }

  updateQualification(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-qualification/${id}`, data);
  }

  deleteQualification(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-qualification/${id}`);
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

  listPractices(filters?: { status?: string; hospitalProfileId?: number; doctorProfileId?: number }): Observable<any> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.hospitalProfileId) params.hospitalProfileId = filters.hospitalProfileId;
    if (filters?.doctorProfileId) params.doctorProfileId = filters.doctorProfileId;
    return this.http.get(`${this.apiUrl}/practices`, { params });
  }

  updatePractice(id: number, body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/practices/${id}`, body);
  }

  getCommissionSettings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/commission-settings`);
  }

  updateCommissionSettings(body: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/commission-settings`, body);
  }

  listHospitalCommissions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/hospital-commissions`);
  }

  updateHospitalCommission(hospitalProfileId: number, hospitalCommissionPercent: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/hospital-commissions/${hospitalProfileId}`, { hospitalCommissionPercent });
  }

}