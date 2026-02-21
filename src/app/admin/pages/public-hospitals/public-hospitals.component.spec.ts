import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicHospitalsComponent } from './public-hospitals.component';

describe('PublicHospitalsComponent', () => {
  let component: PublicHospitalsComponent;
  let fixture: ComponentFixture<PublicHospitalsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicHospitalsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicHospitalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
