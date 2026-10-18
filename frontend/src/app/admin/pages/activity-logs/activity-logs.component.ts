import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, ActivityLogEntry } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.css'
})
export class ActivityLogsComponent implements OnInit {
  logs: ActivityLogEntry[] = [];
  selectedLog: ActivityLogEntry | null = null;
  search = '';
  category = '';
  result = '';
  from = '';
  to = '';
  currentPage = 1;
  pageSize = 25;
  total = 0;
  isLoading = true;
  error = '';

  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly results = [
    { value: '', label: 'All outcomes' },
    { value: 'success', label: 'Success' },
    { value: 'failure', label: 'Failure' },
    { value: 'aborted', label: 'Aborted' }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.error = '';
    this.adminService.getActivityLogs({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.search.trim() || undefined,
      category: this.category.trim() || undefined,
      result: this.result || undefined,
      from: this.from || undefined,
      to: this.to || undefined
    }).subscribe({
      next: response => {
        this.logs = response.data || [];
        this.total = response.pagination?.total || 0;
        this.isLoading = false;
      },
      error: error => {
        this.error = error?.error?.message || 'Could not load activity logs.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  resetFilters(): void {
    this.search = '';
    this.category = '';
    this.result = '';
    this.from = '';
    this.to = '';
    this.currentPage = 1;
    this.loadLogs();
  }

  setPage(page: number): void {
    if (this.currentPage === page) return;
    this.currentPage = page;
    this.loadLogs();
  }

  setPageSize(size: number): void {
    if (this.pageSize === size && this.currentPage === 1) return;
    this.pageSize = size;
    this.currentPage = 1;
    this.loadLogs();
  }

  openDetails(log: ActivityLogEntry): void {
    this.selectedLog = log;
  }

  closeDetails(): void {
    this.selectedLog = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDetails();
  }

  formatJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
  }

  trackByLogId(_index: number, log: ActivityLogEntry): number {
    return log.id;
  }
}
