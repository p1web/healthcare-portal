import { Component } from '@angular/core';
import { DataTable } from 'simple-datatables';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})


export class DashboardComponent {
  ngAfterViewInit() {
    const table = document.querySelector('.datatable') as HTMLTableElement;
    if (table) {
      new DataTable(table);
    }
  }
}
