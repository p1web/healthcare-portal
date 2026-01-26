import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DoctorDetailComponent } from './components/doctor-detail/doctor-detail.component';
import { HospitalsComponent } from './components/hospitals/hospitals.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { CouponsComponent } from './components/coupons/coupons.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LayoutComponent  } from './components/user/layout/layout.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { ChangePasswordComponent } from './components/user/change-password/change-password.component';
import { ResetPasswordComponent } from './components/user/reset-password/reset-password.component';
import { PublicLayoutComponent } from './public-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'doctors', component: DoctorsComponent },
      { path: 'coupons', component: CouponsComponent },
      { path: 'doctor/:id', component: DoctorDetailComponent },
      { path: 'hospitals', component: HospitalsComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  // { path: '', component: HomeComponent },
  // { path: 'doctor/:id', component: DoctorDetailComponent },
  // { path: 'hospitals', component: HospitalsComponent },
  // { path: 'doctors', component: DoctorsComponent },
  // { path: 'coupons', component: CouponsComponent },
  // { path: 'login', component: LoginComponent },
  // { path: 'register', component: RegisterComponent },


  // {
  //   path: 'profile',
  //   component: ProfileComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'change-password',
  //   component: ChangePasswordComponent,
  //   canActivate: [AuthGuard]
  // },
  // {
  //   path: 'reset-password',
  //   component: ResetPasswordComponent
  // },
  // { path: '**', redirectTo: '', canActivate: [AuthGuard] }

  // User pages wrapped in layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', component: ProfileComponent, data: { title: 'My Profile' } },
      { path: 'change-password', component: ChangePasswordComponent, data: { title: 'Change Password' } },
      { path: 'reset-password', component: ResetPasswordComponent, data: { title: 'Reset Password' } }
    ]
  },
  {
    path: 'admin',
    // canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: '' }
];