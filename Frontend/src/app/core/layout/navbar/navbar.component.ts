import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../../features/auth/auth.service';

export interface SearchItem {
  type: 'page' | 'activity' | 'goal';
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  queryParam?: string;
  badgeText?: string;
}

export interface AppNotification {
  id: number;
  type: 'achievement' | 'warning' | 'badge';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public layoutService = inject(LayoutService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  // Search State
  public searchQuery: string = '';
  public showSearchDropdown: boolean = false;

  // Dropdown States
  public showNotificationsDropdown: boolean = false;
  public showProfileDropdown: boolean = false;

  // Notifications Data
  public notifications: AppNotification[] = [
    {
      id: 1,
      type: 'achievement',
      title: '🎉 Goal Milestone Achieved!',
      message: 'You reduced monthly electricity emissions by 15%.',
      time: '10m ago',
      read: false,
      icon: 'bi-trophy-fill'
    },
    {
      id: 2,
      type: 'warning',
      title: '⚠️ Transport Emission Peak',
      message: 'Car commute emissions peaked on Tuesday (+4.2 kg CO₂e).',
      time: '2h ago',
      read: false,
      icon: 'bi-exclamation-triangle-fill'
    },
    {
      id: 3,
      type: 'badge',
      title: '🏅 Level 12 Eco Explorer',
      message: 'Earned 1,240 XP for planting community trees.',
      time: '1d ago',
      read: false,
      icon: 'bi-award-fill'
    }
  ];

  // Searchable Application Items Index
  public searchItemsIndex: SearchItem[] = [
    // Pages / Features
    { type: 'page', title: 'Dashboard', subtitle: 'Overview of personal & organizational emissions', icon: 'bi-grid-1x2-fill', route: '/dashboard', badgeText: 'Page' },
    { type: 'page', title: 'Carbon Tracker', subtitle: 'Log activities & track 11 carbon categories', icon: 'bi-speedometer2', route: '/carbon', badgeText: 'Page' },
    { type: 'page', title: 'Goals & Targets', subtitle: 'Set & monitor net-zero reduction targets', icon: 'bi-bullseye', route: '/goals', badgeText: 'Page' },
    { type: 'page', title: 'AI Assistant', subtitle: 'AI insights & eco recommendations', icon: 'bi-magic', route: '/ai', badgeText: 'Page' },
    { type: 'page', title: 'Challenges & Leaderboard', subtitle: 'Compete in community sustainability challenges', icon: 'bi-trophy', route: '/challenges', badgeText: 'Page' },
    { type: 'page', title: 'Reports & Analytics', subtitle: 'Export CO₂ reports & compliance summary', icon: 'bi-bar-chart-line', route: '/reports', badgeText: 'Page' },
    { type: 'page', title: 'My Profile & Settings', subtitle: 'Manage lifestyle preferences & account role', icon: 'bi-person-circle', route: '/profile', badgeText: 'Page' },

    // Categories & Activities
    { type: 'activity', title: 'Car Commute (Petrol)', subtitle: 'Transportation • 0.35 kg CO₂e/mile', icon: 'bi-car-front-fill', route: '/carbon', queryParam: 'TRANSPORTATION', badgeText: 'Activity' },
    { type: 'activity', title: 'EV Electric Vehicle', subtitle: 'Transportation • 0.12 kg CO₂e/mile', icon: 'bi-ev-front-fill', route: '/carbon', queryParam: 'TRANSPORTATION', badgeText: 'Activity' },
    { type: 'activity', title: 'Grid Electricity Usage', subtitle: 'Energy • 0.39 kg CO₂e/kWh', icon: 'bi-lightning-charge-fill', route: '/carbon', queryParam: 'ELECTRICITY', badgeText: 'Activity' },
    { type: 'activity', title: 'Rooftop Solar Energy', subtitle: 'Renewable • -0.35 kg CO₂e/kWh offset', icon: 'bi-sun-fill', route: '/carbon', queryParam: 'RENEWABLE_ENERGY', badgeText: 'Activity' },
    { type: 'activity', title: 'LPG Cooking Gas', subtitle: 'Fuel • 2.05 kg CO₂e/kg', icon: 'bi-fire', route: '/carbon', queryParam: 'COOKING_FUEL', badgeText: 'Activity' },
    { type: 'activity', title: 'Vegetarian Meal', subtitle: 'Food & Diet • 1.80 kg CO₂e/meal', icon: 'bi-egg-fried', route: '/carbon', queryParam: 'FOOD_CONSUMPTION', badgeText: 'Activity' },
    { type: 'activity', title: 'Community Tree Plantation', subtitle: 'Offset • -22.0 kg CO₂e/tree', icon: 'bi-tree-fill', route: '/carbon', queryParam: 'TREE_PLANTATION', badgeText: 'Activity' },
    { type: 'activity', title: 'Recycled Cardboard & Paper', subtitle: 'Recycling • -1.50 kg CO₂e/kg', icon: 'bi-recycle', route: '/carbon', queryParam: 'RECYCLING', badgeText: 'Activity' },

    // Sustainability Goals
    { type: 'goal', title: 'Reduce Monthly Electricity by 15%', subtitle: 'Energy Goal • Target: 100 kWh', icon: 'bi-flag-fill', route: '/goals', badgeText: 'Goal' },
    { type: 'goal', title: 'Zero Single-Use Plastic Waste', subtitle: 'Waste Goal • Target: 0 kg', icon: 'bi-trash-fill', route: '/goals', badgeText: 'Goal' },
    { type: 'goal', title: 'Plant 10 Community Trees', subtitle: 'Offset Goal • Target: 10 Trees', icon: 'bi-tree', route: '/goals', badgeText: 'Goal' },
    { type: 'goal', title: 'Switch 50% Commutes to EV or Cycle', subtitle: 'Transport Goal • Target: 50 miles', icon: 'bi-bicycle', route: '/goals', badgeText: 'Goal' }
  ];

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public onSearchFocus(): void {
    if (this.searchQuery.trim().length > 0) {
      this.showSearchDropdown = true;
    }
  }

  public onSearchInput(): void {
    this.showSearchDropdown = this.searchQuery.trim().length > 0;
  }

  public clearSearch(): void {
    this.searchQuery = '';
    this.showSearchDropdown = false;
  }

  public getFilteredResults(): SearchItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];
    return this.searchItemsIndex.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    ).slice(0, 8); // Limit to top 8 matching results
  }

  public selectResult(item: SearchItem): void {
    this.clearSearch();
    if (item.queryParam) {
      this.router.navigate([item.route], { queryParams: { category: item.queryParam } });
    } else {
      this.router.navigate([item.route]);
    }
  }

  public toggleNotificationsDropdown(event: Event): void {
    event.stopPropagation();
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    this.showProfileDropdown = false;
    this.showSearchDropdown = false;
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  public toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
    this.showNotificationsDropdown = false;
    this.showSearchDropdown = false;
  }

  public navigateTo(route: string): void {
    this.showProfileDropdown = false;
    this.showNotificationsDropdown = false;
    this.showSearchDropdown = false;
    this.router.navigate([route]);
  }

  public logout(): void {
    this.showProfileDropdown = false;
    this.authService.logout();
  }

  // Host Listener to close dropdowns when clicking anywhere outside
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSearchDropdown = false;
      this.showNotificationsDropdown = false;
      this.showProfileDropdown = false;
    }
  }
}
