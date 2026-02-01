import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicDoctorComponent } from './public-doctor.component';

describe('PublicDoctorComponent', () => {
  let component: PublicDoctorComponent;
  let fixture: ComponentFixture<PublicDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicDoctorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
