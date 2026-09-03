import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Specialty {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})

export class SpecialtyService {
  private apiUrl = `${environment.apiUrl}/specialties`;

  constructor(private http: HttpClient) {}

  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(this.apiUrl);
  }
}
