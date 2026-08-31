import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentReceipt } from '../../models/appointment.model';

@Component({
  standalone: true,
  selector: 'app-appointment-payment',
  imports: [CommonModule, RouterLink],
  templateUrl: './appointment-payment.component.html',
  styleUrl: './appointment-payment.component.css'
})
export class AppointmentPaymentComponent implements OnInit {
  appointmentId!: number;
  receipt: AppointmentReceipt | null = null;
  isLoading = false;
  isPaying = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
        if (this.receipt.paymentStatus === 'paid') {
          this.router.navigate(['/appointments', this.appointmentId, 'receipt']);
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load appointment';
        this.isLoading = false;
      }
    });
  }

  pay(): void {
    if (this.isPaying) return;
    this.isPaying = true;
    this.error = '';
    this.appointmentService.payAppointment(this.appointmentId).subscribe({
      next: () => {
        this.isPaying = false;
        this.router.navigate(['/appointments', this.appointmentId, 'receipt']);
      },
      error: (err) => {
        this.isPaying = false;
        this.error = err?.error?.message || 'Payment failed. Please try again.';
      }
    });
  }
}
