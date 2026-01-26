import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class UserService {
  private apiUrl = 'http://localhost:3000/api/users'; // Replace with your API

  constructor(private http: HttpClient) {}

  getUsers(filters: any = {}): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`, { params: filters });
  }

}