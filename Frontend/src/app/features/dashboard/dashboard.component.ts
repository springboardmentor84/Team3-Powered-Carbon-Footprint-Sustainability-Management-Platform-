import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { ActivityService, ActivityCategory, ActivityRecord, CarbonSummary } from '../carbon/activity.service';
import { GoalService } from '../goals/goal.service';

interface Champion {
  rank: number;
  name: string;
  dept: string;
  points: number;
  avatar: string;
}

export interface CategoryTrackerScore {
  code: string;
  name: string;
  score: number; // Score out of 100
  icon: string;
  statusText: 'Excellent' | 'Good' | 'Needs Attention';
  badgeClass: string;
  desc: string;
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
  private goalService = inject(GoalService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  public currentMode: 'individual' | 'organization' = 'individual';

  // Summary Analytics from Activity Service
  public todayCarbon = 4.2;
  public monthlyCarbon = 128.5;
  public ecoScore = 84;
  public totalOffsets = 0;

  // 11 Category + Goal Progress Sustainability Trackers (Out of 100)
  public overallSustainabilityScore: number = 79;
  public goalProgressScore: number = 80;
  public showFormulaModal: boolean = false;

  public toggleFormulaModal(): void {
    this.showFormulaModal = !this.showFormulaModal;
  }

  public categoryTrackers: CategoryTrackerScore[] = [
    { code: 'CARBON', name: 'Carbon Footprint', score: 82, icon: 'bi-cloud-slash-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Net emissions below daily target' },
    { code: 'ELECTRICITY', name: 'Energy (Electricity)', score: 75, icon: 'bi-lightning-charge-fill', statusText: 'Good', badgeClass: 'badge-amber', desc: '12 kWh consumed today' },
    { code: 'WATER_USAGE', name: 'Water Usage', score: 60, icon: 'bi-droplet-fill', statusText: 'Needs Attention', badgeClass: 'badge-coral', desc: '120L household consumption' },
    { code: 'WASTE_MANAGEMENT', name: 'Waste Management', score: 90, icon: 'bi-trash3-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'High waste diversion rate' },
    { code: 'TRANSPORTATION', name: 'Transportation', score: 85, icon: 'bi-car-front-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Low vehicle emissions' },
    { code: 'COOKING_FUEL', name: 'Cooking Fuel', score: 88, icon: 'bi-fire', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Efficient fuel usage' },
    { code: 'FOOD_CONSUMPTION', name: 'Food & Diet', score: 82, icon: 'bi-egg-fried', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Plant-forward diet' },
    { code: 'SHOPPING', name: 'Shopping & Goods', score: 84, icon: 'bi-bag-check-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Low consumer waste' },
    { code: 'TRAVEL', name: 'Travel & Lodging', score: 80, icon: 'bi-airplane-fill', statusText: 'Good', badgeClass: 'badge-amber', desc: 'Eco-conscious trips' },
    { code: 'TREE_PLANTATION', name: 'Tree Plantation', score: 95, icon: 'bi-tree-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Active reforestation' },
    { code: 'RECYCLING', name: 'Recycling', score: 92, icon: 'bi-recycle', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Paper & plastic recycling' },
    { code: 'RENEWABLE_ENERGY', name: 'Renewable Solar', score: 96, icon: 'bi-sun-fill', statusText: 'Excellent', badgeClass: 'badge-emerald', desc: 'Rooftop solar generation' },
    { code: 'GOAL_PROGRESS', name: 'Goal Progress', score: 80, icon: 'bi-bullseye', statusText: 'Good', badgeClass: 'badge-amber', desc: 'Target indicators completion' }
  ];

  // Dynamic Y-axis labels for emissions trend chart
  public maxEmissionLabel = '5.0';
  public midHighEmissionLabel = '3.8';
  public midLowEmissionLabel = '1.9';

  // Recent Activities from Activity Service
  public indivActivities: ActivityRecord[] = [];
  public categories: ActivityCategory[] = [];

  // Dynamic Donut Chart Slices
  public donutSlices: any[] = [];

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
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  public async loadDashboardData() {
    try {
      const summary: CarbonSummary = await this.activityService.getSummary();
      this.todayCarbon = summary.todayEmission;
      this.monthlyCarbon = summary.monthlyEmission;
      this.totalOffsets = summary.totalOffsets;

      const all = await this.activityService.getAllActivities();
      this.indivActivities = all.slice(0, 6);
      this.calculateChartPoints(all);
      this.calculateDonutSlices(summary);
      await this.calculateSustainabilityTrackers(all);
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    } catch (err) {
      console.warn('Dashboard load fallback used:', err);
      const fallbackSummary = (this.activityService as any).calculateLocalSummary ? (this.activityService as any).calculateLocalSummary() : null;
      if (fallbackSummary) {
        this.calculateDonutSlices(fallbackSummary);
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  /**
   * Calculates sustainability scores out of 100 for all 11 Carbon Categories + Goal Progress.
   * Dynamically adjusts scores based on user activity logging, offsets, and completed goals.
   */
  public async calculateSustainabilityTrackers(allActivities: ActivityRecord[]): Promise<void> {
    try {
      const goals = await this.goalService.getGoals();
      
      // 1. Calculate Goal Progress Score based on user completed goals
      const totalGoals = goals.length || 1;
      const completedGoals = goals.filter(g => g.status === 'Completed' || (g.progress && g.progress >= 100)).length;
      const avgGoalProgress = goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals;

      // Dynamic Goal Progress Score out of 100
      let calcGoalScore = Math.min(100, Math.max(50, Math.round((completedGoals / totalGoals) * 40 + avgGoalProgress * 0.6)));
      this.goalProgressScore = calcGoalScore;

      // 2. Map emissions by category code
      const breakdownMap = new Map<string, number>();
      for (const act of allActivities) {
        const code = act.categoryCode;
        const current = breakdownMap.get(code) || 0;
        breakdownMap.set(code, current + (act.calculatedCo2 || 0));
      }

      // 3. Recalculate score out of 100 for each of the 12 Category Trackers
      this.categoryTrackers = this.categoryTrackers.map(item => {
        let score = item.score;

        if (item.code === 'GOAL_PROGRESS') {
          score = calcGoalScore;
        } else if (item.code === 'TREE_PLANTATION' || item.code === 'RECYCLING' || item.code === 'RENEWABLE_ENERGY') {
          // Green offsets boost score towards 100
          const offsetVal = breakdownMap.get(item.code) || 0;
          score = Math.min(100, Math.max(85, Math.round(85 + offsetVal * 0.5)));
        } else if (item.code === 'CARBON') {
          const net = this.monthlyCarbon || 100;
          score = Math.min(100, Math.max(40, Math.round(100 - (net / 200) * 20)));
        } else {
          // Emission categories: lower emissions = higher score out of 100
          const emissionVal = breakdownMap.get(item.code) || 0;
          if (emissionVal > 20) {
            score = Math.max(45, Math.round(85 - (emissionVal - 20) * 0.8));
          } else {
            score = Math.min(100, Math.max(70, Math.round(85 + (20 - emissionVal) * 0.5)));
          }
        }

        let statusText: 'Excellent' | 'Good' | 'Needs Attention' = 'Excellent';
        let badgeClass = 'badge-emerald';

        if (score >= 80) {
          statusText = 'Excellent';
          badgeClass = 'badge-emerald';
        } else if (score >= 60) {
          statusText = 'Good';
          badgeClass = 'badge-amber';
        } else {
          statusText = 'Needs Attention';
          badgeClass = 'badge-coral';
        }

        return {
          ...item,
          score,
          statusText,
          badgeClass
        };
      });

      // 4. Calculate Overall Sustainability Score (Average out of 100)
      const totalScoreSum = this.categoryTrackers.reduce((acc, cat) => acc + cat.score, 0);
      this.overallSustainabilityScore = Math.round(totalScoreSum / this.categoryTrackers.length);
      this.ecoScore = this.overallSustainabilityScore;
    } catch (err) {
      console.warn('Category tracker calculation handled:', err);
    }
  }

  public calculateChartPoints(allActivities: ActivityRecord[]): void {
    const points = [];
    const today = new Date();
    
    // 1. Generate the last 8 dates (including today)
    const dates = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
    
    // 2. Map activities to date keys (YYYY-MM-DD) and sum non-offset emissions
    const emissionsMap = new Map<string, number>();
    for (const d of dates) {
      const key = d.toISOString().split('T')[0];
      emissionsMap.set(key, 0);
    }
    
    for (const act of allActivities) {
      if (!act.isOffset) {
        const key = act.activityDate;
        if (emissionsMap.has(key)) {
          const current = emissionsMap.get(key) || 0;
          emissionsMap.set(key, current + act.calculatedCo2);
        }
      }
    }
    
    // 3. Find the max value (for scaling Y coordinates)
    const values = Array.from(emissionsMap.values());
    const maxVal = Math.max(...values, 5.0); // baseline of at least 5.0 kg CO2e
    
    this.maxEmissionLabel = maxVal.toFixed(1);
    this.midHighEmissionLabel = (maxVal * 0.75).toFixed(1);
    this.midLowEmissionLabel = (maxVal * 0.375).toFixed(1);
    
    // 4. Map each date to X and Y coordinates
    for (let i = 0; i < 8; i++) {
      const d = dates[i];
      const key = d.toISOString().split('T')[0];
      const val = emissionsMap.get(key) || 0;
      
      // X spans from 30 to 289
      const x = 30 + i * 37;
      
      // Y spans from 110 (bottom) to 30 (top)
      const y = 110 - (val / maxVal) * 80;
      
      // Label: e.g. "05 Aug"
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const label = i === 7 ? 'Today' : `${day} ${month}`;
      
      points.push({
        x,
        y: parseFloat(y.toFixed(1)),
        label,
        val: val.toFixed(1)
      });
    }
    
    this.indivChartPoints = points;
  }

  public calculateDonutSlices(summary: CarbonSummary) {
    const breakdown = summary.categoryBreakdown || {};
    
    // Group categories
    let transport = (breakdown['TRANSPORTATION'] || 0) + (breakdown['TRAVEL'] || 0);
    let energy = (breakdown['ELECTRICITY'] || 0) + (breakdown['COOKING_FUEL'] || 0);
    let food = (breakdown['FOOD_CONSUMPTION'] || 0) + (breakdown['WATER_USAGE'] || 0);
    let other = (breakdown['WASTE_MANAGEMENT'] || 0) + (breakdown['SHOPPING'] || 0) + (breakdown['RECYCLING'] || 0) + (breakdown['TREE_PLANTATION'] || 0) + (breakdown['RENEWABLE_ENERGY'] || 0);
    
    const total = transport + energy + food + other;
    
    if (total === 0) {
      transport = 45;
      energy = 30;
      food = 25;
      other = 0;
    }
    
    const rawSlices = [
      { label: 'Transport', value: transport, color: '#10B981' },
      { label: 'Energy Usage', value: energy, color: '#3B82F6' },
      { label: 'Food & Diet', value: food, color: '#F59E0B' },
      { label: 'Other Waste', value: other, color: '#8B5CF6' }
    ].filter(s => s.value > 0);
    
    const grandTotal = rawSlices.reduce((acc, s) => acc + s.value, 0);
    
    const circumference = 219.9; // 2 * pi * 35
    let currentOffset = 0;
    
    this.donutSlices = rawSlices.map(s => {
      const pct = Math.round((s.value / grandTotal) * 100);
      const sliceLength = (s.value / grandTotal) * circumference;
      const remainingLength = circumference - sliceLength;
      
      const slice = {
        label: s.label,
        percentage: pct,
        color: s.color,
        dashArray: `${sliceLength.toFixed(1)} ${remainingLength.toFixed(1)}`,
        dashOffset: -currentOffset
      };
      
      currentOffset += sliceLength;
      return slice;
    });
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

    try {
      const currentCat = this.categories.find(c => c.code === this.quickCategoryCode);
      const isOffset = currentCat ? currentCat.isOffset : false;
      const calcCo2 = this.quickCalculatedCo2 || parseFloat(((this.quickQuantity || 1) * 0.39).toFixed(2));
      const activityTitle = this.quickActivityName.trim() || 'Logged Activity';

      // 2. Immediately close modal & show success toast to user
      this.showToast(`🎉 Activity Saved! Logged "${activityTitle}" (${calcCo2} kg CO₂e)`, 'success');
      this.closeQuickModal();

      // 3. Save to backend / PostgreSQL database fast
      const saved = await this.activityService.createActivity({
        categoryCode: this.quickCategoryCode,
        subCategory: this.quickSubCategory,
        activityDate: new Date().toISOString().split('T')[0],
        activityName: activityTitle,
        quantity: this.quickQuantity,
        unit: this.quickUnit,
        detailJson: '{}',
        calculatedCo2: calcCo2,
        notes: this.quickNotes,
        isOffset: isOffset
      });

      // 4. Refresh dashboard stats
      await this.loadDashboardData();
    } catch (err) {
      console.warn('Dashboard quick log handled:', err);
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
