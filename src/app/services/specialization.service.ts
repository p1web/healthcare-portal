import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Specializations{
  id:number,
  name:string,
  description:string,
  icon:string,
}

@Injectable({
  providedIn: 'root'
})

export class SpecializationService {

  private apiUrl = 'http://localhost:3000/api/specializations';

  constructor(private http: HttpClient) {}

  getSpecializations(): Observable<Specializations[]> {
    return this.http.get<Specializations[]>(this.apiUrl);
  }
}
