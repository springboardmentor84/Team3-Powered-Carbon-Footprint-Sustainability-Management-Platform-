import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../services/layout.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  public layoutService = inject(LayoutService);

  public navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'bi-grid-1x2' },
    { label: 'Carbon Tracker', route: '/carbon', icon: 'bi-calculator' },
    { label: 'Goals', route: '/goals', icon: 'bi-bullseye' },
    { label: 'AI Assistant', route: '/ai', icon: 'bi-cpu' },
    { label: 'Challenges', route: '/challenges', icon: 'bi-trophy' },
    { label: 'Reports', route: '/reports', icon: 'bi-file-earmark-bar-graph' },
    { label: 'Profile', route: '/profile', icon: 'bi-person' }
  ];
}
