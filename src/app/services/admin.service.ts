import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class AdminService {
  private apiUrl = 'http://localhost:3000/api/admin'; // Replace with your API

  constructor(private http: HttpClient) {}

  getUsers(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { params: filters });
  }

  getDoctorProfile(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/doctors-profile`, { params: filters });
  }

  getHospitalUserProfile(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/hospital-user-profile`, { params: filters });
  }

  getPublicDoctorlist(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/public-doctors`);
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

  getHospitalSpecialtyMapping(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hospital-specialty-mapping`);
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

  getHospitalWiseSpecialityList(hospitalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-hospital-specialty-by-hospital/${hospitalId}`);
  }
  
  updateHospitalSpecialties(hospitalId: number, specialtyIds: number[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-hospital-specialty/${hospitalId}`, { specialties: specialtyIds });
  }
  
}