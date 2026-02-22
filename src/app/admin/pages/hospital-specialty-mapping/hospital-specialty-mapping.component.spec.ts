import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalSpecialtyMappingComponent } from './hospital-specialty-mapping.component';

describe('HospitalSpecialtyMappingComponent', () => {
  let component: HospitalSpecialtyMappingComponent;
  let fixture: ComponentFixture<HospitalSpecialtyMappingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HospitalSpecialtyMappingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalSpecialtyMappingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
