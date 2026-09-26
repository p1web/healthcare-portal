import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() visibleWindow = 2;
  @Input() showPageSize = true;
  @Input() showSummary = true;

  @Output() currentPageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalItems'] || changes['pageSize']) {
      const clamped = Math.min(Math.max(1, this.currentPage), this.totalPages);
      if (clamped !== this.currentPage) {
        this.currentPage = clamped;
        this.currentPageChange.emit(this.currentPage);
      }
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get rangeStart(): number {
    if (!this.totalItems) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const from = Math.max(1, current - this.visibleWindow);
    const to = Math.min(total, current + this.visibleWindow);
    const pages: number[] = [];
    for (let p = from; p <= to; p++) pages.push(p);
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.currentPageChange.emit(page);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.pageSizeChange.emit(this.pageSize);
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.currentPageChange.emit(1);
    }
  }
}
