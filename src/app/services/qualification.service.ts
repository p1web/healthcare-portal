import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Qualification {
  id: number;
  name: string;
  description?: string | null;
}

@Injectable({ providedIn: 'root' })
export class QualificationService {
  private apiUrl = 'http://localhost:3000/api/qualifications';

  constructor(private http: HttpClient) {}

  getQualifications(): Observable<Qualification[]> {
    return this.http.get<Qualification[]>(this.apiUrl);
  }
}
