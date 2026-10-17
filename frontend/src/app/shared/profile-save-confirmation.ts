import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ProfileSaveConfirmationAction = 'save' | 'review';

@Injectable({ providedIn: 'root' })
export class ProfileSaveConfirmationService {
  private readonly requestsSubject = new Subject<ProfileSaveConfirmationAction>();
  private pendingResolver: ((confirmed: boolean) => void) | null = null;

  readonly requests = this.requestsSubject.asObservable();

  confirm(action: ProfileSaveConfirmationAction = 'save'): Promise<boolean> {
    if (this.pendingResolver) return Promise.resolve(false);

    return new Promise(resolve => {
      this.pendingResolver = resolve;
      this.requestsSubject.next(action);
    });
  }

  resolve(confirmed: boolean): void {
    const resolve = this.pendingResolver;
    this.pendingResolver = null;
    resolve?.(confirmed);
  }
}