import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Needed for routerLink directives
import { AuthService } from '../../../services/auth.service';

@Component({
  standalone: true,               // ✅ Make this standalone
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule], // ✅ Import CommonModule + RouterModule
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // ✅ fix typo (was styleUrl)
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get isPatient(): boolean {
    return this.authService.getUserRole() === 'patient';
  }

  get isDoctor(): boolean {
    return this.authService.getUserRole() === 'doctor';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
