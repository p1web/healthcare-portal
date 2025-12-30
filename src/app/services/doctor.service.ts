import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:3000/api/doctors'; // Replace with your API

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.apiUrl);
    // return of(this.mockDoctors); // Use mock data for now
  }

  getDoctorById(id: number): Observable<Doctor | undefined> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
    // return of(this.mockDoctors.find(d => d.id === id));
  }

  searchDoctors(query: string, type: string = 'all'): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/search`, {
      params: {
        q: query,
        type: type
      }
    });
  }

}