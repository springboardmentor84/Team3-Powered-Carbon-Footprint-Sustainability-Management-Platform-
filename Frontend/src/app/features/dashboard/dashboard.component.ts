import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { ActivityService, ActivityCategory, ActivityRecord, CarbonSummary } from '../carbon/activity.service';

interface Champion {
  rank: number;
  name: string;
  dept: string;
  points: number;
  avatar: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private activityService = inject(ActivityService);
  private router = inject(Router);

  public currentMode: 'individual' | 'organization' = 'individual';

  // Summary Analytics from Activity Service
  public todayCarbon = 4.2;
  public monthlyCarbon = 128.5;
  public ecoScore = 84;
  public totalOffsets = 0;

  // Recent Activities from Activity Service
  public indivActivities: ActivityRecord[] = [];
  public categories: ActivityCategory[] = [];

  // Quick Add Activity Modal State
  public showQuickModal = false;
  public quickCategoryCode = 'TRANSPORTATION';
  public quickSubCategory = 'CAR_PETROL';
  public quickActivityName = 'Commute to office (Sedan)';
  public quickQuantity = 12;
  public quickUnit = 'miles';
  public quickNotes = '';
  public quickCalculatedCo2 = 4.2;
  public isLogging = false;

  // Toast Alerts
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';

  // Hover states for chart points
  public activeIndivPoint: { index: number; label: string; value: string; x: number; y: number } | null = null;
  public activeOrgPoint: { index: number; label: string; value: string; x: number; y: number } | null = null;

  // Individual chart coordinates (for 300x120 viewBox)
  public indivChartPoints = [
    { x: 10, y: 80, label: '01 Jul', val: '2.8' },
    { x: 50, y: 70, label: '06 Jul', val: '3.1' },
    { x: 90, y: 85, label: '12 Jul', val: '2.5' },
    { x: 130, y: 50, label: '18 Jul', val: '4.2' },
    { x: 170, y: 65, label: '24 Jul', val: '3.4' },
    { x: 210, y: 80, label: '25 Jul', val: '2.9' },
    { x: 250, y: 90, label: '26 Jul', val: '2.2' },
    { x: 290, y: 40, label: 'Today', val: '4.2' }
  ];

  // Organization mode data
  public departmentBreakdown = [
    { name: 'Logistics & Supply', percentage: 42, color: '#EF4444' },
    { name: 'Manufacturing', percentage: 28, color: '#10B981' },
    { name: 'Data Centers', percentage: 18, color: '#3B82F6' },
    { name: 'Corporate Offices', percentage: 12, color: '#F59E0B' }
  ];

  public orgChampions: Champion[] = [
    { rank: 1, name: 'Sarah Jenkins', dept: 'Marketing Dept', points: 2450, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&auto=format&fit=crop' },
    { rank: 2, name: 'Alex Rivers', dept: 'Engineering Dept', points: 2100, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=60&auto=format&fit=crop' },
    { rank: 3, name: 'Mike Thornton', dept: 'Logistics Dept', points: 1950, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&auto=format&fit=crop' }
  ];

  // Organization chart coordinates (for 350x120 viewBox)
  public orgChartPoints = [
    { x: 20, y: 90, label: 'Jan', val: '12,100' },
    { x: 80, y: 80, label: 'Mar', val: '12,450' },
    { x: 140, y: 85, label: 'May', val: '12,300' },
    { x: 200, y: 95, label: 'Jul', val: '11,900' },
    { x: 260, y: 55, label: 'Sep', val: '14,050' },
    { x: 320, y: 75, label: 'Nov', val: '13,280' }
  ];

  async ngOnInit() {
    this.categories = await this.activityService.getCategories();
    await this.loadDashboardData();
  }

  public async loadDashboardData() {
    try {
      const summary: CarbonSummary = await this.activityService.getSummary();
      this.todayCarbon = summary.todayEmission;
      this.monthlyCarbon = summary.monthlyEmission;
      this.ecoScore = summary.netCarbonScore;
      this.totalOffsets = summary.totalOffsets;

      const all = await this.activityService.getAllActivities();
      this.indivActivities = all.slice(0, 6);
    } catch (err) {
      console.warn('Dashboard load fallback used:', err);
    }
  }

  public openQuickModal() {
    this.showQuickModal = true;
    this.selectQuickCategory(this.quickCategoryCode);
  }

  public closeQuickModal() {
    this.showQuickModal = false;
  }

  public navigateToCarbon() {
    this.router.navigate(['/carbon']);
  }

  public selectQuickCategory(code: string) {
    this.quickCategoryCode = code;
    const cat = this.categories.find(c => c.code === code);
    if (cat) {
      this.quickUnit = cat.defaultUnit;
    }

    switch (code) {
      case 'TRANSPORTATION':
        this.quickActivityName = 'Commute to office (Sedan)';
        this.quickSubCategory = 'CAR_PETROL';
        this.quickQuantity = 12;
        this.quickUnit = 'miles';
        break;
      case 'ELECTRICITY':
        this.quickActivityName = 'Home Electricity Usage';
        this.quickSubCategory = 'GRID_POWER';
        this.quickQuantity = 15;
        this.quickUnit = 'kWh';
        break;
      case 'COOKING_FUEL':
        this.quickActivityName = 'LPG Cooking Cylinder';
        this.quickSubCategory = 'LPG';
        this.quickQuantity = 2;
        this.quickUnit = 'kg';
        break;
      case 'FOOD_CONSUMPTION':
        this.quickActivityName = 'Vegetarian Lunch Meal';
        this.quickSubCategory = 'VEGETARIAN';
        this.quickQuantity = 1;
        this.quickUnit = 'meals';
        break;
      case 'WATER_USAGE':
        this.quickActivityName = 'Daily Household Water';
        this.quickSubCategory = 'TAP_WATER';
        this.quickQuantity = 120;
        this.quickUnit = 'litres';
        break;
      case 'WASTE_MANAGEMENT':
        this.quickActivityName = 'Weekly Household Waste';
        this.quickSubCategory = 'PLASTIC';
        this.quickQuantity = 3;
        this.quickUnit = 'kg';
        break;
      case 'SHOPPING':
        this.quickActivityName = 'New Clothing Purchase';
        this.quickSubCategory = 'CLOTHING';
        this.quickQuantity = 1;
        this.quickUnit = 'items';
        break;
      case 'TRAVEL':
        this.quickActivityName = 'Hotel Stay (Eco Tier)';
        this.quickSubCategory = 'HOTEL';
        this.quickQuantity = 2;
        this.quickUnit = 'nights';
        break;
      case 'TREE_PLANTATION':
        this.quickActivityName = 'Community Plantation Drive';
        this.quickSubCategory = 'TREE_PLANTED';
        this.quickQuantity = 3;
        this.quickUnit = 'trees';
        break;
      case 'RECYCLING':
        this.quickActivityName = 'Recycled Cardboard & Paper';
        this.quickSubCategory = 'RECYCLED_MATERIAL';
        this.quickQuantity = 10;
        this.quickUnit = 'kg';
        break;
      case 'RENEWABLE_ENERGY':
        this.quickActivityName = 'Rooftop Solar Energy Produced';
        this.quickSubCategory = 'SOLAR_KWH';
        this.quickQuantity = 25;
        this.quickUnit = 'kWh';
        break;
    }
    this.recalculateQuickPreview();
  }

  public recalculateQuickPreview() {
    let factor = 0.35;
    if (this.quickCategoryCode === 'TRANSPORTATION') {
      factor = this.quickSubCategory === 'CAR_PETROL' ? 0.35 : this.quickSubCategory === 'CAR_EV' ? 0.12 : 0.05;
    } else if (this.quickCategoryCode === 'ELECTRICITY') {
      factor = 0.39;
    } else if (this.quickCategoryCode === 'COOKING_FUEL') {
      factor = 2.05;
    } else if (this.quickCategoryCode === 'FOOD_CONSUMPTION') {
      factor = 1.80;
    } else if (this.quickCategoryCode === 'WATER_USAGE') {
      factor = 0.01;
    } else if (this.quickCategoryCode === 'WASTE_MANAGEMENT') {
      factor = 1.50;
    } else if (this.quickCategoryCode === 'SHOPPING') {
      factor = 15.0;
    } else if (this.quickCategoryCode === 'TRAVEL') {
      factor = 25.0;
    } else if (this.quickCategoryCode === 'TREE_PLANTATION') {
      factor = 22.0;
    } else if (this.quickCategoryCode === 'RECYCLING') {
      factor = 1.50;
    } else if (this.quickCategoryCode === 'RENEWABLE_ENERGY') {
      factor = 0.35;
    }

    const val = (this.quickQuantity || 0) * factor;
    this.quickCalculatedCo2 = parseFloat(val.toFixed(2));
  }

  public async onQuickLogActivity() {
    if (!this.quickActivityName || !this.quickActivityName.trim()) {
      this.showToast('Please enter an Activity Name.', 'error');
      return;
    }
    if (!this.quickQuantity || this.quickQuantity <= 0) {
      this.showToast('Quantity must be greater than 0.', 'error');
      return;
    }

    this.isLogging = true;
    const currentCat = this.categories.find(c => c.code === this.quickCategoryCode);
    const isOffset = currentCat ? currentCat.isOffset : false;

    try {
      const saved = await this.activityService.createActivity({
        categoryCode: this.quickCategoryCode,
        subCategory: this.quickSubCategory,
        activityDate: new Date().toISOString().split('T')[0],
        activityName: this.quickActivityName.trim(),
        quantity: this.quickQuantity,
        unit: this.quickUnit,
        detailJson: '{}',
        calculatedCo2: this.quickCalculatedCo2,
        notes: this.quickNotes,
        isOffset: isOffset
      });

      this.showToast(`Success! Logged "${saved.activityName}" (${saved.calculatedCo2} kg CO₂e)`, 'success');
      this.closeQuickModal();
      await this.loadDashboardData();
    } catch (err) {
      this.showToast('Failed to log activity.', 'error');
    } finally {
      this.isLogging = false;
    }
  }

  public async onDeleteIndivActivity(id: string) {
    try {
      await this.activityService.deleteActivity(id);
      this.showToast('Activity record deleted.', 'success');
      await this.loadDashboardData();
    } catch (err) {
      this.showToast('Could not delete activity.', 'error');
    }
  }

  public setMode(mode: 'individual' | 'organization') {
    this.currentMode = mode;
  }

  public showIndivTooltip(point: any, index: number) {
    this.activeIndivPoint = {
      index,
      label: point.label,
      value: `${point.val} kg CO₂e`,
      x: point.x,
      y: point.y - 12
    };
  }

  public hideIndivTooltip() {
    this.activeIndivPoint = null;
  }

  public showOrgTooltip(point: any, index: number) {
    this.activeOrgPoint = {
      index,
      label: point.label,
      value: `${point.val} tCO₂e`,
      x: point.x,
      y: point.y - 12
    };
  }

  public hideOrgTooltip() {
    this.activeOrgPoint = null;
  }

  public getPathString(points: Array<{x: number, y: number}>): string {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY1 = points[i-1].y;
      const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY2 = points[i].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  public getAreaPathString(points: Array<{x: number, y: number}>, height: number): string {
    if (points.length === 0) return '';
    const linePath = this.getPathString(points);
    return `${linePath} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }
}
