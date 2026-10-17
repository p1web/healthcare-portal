import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileSaveConfirmationService } from '../../profile-save-confirmation';

export interface BankAccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber?: string;
  ifscCode: string;
  branchName?: string;
  accountType?: 'savings' | 'current';
  upiId?: string;
}

@Component({
  standalone: true,
  selector: 'app-bank-account-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bank-account-form.component.html',
  styleUrl: './bank-account-form.component.css'
})
export class BankAccountFormComponent implements OnInit, OnChanges {
  @Input() initialData?: Partial<BankAccountDetails> | null;
  @Input() isReadOnly = false;
  @Input() isSaving = false;
  @Input() showHeader = true;
  @Input() title = 'Bank Account Details';
  @Input() subtitle = 'Provide your verified bank details for payout settlements and consultation disbursements.';

  @Output() formSubmit = new EventEmitter<BankAccountDetails>();
  @Output() formChange = new EventEmitter<BankAccountDetails>();

  bankForm!: FormGroup;
  readonly popularBanks = [
    'State Bank of India',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank',
    'Bank of Baroda',
    'Canara Bank',
    'Union Bank of India',
    'IndusInd Bank'
  ];

  constructor(
    private fb: FormBuilder,
    private profileSaveConfirmation: ProfileSaveConfirmationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.syncInputState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.bankForm) return;
    if (changes['initialData']) {
      this.bankForm.patchValue(this.initialData || {}, { emitEvent: false });
    }
    if (changes['isReadOnly']) this.syncReadOnlyState();
  }

  private syncInputState(): void {
    this.bankForm.patchValue(this.initialData || {}, { emitEvent: false });
    this.syncReadOnlyState();
  }

  private syncReadOnlyState(): void {
    if (this.isReadOnly) this.bankForm.disable({ emitEvent: false });
    else this.bankForm.enable({ emitEvent: false });
  }

  private initForm(): void {
    this.bankForm = this.fb.group(
      {
        accountHolderName: ['', [Validators.required, Validators.minLength(3)]],
        bankName: ['', Validators.required],
        accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,18}$/)]],
        confirmAccountNumber: ['', Validators.required],
        ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
        branchName: [''],
        accountType: ['current', Validators.required],
        upiId: ['', Validators.pattern(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/)]
      },
      { validators: this.accountMatchValidator }
    );

    this.bankForm.valueChanges.subscribe(() => {
      this.formChange.emit(this.bankForm.getRawValue());
    });
  }

  private accountMatchValidator(group: FormGroup) {
    const acc = group.get('accountNumber')?.value;
    const confirm = group.get('confirmAccountNumber')?.value;
    if (acc && confirm && acc !== confirm) {
      group.get('confirmAccountNumber')?.setErrors({ mismatch: true });
    } else if (group.get('confirmAccountNumber')?.hasError('mismatch')) {
      group.get('confirmAccountNumber')?.setErrors(null);
    }
    return null;
  }

  onIfscInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = (input.value || '').toUpperCase();
    input.value = upper;
    this.bankForm.get('ifscCode')?.setValue(upper, { emitEvent: false });
  }

  async onSubmit(): Promise<void> {
    if (this.isReadOnly || this.isSaving) return;
    if (this.bankForm.invalid) {
      this.bankForm.markAllAsTouched();
      return;
    }
    if (!await this.profileSaveConfirmation.confirm()) return;
    this.formSubmit.emit(this.bankForm.getRawValue());
  }

  resetForm(): void {
    this.bankForm.reset({
      accountType: 'current'
    });
  }
}
