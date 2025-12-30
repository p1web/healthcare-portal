import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  goToProfile():void{

  }

  goToChangePassword():void{

  }

  logout(): void {
    this.authService.logout();     // clears storage & subject
    this.router.navigate(['/login']); // redirect to login
  }
}
