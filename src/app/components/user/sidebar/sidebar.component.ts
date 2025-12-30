import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Needed for routerLink directives

@Component({
  standalone: true,               // ✅ Make this standalone
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule], // ✅ Import CommonModule + RouterModule
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // ✅ fix typo (was styleUrl)
})
export class SidebarComponent {}
