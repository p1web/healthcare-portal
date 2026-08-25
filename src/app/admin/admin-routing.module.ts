import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { DoctorsComponent } from './pages/doctors/doctors.component';
import { PublicHospitalsComponent } from './pages/public-hospitals/public-hospitals.component';
import { SpecialtiesComponent } from './pages/specialties/specialties.component';
import { SpecializationsComponent } from './pages/specializations/specializations.component';
import { DoctorSpecializationMappingComponent } from './pages/doctor-specialization-mapping/doctor-specialization-mapping.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { CouponCategoriesComponent } from './pages/coupon-categories/coupon-categories.component';
import { CouponsComponent } from './pages/coupons/coupons.component';
import { CouponFormComponent } from './pages/coupons/coupon-form/coupon-form.component';
import { CouponAnalyticsComponent } from './pages/coupon-analytics/coupon-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users', redirectTo: 'users/patients', pathMatch: 'full' },
      { path: 'users/patients', component: UsersComponent, data: { role: 'patient' } },
      { path: 'users/doctors', component: UsersComponent, data: { role: 'doctor' } },
      { path: 'users/hospitals', component: UsersComponent, data: { role: 'hospital' } },
      { path: 'public-doctors', component: DoctorsComponent, data: { publicListing: true } },
      { path: 'public-hospitals', component: PublicHospitalsComponent },
      { path: 'appointments', component: AppointmentsComponent },
      { path: 'specialties', component: SpecialtiesComponent },
      { path: 'specializations', component: SpecializationsComponent },
      { path: 'doctor-specialization-mapping', component: DoctorSpecializationMappingComponent },
      { path: 'coupon-categories', component: CouponCategoriesComponent },
      { path: 'coupons', component: CouponsComponent },
      { path: 'coupons/new', component: CouponFormComponent },
      { path: 'coupons/:id/edit', component: CouponFormComponent },
      { path: 'coupon-analytics', component: CouponAnalyticsComponent },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }
