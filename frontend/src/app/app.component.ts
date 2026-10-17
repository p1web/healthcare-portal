import { Component } from '@angular/core';
import { RouterOutlet, RouterModule  } from '@angular/router';
import { ProfileSaveConfirmationDialogComponent } from './shared/components/profile-save-confirmation-dialog/profile-save-confirmation-dialog.component';
// import { HeaderComponent } from './components/header/header.component';
// import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // imports: [RouterOutlet, RouterModule, HeaderComponent, FooterComponent],
  imports: [RouterOutlet, ProfileSaveConfirmationDialogComponent],
  template: `<router-outlet></router-outlet><app-profile-save-confirmation-dialog></app-profile-save-confirmation-dialog>`,
  // template: `
  //   <div class="d-flex flex-column min-vh-100">
  //     <app-header></app-header>
  //     <main class="flex-grow-1">
  //       <router-outlet></router-outlet>
  //     </main>
  //     <app-footer></app-footer>
  //   </div>
  // `
})


export class AppComponent {
  title = 'healthcare-portal';
}