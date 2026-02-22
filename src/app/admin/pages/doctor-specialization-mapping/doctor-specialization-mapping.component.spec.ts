import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorSpecializationMappingComponent } from './doctor-specialization-mapping.component';

describe('DoctorSpecializationMappingComponent', () => {
  let component: DoctorSpecializationMappingComponent;
  let fixture: ComponentFixture<DoctorSpecializationMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorSpecializationMappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorSpecializationMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
