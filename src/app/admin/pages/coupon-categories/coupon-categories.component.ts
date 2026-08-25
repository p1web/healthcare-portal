import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-coupon-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, PaginationComponent],
  templateUrl: './coupon-categories.component.html',
  styleUrl: './coupon-categories.component.css'
})
export class CouponCategoriesComponent implements OnInit {
  categoryForm!: FormGroup;
  editCategoryForm!: FormGroup;
  categoriesList: any[] = [];
  editingId: number | null = null;
  isSubmitting = false;
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  showDeleted = false;

  currentPage = 1;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  constructor(private fb: FormBuilder, private adminService: AdminService) { }

  ngOnInit(): void {
    this.initForms();
    this.loadCategories();
  }

  initForms(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      icon: ['']
    });
    this.editCategoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      icon: [''],
      isActive: [true]
    });
  }

  loadCategories(): void {
    const filters: any = {};
    if (this.statusFilter !== 'all') filters.status = this.statusFilter;
    if (this.showDeleted) filters.includeDeleted = 'true';
    this.adminService.getCouponCategories(filters).subscribe({
      next: (res) => { this.categoriesList = res?.data || []; this.currentPage = 1; },
      error: (err) => console.error('Error loading coupon categories:', err)
    });
  }

  get pagedCategories(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.categoriesList.slice(start, start + this.pageSize);
  }

  onFilterChange(): void { this.loadCategories(); }

  openAddModal(): void {
    this.editingId = null;
    this.categoryForm.reset();
  }

  openEditModal(cat: any): void {
    this.editingId = cat.id;
    this.editCategoryForm.patchValue({
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      isActive: cat.isActive
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;
    this.isSubmitting = true;
    this.adminService.addCouponCategory(this.categoryForm.value).subscribe({
      next: () => this.afterSave('Coupon category added successfully'),
      error: (err) => this.handleError(err)
    });
  }

  updateCategory(): void {
    if (this.editCategoryForm.invalid || this.editingId === null) return;
    this.isSubmitting = true;
    this.adminService.updateCouponCategory(this.editingId, this.editCategoryForm.value).subscribe({
      next: () => this.afterSave('Coupon category updated successfully'),
      error: (err) => this.handleError(err)
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Delete this category? Linked coupons will also be soft-deleted.')) return;
    this.adminService.deleteCouponCategory(id).subscribe({
      next: () => { alert('Category deleted'); this.loadCategories(); },
      error: (err) => this.handleError(err)
    });
  }

  restoreCategory(id: number): void {
    this.adminService.restoreCouponCategory(id).subscribe({
      next: () => { alert('Category restored'); this.loadCategories(); },
      error: (err) => this.handleError(err)
    });
  }

  private afterSave(message: string): void {
    this.isSubmitting = false;
    alert(message);
    this.categoryForm.reset();
    this.editCategoryForm.reset();
    this.editingId = null;
    this.loadCategories();
  }

  private handleError(err: any): void {
    this.isSubmitting = false;
    console.error(err);
    alert(err?.error?.message || 'Something went wrong');
  }
}
