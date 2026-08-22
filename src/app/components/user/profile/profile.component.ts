import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [],
  template: `<div class="d-flex justify-content-center align-items-center py-5">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>`
})
export class ProfileComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const role = this.authService.getUserRole();

    if (role === 'patient') {
      this.router.navigate(['/profile/patient']);
    } else if (role === 'doctor') {
      this.router.navigate(['/profile/doctor']);
    } else if (role === 'hospital') {
      this.router.navigate(['/profile/hospital']);
    }
  }
}
