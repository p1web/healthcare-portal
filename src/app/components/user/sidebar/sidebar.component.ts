import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  currentUser$;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  get isPatient(): boolean {
    return this.authService.getUserRole() === 'patient';
  }

  get isDoctor(): boolean {
    return this.authService.getUserRole() === 'doctor';
  }

  get isHospital(): boolean {
    return this.authService.getUserRole() === 'hospital';
  }

  get roleLabel(): string {
    switch (this.authService.getUserRole()) {
      case 'patient':  return 'Patient Account';
      case 'doctor':   return 'Doctor Account';
      case 'hospital': return 'Hospital Account';
      case 'admin':    return 'Admin Account';
      default:         return 'My Account';
    }
  }

  get dashboardLink(): string {
    switch (this.authService.getUserRole()) {
      case 'doctor':   return '/doctor-analytics';
      case 'patient':  return '/patient-dashboard';
      case 'hospital': return '/hospital-dashboard';
      case 'admin':    return '/admin';
      default:         return '/profile';
    }
  }

  isVerified(user: any): boolean {
    if (!user) return false;
    return user.doctorProfile?.verificationStatus === 'approved'
        || user.hospitalProfile?.verificationStatus === 'approved';
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.replace(/^dr\.?\s*/i, '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase() || '?';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
