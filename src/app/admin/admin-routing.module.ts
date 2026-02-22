import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersComponent } from './pages/users/users.component';
import { DoctorsComponent } from './pages/doctors/doctors.component';
import { PublicDoctorComponent } from './pages/public-doctor/public-doctor.component';
import { PublicHospitalsComponent } from './pages/public-hospitals/public-hospitals.component';
import { HospitalsComponent } from './pages/hospitals/hospitals.component';
import { SpecialtiesComponent } from './pages/specialties/specialties.component';
import { SpecializationsComponent } from './pages/specializations/specializations.component';
import { DoctorSpecializationMappingComponent } from './pages/doctor-specialization-mapping/doctor-specialization-mapping.component';
import { HospitalSpecialtyMappingComponent } from './pages/hospital-specialty-mapping/hospital-specialty-mapping.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersComponent },
      { path: 'doctors-profile', component: DoctorsComponent },
      { path: 'hospital-user-profile', component: HospitalsComponent },
      { path: 'public-doctors', component: PublicDoctorComponent },
      { path: 'public-hospitals', component: PublicHospitalsComponent },
      { path: 'specialties', component: SpecialtiesComponent },
      { path: 'specializations', component: SpecializationsComponent },
      { path: 'doctor-specialization-mapping', component: DoctorSpecializationMappingComponent },
      { path: 'hospital-specialty-mapping', component: HospitalSpecialtyMappingComponent },
    ]
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class AdminRoutingModule { }
