import { Component, EventEmitter, Output } from '@angular/core';
import { LayoutService } from '../../../core/layout.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent {

 constructor(private layoutService: LayoutService, private authService: AuthService, private router: Router) {}

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  getInitials(name?: string | null): string {
    return (name || 'Admin')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('');
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();     // clears storage & subject
    this.router.navigate(['/login']); // redirect to login
  }
}
