import { Component, EventEmitter, Output } from '@angular/core';
import { LayoutService } from '../../../core/layout.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})

export class HeaderComponent {
  
 constructor(private layoutService: LayoutService, private authService: AuthService, private router: Router) {}

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  logout(): void {
    this.authService.logout();     // clears storage & subject
    this.router.navigate(['/login']); // redirect to login
  }
}
