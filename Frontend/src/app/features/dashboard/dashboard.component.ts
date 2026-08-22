import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserDashboardComponent } from './user/user-dashboard.component';
import { OrganizationDashboardComponent } from './organization/organization-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UserDashboardComponent,
    OrganizationDashboardComponent,
    AdminDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  public currentMode: 'individual' | 'organization' | 'admin' = 'individual';
  public userRole: string = 'ROLE_USER';
  public allowedModes: string[] = ['individual'];

  ngOnInit() {
    this.loadUserRole();
    this.cdr.detectChanges();
  }

  public loadUserRole() {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('ecotrack_user');
      if (userData) {
        try {
          const u = JSON.parse(userData);
          this.userRole = u.userRole || u.role || 'ROLE_USER';
        } catch {
          this.userRole = 'ROLE_USER';
        }
      }
    }

    if (this.userRole === 'ROLE_ORGANIZATION') {
      this.currentMode = 'organization';
      this.allowedModes = ['organization'];
    } else if (this.userRole === 'ROLE_ADMIN') {
      this.currentMode = 'admin';
      this.allowedModes = ['admin', 'organization', 'individual'];
    } else {
      this.currentMode = 'individual';
      this.allowedModes = ['individual'];
    }
  }

  public setMode(mode: 'individual' | 'organization' | 'admin') {
    this.currentMode = mode;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}
