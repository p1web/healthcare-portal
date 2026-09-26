import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HospitalBookingOptionsService } from './hospital-booking-options.service';

describe('HospitalBookingOptionsService', () => {
  let service: HospitalBookingOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HospitalBookingOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
