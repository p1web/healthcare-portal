import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = 'http://localhost:3000/api/doctors'; // Replace with your API

  // Mock data for development
  private mockDoctors: Doctor[] = [
    {
      id: 1,
      name: "Dr. Rajesh Kumar",
      specialization: "Cardiologist",
      hospital: "City General Hospital",
      experience: "15 years",
      rating: 4.8,
      fee: "₹1000",
      available: "Mon-Fri",
      email: "rajesh.kumar@citygeneral.com",
      phone: "+91 98765 00001"
    },
    {
      id: 2,
      name: "Dr. Priya Sharma",
      specialization: "Pediatrician",
      hospital: "MediCare Plus",
      experience: "10 years",
      rating: 4.6,
      fee: "₹800",
      available: "Tue-Sat",
      email: "priya.sharma@medicareplus.com",
      phone: "+91 98765 00002"
    },
    {
      id: 3,
      name: "Dr. Amit Patel",
      specialization: "Orthopedic",
      hospital: "MediCare Plus",
      experience: "12 years",
      rating: 4.7,
      fee: "₹1200",
      available: "Mon-Sat",
      email: "amit.patel@medicareplus.com",
      phone: "+91 98765 00003"
    },
    {
      id: 4,
      name: "Dr. Sneha Desai",
      specialization: "Dermatologist",
      hospital: "HealthFirst Clinic",
      experience: "8 years",
      rating: 4.5,
      fee: "₹900",
      available: "Wed-Sun",
      email: "sneha.desai@healthfirst.com",
      phone: "+91 98765 00004"
    }
  ];

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
    const filtered = this.mockDoctors.filter(d => {
      const queryLower = query.toLowerCase();
      switch(type) {
        case 'doctor':
          return d.name.toLowerCase().includes(queryLower);
        case 'specialization':
          return d.specialization.toLowerCase().includes(queryLower);
        case 'hospital':
          return d.hospital.toLowerCase().includes(queryLower);
        default:
          return d.name.toLowerCase().includes(queryLower) ||
                 d.specialization.toLowerCase().includes(queryLower) ||
                 d.hospital.toLowerCase().includes(queryLower);
      }
    });
    return of(filtered);
  }
}