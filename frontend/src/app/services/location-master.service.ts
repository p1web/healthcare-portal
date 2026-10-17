import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LocationDistrict {
  id: number;
  name: string;
}

export interface LocationState {
  id: number;
  name: string;
  districts: LocationDistrict[];
}

@Injectable({ providedIn: 'root' })
export class LocationMasterService {
  private readonly statesUrl = `${environment.apiUrl}/locations/states`;
  private readonly states$: Observable<LocationState[]>;

  constructor(private http: HttpClient) {
    this.states$ = this.http
      .get<LocationState[]>(this.statesUrl)
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  getStates(): Observable<LocationState[]> {
    return this.states$;
  }
}