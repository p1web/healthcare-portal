import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: number;
  hospitalProfileId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  doctorCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentPayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly apiBase = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  listMine(): Observable<{ success: boolean; data: Department[] }> {
    return this.http.get<{ success: boolean; data: Department[] }>(`${this.apiBase}/hospital/departments`);
  }

  create(payload: DepartmentPayload): Observable<{ success: boolean; data: Department }> {
    return this.http.post<{ success: boolean; data: Department }>(`${this.apiBase}/hospital/departments`, payload);
  }

  update(id: number, payload: DepartmentPayload): Observable<{ success: boolean; data: Department }> {
    return this.http.put<{ success: boolean; data: Department }>(`${this.apiBase}/hospital/departments/${id}`, payload);
  }

  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiBase}/hospital/departments/${id}`);
  }
}
