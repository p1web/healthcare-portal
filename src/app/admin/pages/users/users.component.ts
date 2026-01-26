import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})

export class UsersComponent implements OnInit{

  userList: User[] = [];
  statusFilter: string | null = null;
  pageTitle: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private UserService: UserService,
  ) {}


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
    this.statusFilter = params['status'] || null;
    this.pageTitle = this.statusFilter;
    this.loadUsers(params);
  });
  }

  getRoleClass(role: 'patient' | 'doctor' | 'hospital' | 'admin'): string {
    switch (role) {
      case 'admin':
        return 'badge bg-dark';

      case 'doctor':
        return 'badge bg-primary';

      case 'hospital':
        return 'badge bg-success';

      case 'patient':
        return 'badge bg-info';

      default:
        return 'badge bg-secondary';
    }
  }


  loadUsers(filters: any): void {
    this.UserService.getUsers(filters).subscribe({
      next: (response) => {
        this.userList = response;
        // console.log('Users loaded:', this.userList);
      },
      error: (err) => {
        console.error('Failed to load users', err);
      }
    });
  }

  showStatusColumns(): boolean {
      return this.statusFilter === 'ALL';
  }

}
