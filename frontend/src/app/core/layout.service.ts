import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {

  private sidebarState = new BehaviorSubject<boolean>(false);
  sidebar$ = this.sidebarState.asObservable();

  toggleSidebar(): void {
    this.sidebarState.next(!this.sidebarState.value);
  }
}
