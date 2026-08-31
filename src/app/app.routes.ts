import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DoctorDetailComponent } from './components/doctor-detail/doctor-detail.component';
import { HospitalsComponent } from './components/hospitals/hospitals.component';
import { HospitalDetailComponent } from './components/hospital-detail/hospital-detail.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { CouponsComponent } from './components/coupons/coupons.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { LayoutComponent  } from './components/user/layout/layout.component';
import { ProfileComponent } from './components/user/profile/profile.component';
import { PatientProfileComponent } from './components/user/patient-profile/patient-profile.component';
import { AppointmentHistoryComponent } from './components/user/appointment-history/appointment-history.component';
import { PatientDashboardComponent } from './components/user/patient-dashboard/patient-dashboard.component';
import { DoctorAppointmentsComponent } from './components/user/doctor-appointments/doctor-appointments.component';
import { DoctorAnalyticsComponent } from './components/user/doctor-analytics/doctor-analytics.component';
import { DoctorProfileComponent } from './components/user/doctor-profile/doctor-profile.component';
import { DoctorPracticesComponent } from './components/user/doctor-practices/doctor-practices.component';
import { HospitalProfileComponent } from './components/user/hospital-profile/hospital-profile.component';
import { HospitalDashboardComponent } from './components/user/hospital-dashboard/hospital-dashboard.component';
import { HospitalPracticesComponent } from './components/user/hospital-practices/hospital-practices.component';
import { ChangePasswordComponent } from './components/user/change-password/change-password.component';
import { ResetPasswordComponent } from './components/user/reset-password/reset-password.component';
import { PublicLayoutComponent } from './public-layout.component';
import { RoleGuard } from './guards/role.guard';

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
      { path: 'hospital/:id', component: HospitalDetailComponent },
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
      { path: 'profile/patient', component: PatientProfileComponent, canActivate: [RoleGuard], data: { title: 'My Profile', roles: ['patient'] } },
      { path: 'patient-dashboard', component: PatientDashboardComponent, canActivate: [RoleGuard], data: { title: 'Dashboard', roles: ['patient'] } },
      { path: 'appointments', component: AppointmentHistoryComponent, canActivate: [RoleGuard], data: { title: 'My Appointments', roles: ['patient'] } },
      {
        path: 'appointments/:id/pay',
        canActivate: [RoleGuard],
        data: { title: 'Complete Payment', roles: ['patient'] },
        loadComponent: () => import('./components/appointment-payment/appointment-payment.component').then(m => m.AppointmentPaymentComponent)
      },
      {
        path: 'appointments/:id/receipt',
        canActivate: [RoleGuard],
        data: { title: 'Booking Receipt', roles: ['patient', 'doctor', 'hospital'] },
        loadComponent: () => import('./components/appointment-receipt/appointment-receipt.component').then(m => m.AppointmentReceiptComponent)
      },
      { path: 'doctor-appointments', component: DoctorAppointmentsComponent, canActivate: [RoleGuard], data: { title: 'Patient Bookings', roles: ['doctor'] } },
      {
        path: 'doctor/patients/:userId/snapshot',
        canActivate: [RoleGuard],
        data: { title: 'Patient Medical Snapshot', roles: ['doctor'] },
        loadComponent: () => import('./components/user/doctor-patient-snapshot/doctor-patient-snapshot.component').then(m => m.DoctorPatientSnapshotComponent)
      },
      { path: 'doctor-analytics', component: DoctorAnalyticsComponent, canActivate: [RoleGuard], data: { title: 'Practice Analytics', roles: ['doctor'] } },
      { path: 'profile/doctor', component: DoctorProfileComponent, canActivate: [RoleGuard], data: { title: 'My Profile', roles: ['doctor'] } },
      { path: 'doctor-practices', component: DoctorPracticesComponent, canActivate: [RoleGuard], data: { title: 'My Practices', roles: ['doctor'] } },
      { path: 'profile/hospital', component: HospitalProfileComponent, canActivate: [RoleGuard], data: { title: 'My Profile', roles: ['hospital'] } },
      { path: 'hospital-dashboard', component: HospitalDashboardComponent, canActivate: [RoleGuard], data: { title: 'Dashboard', roles: ['hospital'] } },
      { path: 'hospital-practices', component: HospitalPracticesComponent, canActivate: [RoleGuard], data: { title: 'Doctor Affiliations', roles: ['hospital'] } },
      { path: 'change-password', component: ChangePasswordComponent, data: { title: 'Change Password' } },
      { path: 'reset-password', component: ResetPasswordComponent, data: { title: 'Reset Password' } }
    ]
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: '' }
];