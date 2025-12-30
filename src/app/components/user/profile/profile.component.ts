import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// import { SidebarComponent } from '../sidebar/sidebar.component';
import { FormBuilder, ReactiveFormsModule,  FormGroup, Validators } from '@angular/forms';
import { User } from '../../../models/user.model';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterModule, BreadcrumbComponent ],
  templateUrl: './profile.component.html'
})

export class ProfileComponent implements OnInit {

  profileForm!: FormGroup;
  user: User | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }

    this.profileForm = this.fb.group({
      name: [this.user?.name, Validators.required],
      email: [{ value: this.user?.email, disabled: true }, [Validators.required, Validators.email]],
      phone: [this.user?.phone],
      role: [{ value: this.user?.role, disabled: true }]
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    const updatedUser = {
      ...this.user,
      ...this.profileForm.getRawValue() // includes disabled fields
    };

    // Save locally for now
    localStorage.setItem('user', JSON.stringify(updatedUser));

    alert('Profile updated successfully!');
  }
}
