import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is logged in on service initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  // login(credentials: LoginRequest): Observable<LoginResponse> {
  //   return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  // }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success) {
          this.setCurrentUser(res.data.user, res.data.token);
        }
      })
    );
  }


  logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
  }

  getCurrentUserFromApi() {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }


  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: User | null, token?: string): void {
    this.currentUserSubject.next(user);
    
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      if (token || token !== undefined) {
        localStorage.setItem('token', token);
      }

    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    }
  }



  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRole(): 'patient' | 'doctor' | 'hospital' | 'admin' | null {
    const user = this.currentUserSubject.value;
    return user ? user.role : null;
  }

}