import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Specialty {
  name: string;
}

@Injectable({
  providedIn: 'root'
})

export class SpecialtyService {
  private apiUrl = 'http://localhost:3000/api/specialties';

  constructor(private http: HttpClient) {}

  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(this.apiUrl);
  }
}
