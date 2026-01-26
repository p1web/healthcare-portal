import { Component, ViewEncapsulation,  AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { LayoutService } from '../../../core/layout.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-admin-layout',
  imports: [ HeaderComponent, SidebarComponent, FooterComponent, CommonModule, RouterOutlet, RouterModule ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
  encapsulation: ViewEncapsulation.None // Crucial: Makes these styles global while this component is active
})

export class AdminLayoutComponent implements OnInit, OnDestroy {

  isSidebarCollapsed = false;
  private sub!: Subscription;

  constructor(private router: Router, private layoutService: LayoutService) { }

  private scrollHandler = () => {};

  ngOnInit(): void {
    this.sub = this.layoutService.sidebar$.subscribe(state => {
      this.isSidebarCollapsed = state;
    });
    this.initScrollHandlers();
    this.initSearchToggle();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    window.removeEventListener('scroll', this.scrollHandler);
  }

  private initSearchToggle(): void {
    const searchToggle = document.querySelector('.search-bar-toggle');
    const searchBar = document.querySelector('.search-bar');

    searchToggle?.addEventListener('click', () => {
      searchBar?.classList.toggle('search-bar-show');
    });
  }

  private initScrollHandlers(): void {
    const header = document.querySelector('#header');
    const backToTop = document.querySelector('.back-to-top');

    this.scrollHandler = () => {
      const scrollY = window.scrollY;

      if (header) {
        header.classList.toggle('header-scrolled', scrollY > 100);
      }

      if (backToTop) {
        backToTop.classList.toggle('active', scrollY > 100);
      }
    };

    window.addEventListener('scroll', this.scrollHandler);
  }

}
