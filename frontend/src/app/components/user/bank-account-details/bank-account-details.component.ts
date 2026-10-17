import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { BankAccountService } from '../../../services/bank-account.service';
import { BankAccountFormComponent, BankAccountDetails } from '../../../shared/components/bank-account-form/bank-account-form.component';

@Component({
  standalone: true,
  selector: 'app-bank-account-details',
  imports: [CommonModule, RouterModule, BankAccountFormComponent],
  templateUrl: './bank-account-details.component.html',
  styleUrl: './bank-account-details.component.css'
})
export class BankAccountDetailsComponent implements OnInit {
  userRole: string = '';
  accountName: string = '';
  initialData: Partial<BankAccountDetails> = {};
  loading = true;
  saving = false;
  isLocked = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private bankAccountService: BankAccountService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || '';
    const user = this.authService.getCurrentUser();
    this.accountName = user?.name || '';
    this.initialData = { accountHolderName: this.accountName };

    this.bankAccountService.getMine().subscribe({
      next: (response) => {
        this.initialData = response.data || { accountHolderName: this.accountName };
        this.isLocked = response.locked;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to load bank account details.';
      }
    });
  }

  get isHospital(): boolean {
    return this.userRole === 'hospital';
  }

  get isDoctor(): boolean {
    return this.userRole === 'doctor';
  }

  get roleBadgeLabel(): string {
    return this.isHospital ? 'Hospital Payouts' : 'Doctor Payouts';
  }

  onSave(details: BankAccountDetails): void {
    this.saving = true;
    this.error = '';
    this.success = '';

    this.bankAccountService.saveMine(details).subscribe({
      next: (response) => {
        this.saving = false;
        this.initialData = response.data || {};
        this.isLocked = response.locked;
        this.success = response.message || 'Bank account details saved successfully.';
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save bank account details.';
        if (err.status === 409) this.isLocked = true;
      }
    });
  }
}
