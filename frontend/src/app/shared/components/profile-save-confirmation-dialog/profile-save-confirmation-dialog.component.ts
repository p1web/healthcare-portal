import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfileSaveConfirmationAction, ProfileSaveConfirmationService } from '../../profile-save-confirmation';

@Component({
  selector: 'app-profile-save-confirmation-dialog',
  standalone: true,
  templateUrl: './profile-save-confirmation-dialog.component.html',
  styleUrl: './profile-save-confirmation-dialog.component.css'
})
export class ProfileSaveConfirmationDialogComponent implements OnInit, OnDestroy {
  @ViewChild('dialog') private dialog!: ElementRef<HTMLDialogElement>;

  isReviewSubmission = false;
  private requestSubscription?: Subscription;

  constructor(private profileSaveConfirmation: ProfileSaveConfirmationService) { }

  ngOnInit(): void {
    this.requestSubscription = this.profileSaveConfirmation.requests.subscribe((action: ProfileSaveConfirmationAction) => {
      this.isReviewSubmission = action === 'review';
      this.dialog.nativeElement.showModal();
    });
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    this.profileSaveConfirmation.resolve(false);
  }

  cancel(event: Event): void {
    event.preventDefault();
    this.dialog.nativeElement.close('cancel');
  }

  closeWithResult(result: 'cancel' | 'confirm'): void {
    this.dialog.nativeElement.close(result);
  }

  onClosed(): void {
    this.profileSaveConfirmation.resolve(this.dialog.nativeElement.returnValue === 'confirm');
  }
}