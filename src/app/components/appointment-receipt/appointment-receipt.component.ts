import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentReceipt } from '../../models/appointment.model';

@Component({
  standalone: true,
  selector: 'app-appointment-receipt',
  imports: [CommonModule, RouterLink],
  templateUrl: './appointment-receipt.component.html',
  styleUrl: './appointment-receipt.component.css'
})
export class AppointmentReceiptComponent implements OnInit {
  @ViewChild('receiptBody') receiptBody!: ElementRef<HTMLElement>;
  appointmentId!: number;
  receipt: AppointmentReceipt | null = null;
  isLoading = false;
  isDownloading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.appointmentService.getReceipt(this.appointmentId).subscribe({
      next: (res) => {
        this.receipt = res.data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load receipt';
        this.isLoading = false;
      }
    });
  }

  statusBadgeClass(status?: string): string {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'failed': return 'bg-danger';
      case 'refunded': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  cashbackBadgeClass(status?: string): string {
    switch (status) {
      case 'issued': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'forfeited': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  cashbackLabel(status?: string): string {
    switch (status) {
      case 'issued': return 'Credited';
      case 'pending': return 'Pending';
      case 'forfeited': return 'Forfeited';
      default: return 'None';
    }
  }

  async downloadPdf(): Promise<void> {
    if (!this.receiptBody || this.isDownloading) return;
    this.isDownloading = true;
    try {
      const html2canvasMod = await import('html2canvas');
      const jsPdfMod = await import('jspdf');
      const html2canvas = html2canvasMod.default;
      const { jsPDF } = jsPdfMod;
      const canvas = await html2canvas(this.receiptBody.nativeElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`receipt-${this.receipt?.bookingNumber || this.appointmentId}.pdf`);
    } catch (err) {
      console.error('PDF download failed', err);
      this.error = 'Could not generate PDF. Try again or print the page.';
    } finally {
      this.isDownloading = false;
    }
  }

  print(): void {
    window.print();
  }
}
