import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DoctorDetailComponent } from './components/doctor-detail/doctor-detail.component';
import { HospitalsComponent } from './components/hospitals/hospitals.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { CouponsComponent } from './components/coupons/coupons.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'doctor/:id', component: DoctorDetailComponent },
  { path: 'hospitals', component: HospitalsComponent },
  { path: 'doctors', component: DoctorsComponent },
  { path: 'coupons', component: CouponsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];