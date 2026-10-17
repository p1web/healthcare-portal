import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { BankAccountDetails } from '../shared/components/bank-account-form/bank-account-form.component';

export interface BankAccountResponse {
  success: boolean;
  data: BankAccountDetails | null;
  locked: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BankAccountService {
  private readonly apiUrl = `${environment.apiUrl}/bank-account-details`;

  constructor(private http: HttpClient) {}

  getMine(): Observable<BankAccountResponse> {
    return this.http.get<BankAccountResponse>(this.apiUrl);
  }

  saveMine(details: BankAccountDetails): Observable<BankAccountResponse> {
    return this.http.put<BankAccountResponse>(this.apiUrl, details);
  }
}