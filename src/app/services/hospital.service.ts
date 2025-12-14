import { Injectable } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Hospital } from '../models/hospital.model';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private apiUrl = 'http://localhost:3000/api/hospitals'; // Replace with your API

  // Mock data for development
  private mockHospitalsExtended: Hospital[] = [
    {
      id: 1,
      name: "City General Hospital",
      location: "Downtown, Mumbai",
      rating: 4.5,
      specialties: ["Cardiology", "Neurology", "Orthopedics"],
      discount: "20%",
      address: "123 Main Street, Downtown, Mumbai - 400001",
      phone: "+91 98765 43210",
      email: "contact@citygeneral.com",
      image: "https://via.placeholder.com/800x400",
      description: "A leading multi-specialty hospital with state-of-the-art facilities and experienced medical professionals.",
      facilities: ["24/7 Emergency", "ICU", "Blood Bank", "Pharmacy", "Ambulance", "Diagnostic Center"],
      beds: 250,
      established: 1985,
      accreditations: ["NABH", "JCI", "ISO 9001"],
      operatingHours: "24/7",
      emergencyAvailable: true
    },
    {
      id: 2,
      name: "MediCare Plus",
      location: "Andheri, Mumbai",
      rating: 4.7,
      specialties: ["Orthopedics", "Pediatrics", "General Medicine"],
      discount: "30%",
      address: "456 West Road, Andheri, Mumbai - 400053",
      phone: "+91 98765 43211",
      email: "info@medicareplus.com",
      image: "https://via.placeholder.com/800x400",
      description: "Premier healthcare facility specializing in orthopedics and pediatric care with modern infrastructure.",
      facilities: ["24/7 Emergency", "Operation Theater", "X-Ray", "Ultrasound", "Pathology Lab", "Cafeteria"],
      beds: 180,
      established: 1998,
      accreditations: ["NABH", "ISO 9001"],
      operatingHours: "24/7",
      emergencyAvailable: true
    },
    {
      id: 3,
      name: "HealthFirst Clinic",
      location: "Bandra, Mumbai",
      rating: 4.3,
      specialties: ["General Medicine", "Dermatology", "ENT"],
      discount: "25%",
      address: "789 Linking Road, Bandra, Mumbai - 400050",
      phone: "+91 98765 43212",
      email: "support@healthfirst.com",
      image: "https://via.placeholder.com/800x400",
      description: "Comprehensive outpatient care center focused on preventive health and wellness programs.",
      facilities: ["OPD", "Diagnostic Lab", "Pharmacy", "Consultation Rooms"],
      beds: 50,
      established: 2005,
      accreditations: ["ISO 9001"],
      operatingHours: "8:00 AM - 10:00 PM",
      emergencyAvailable: false
    },
    {
      id: 4,
      name: "Apollo Heart Center",
      location: "Powai, Mumbai",
      rating: 4.9,
      specialties: ["Cardiology", "Cardiac Surgery", "Interventional Cardiology"],
      discount: "15%",
      address: "321 Lake View, Powai, Mumbai - 400076",
      phone: "+91 98765 43213",
      email: "info@apolloheart.com",
      image: "https://via.placeholder.com/800x400",
      description: "Specialized cardiac care center with world-class cardiologists and advanced cardiac technology.",
      facilities: ["24/7 Emergency", "Cath Lab", "ICU", "CCU", "Cardiac Rehabilitation"],
      beds: 120,
      established: 2010,
      accreditations: ["NABH", "JCI", "ISO 9001"],
      operatingHours: "24/7",
      emergencyAvailable: true
    },
    {
      id: 5,
      name: "Neuro Care Hospital",
      location: "Borivali, Mumbai",
      rating: 4.6,
      specialties: ["Neurology", "Neurosurgery", "Psychiatry"],
      discount: "20%",
      address: "654 National Park Road, Borivali, Mumbai - 400066",
      phone: "+91 98765 43214",
      email: "contact@neurocare.com",
      image: "https://via.placeholder.com/800x400",
      description: "Leading neurological care facility with expert neurologists and advanced neuro-imaging.",
      facilities: ["24/7 Emergency", "MRI", "CT Scan", "EEG Lab", "Neuro ICU"],
      beds: 100,
      established: 2012,
      accreditations: ["NABH", "ISO 9001"],
      operatingHours: "24/7",
      emergencyAvailable: true
    },
    {
      id: 6,
      name: "Women & Child Hospital",
      location: "Chembur, Mumbai",
      rating: 4.4,
      specialties: ["Gynecology", "Pediatrics", "Obstetrics", "Neonatology"],
      discount: "25%",
      address: "987 Eastern Express Highway, Chembur, Mumbai - 400071",
      phone: "+91 98765 43215",
      email: "info@womenandchild.com",
      image: "https://via.placeholder.com/800x400",
      description: "Dedicated to women's health and pediatric care with compassionate and expert medical team.",
      facilities: ["24/7 Emergency", "NICU", "Labor Room", "Maternity Ward", "Pediatric ICU"],
      beds: 150,
      established: 2008,
      accreditations: ["NABH", "ISO 9001"],
      operatingHours: "24/7",
      emergencyAvailable: true
    }
  ];

  constructor(private http: HttpClient) { }
  
  // Update the getHospitals method to return extended data
  // getHospitals(): Observable<Hospital[]> {
  //   return this.http.get<Hospital[]>(this.apiUrl);
  // }
  getHospitals(): Observable<{ success: boolean, count: number, data: Hospital[] }> {
    return this.http.get<{ success: boolean, count: number, data: Hospital[] }>(this.apiUrl);
  }


  getHospitalById(id: number): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/${id}`);
  }

  searchHospitals(query: string): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.apiUrl}?search=${query}`);
  }

}

