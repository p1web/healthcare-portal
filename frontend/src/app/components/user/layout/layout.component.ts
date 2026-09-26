import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HeaderComponent } from '../../header/header.component';
import { FooterComponent } from '../../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../../../shared/breadcrumb/breadcrumb.component';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-layout',
  imports: [RouterModule, SidebarComponent, BreadcrumbComponent, HeaderComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})

export class LayoutComponent implements OnInit, OnDestroy {
  pageTitle = '';
  private sub!: Subscription;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        let currentRoute = this.route;

        while (currentRoute.firstChild) {
          currentRoute = currentRoute.firstChild;
        }

        this.pageTitle = currentRoute.snapshot.data['title'] || '';
      });
  }


  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
