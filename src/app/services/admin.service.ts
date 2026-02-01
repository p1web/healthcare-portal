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

  getPublicDoctorlist(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/public-doctors`);
  }

  getSpecializations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/specializations`);
  }

  getHospitals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/hospitals`);
  }

}