import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { User } from '../../../models/user.model';
import { DoctorProfileModalComponent } from '../../shared/doctor-profile-modal/doctor-profile-modal.component';
import { HospitalProfileModalComponent } from '../../shared/hospital-profile-modal/hospital-profile-modal.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DoctorProfileModalComponent, HospitalProfileModalComponent, PaginationComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})

export class UsersComponent implements OnInit{

  userList: User[] = [];
  searchTerm: string = '';
  statusFilter: string = 'ALL';
  roleFilter: string = 'patient';
  pageTitle: string = 'Patients';
  selectedUser: User | null = null;
  isLoading: boolean = false;
  loadError: string = '';
  selectedAccountStatus: 'active' | 'blocked' = 'active';
  isUpdatingAccountStatus: boolean = false;
  accountStatusMessage: string = '';
  accountStatusError: string = '';

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'BLOCKED', label: 'Blocked' }
  ];

  roleOptions = [
    { value: 'patient', path: 'patients', label: 'Patients', icon: 'bi-person' },
    { value: 'doctor', path: 'doctors', label: 'Doctors', icon: 'bi-person-badge' },
    { value: 'hospital', path: 'hospitals', label: 'Hospitals', icon: 'bi-hospital' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private AdminService: AdminService,
  ) {}


  ngOnInit(): void {
    combineLatest([this.route.data, this.route.queryParams]).subscribe(([data, params]) => {
      this.statusFilter = params['status'] || 'ALL';
      this.roleFilter = data['role'];

      const statusLabel = this.statusOptions.find(option => option.value === this.statusFilter)?.label || 'All Statuses';
      const roleLabel = this.roleOptions.find(option => option.value === this.roleFilter)?.label || 'Users';
      this.pageTitle = this.statusFilter === 'ALL' ? roleLabel : `${statusLabel} ${roleLabel}`;

      this.loadUsers(this.currentFilters);
    });
  }

  setStatusFilter(status: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: status === 'ALL' ? {} : { status }
    });
  }

  private get currentFilters(): { status: string; role: string } {
    return { status: this.statusFilter, role: this.roleFilter };
  }

  retryLoad(): void {
    this.loadUsers(this.currentFilters);
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

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.userList;

    return this.userList.filter((user) => [
      user.name,
      user.email,
      user.phone,
      user.role,
      user.address,
      user.city,
      user.state,
      this.getVerificationStatus(user)
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }

  get pagedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  getAccountStatus(user: User): string {
    return user.isActive && !user.isBlocked ? 'Active' : 'Blocked';
  }

  getAccountStatusValue(user: User): 'active' | 'blocked' {
    return user.isActive && !user.isBlocked ? 'active' : 'blocked';
  }

  getAccountBadgeClass(user: User): string {
    return user.isActive && !user.isBlocked ? 'bg-success' : 'bg-danger';
  }

  getAccountStatusClass(user: User): string {
    return user.isActive && !user.isBlocked
      ? 'status-indicator status-active'
      : 'status-indicator status-blocked';
  }

  trackByUserId(_index: number, user: User): number {
    return user.id;
  }

  openUserModal(user: User): void {
    this.selectedUser = user;
    this.selectedAccountStatus = this.getAccountStatusValue(user);
    this.accountStatusError = '';
  }

  closeUserModal(): void {
    this.selectedUser = null;
    this.isUpdatingAccountStatus = false;
    this.accountStatusError = '';
  }

  refreshSelectedDoctor(): void {
    this.loadUsers(this.currentFilters);
  }

  refreshSelectedHospital(): void {
    this.loadUsers(this.currentFilters);
  }

  updateAccountStatus(user: User): void {
    if (this.selectedAccountStatus === this.getAccountStatusValue(user)) return;

    this.isUpdatingAccountStatus = true;
    this.accountStatusError = '';
    this.accountStatusMessage = '';

    this.AdminService.updateUserAccountStatus(user.id, this.selectedAccountStatus).subscribe({
      next: (response) => {
        this.isUpdatingAccountStatus = false;
        this.accountStatusMessage = response.message || 'Account status updated successfully.';
        this.closeUserModal();
        this.loadUsers(this.currentFilters);
      },
      error: (err) => {
        this.isUpdatingAccountStatus = false;
        this.accountStatusError = err.error?.message || 'Failed to update account status.';
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
    return initials.toUpperCase();
  }

  getVerificationStatus(user: User): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Pending for Review',
      approved: 'Approved',
      rejected: 'Rejected',
      changes_requested: 'Returned'
    };

    if (user.role === 'doctor') {
      return labels[user.doctorProfile?.verificationStatus || 'draft'];
    }
    if (user.role === 'hospital') {
      return labels[user.hospitalProfile?.verificationStatus || 'draft'];
    }
    return 'N/A';
  }

  getVerificationBadgeClass(user: User): string {
    const status = user.role === 'doctor'
      ? user.doctorProfile?.verificationStatus
      : user.hospitalProfile?.verificationStatus;

    switch (status) {
      case 'approved':
        return 'badge bg-success';
      case 'under_review':
        return 'badge bg-info text-dark';
      case 'changes_requested':
        return 'badge bg-warning text-dark';
      case 'rejected':
        return 'badge bg-danger';
      case 'submitted':
        return 'badge bg-primary';
      default:
        return 'badge bg-secondary';
    }
  }

  loadUsers(filters: any): void {
    this.isLoading = true;
    this.loadError = '';

    this.AdminService.getUsers(filters).subscribe({
      next: (response) => {
        this.userList = response;
        this.isLoading = false;

        if (this.selectedUser) {
          this.selectedUser = response.find(user => user.id === this.selectedUser?.id) || null;
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err.error?.message || 'Failed to load users. Please try again.';
        console.error('Failed to load users', err);
      }
    });
  }

}
