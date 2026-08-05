import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityService, ActivityCategory, ActivityRecord, CarbonSummary } from './activity.service';

@Component({
  selector: 'app-carbon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carbon.component.html',
  styleUrls: ['./carbon.component.css']
})
export class CarbonComponent implements OnInit {
  private activityService = inject(ActivityService);

  // Categories & Selection
  public categories: ActivityCategory[] = [];
  public selectedCategoryCode = 'TRANSPORTATION';

  // Summary Analytics
  public summary: CarbonSummary = {
    todayEmission: 0,
    monthlyEmission: 0,
    yearlyEmission: 0,
    totalOffsets: 0,
    netCarbonScore: 85,
    categoryBreakdown: {}
  };

  // Activity List & Pagination / Filter / Search
  public activities: ActivityRecord[] = [];
  public filteredActivities: ActivityRecord[] = [];
  public searchQuery = '';
  public filterCategoryCode = 'ALL';
  public sortOrder: 'DESC' | 'ASC' = 'DESC';
  public currentPage = 1;
  public pageSize = 5;

  // Form Inputs for Log Activity
  public activityDate = new Date().toISOString().split('T')[0];
  public activityName = 'Commute to office (Sedan)';
  public subCategory = 'CAR_PETROL';
  public quantity = 12;
  public unit = 'miles';
  public notes = '';
  public calculatedCo2 = 4.2;
  public isLogging = false;

  // Category specific detail fields
  public transportPassengers = 1;
  public transportPurpose = 'Work Commute';
  public transportRoundTrip = true;
  public electricityProvider = 'Local Power Grid';
  public electricityRenewablePct = 10;
  public foodDietType = 'VEGETARIAN';
  public foodMealType = 'LUNCH';
  public wasteRecycledPct = 40;
  public treeSpecies = 'Oak Sapling';
  public treeLocation = 'Community Park';

  // Toast Notification
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';

  // Edit Modal
  public editingActivity: ActivityRecord | null = null;

  // Quick Add Modal state
  public showQuickModal = false;
  public quickCategoryCode = 'TRANSPORTATION';
  public quickSubCategory = 'CAR_PETROL';
  public quickActivityName = 'Commute to office (Sedan)';
  public quickQuantity = 15;
  public quickUnit = 'miles';
  public quickNotes = '';
  public quickCalculatedCo2 = '6.15';

  async ngOnInit() {
    await this.loadCategories();
    await this.loadDashboardData();
    this.selectCategory('TRANSPORTATION');
  }

  public async loadCategories() {
    this.categories = await this.activityService.getCategories();
  }

  public async loadDashboardData() {
    this.summary = await this.activityService.getSummary();
    this.activities = await this.activityService.getAllActivities();
    this.applyFiltersAndSort();
  }

  public selectCategory(code: string) {
    this.selectedCategoryCode = code;
    const cat = this.categories.find(c => c.code === code);
    if (cat) {
      this.unit = cat.defaultUnit;
    }

    // Set defaults per category
    switch (code) {
      case 'TRANSPORTATION':
        this.activityName = 'Commute to office (Sedan)';
        this.subCategory = 'CAR_PETROL';
        this.quantity = 12;
        this.unit = 'miles';
        break;
      case 'ELECTRICITY':
        this.activityName = 'Home Electricity Usage';
        this.subCategory = 'GRID_POWER';
        this.quantity = 15;
        this.unit = 'kWh';
        break;
      case 'COOKING_FUEL':
        this.activityName = 'LPG Cooking Cylinder';
        this.subCategory = 'LPG';
        this.quantity = 2;
        this.unit = 'kg';
        break;
      case 'FOOD_CONSUMPTION':
        this.activityName = 'Vegetarian Lunch Meal';
        this.subCategory = 'VEGETARIAN';
        this.quantity = 1;
        this.unit = 'meals';
        break;
      case 'WATER_USAGE':
        this.activityName = 'Daily Household Water';
        this.subCategory = 'TAP_WATER';
        this.quantity = 120;
        this.unit = 'litres';
        break;
      case 'WASTE_MANAGEMENT':
        this.activityName = 'Weekly Household Waste';
        this.subCategory = 'PLASTIC';
        this.quantity = 3;
        this.unit = 'kg';
        break;
      case 'SHOPPING':
        this.activityName = 'New Clothing Purchase';
        this.subCategory = 'CLOTHING';
        this.quantity = 1;
        this.unit = 'items';
        break;
      case 'TRAVEL':
        this.activityName = 'Hotel Stay (Eco Tier)';
        this.subCategory = 'HOTEL';
        this.quantity = 2;
        this.unit = 'nights';
        break;
      case 'TREE_PLANTATION':
        this.activityName = 'Community Plantation Drive';
        this.subCategory = 'TREE_PLANTED';
        this.quantity = 3;
        this.unit = 'trees';
        break;
      case 'RECYCLING':
        this.activityName = 'Recycled Cardboard & Paper';
        this.subCategory = 'RECYCLED_MATERIAL';
        this.quantity = 10;
        this.unit = 'kg';
        break;
      case 'RENEWABLE_ENERGY':
        this.activityName = 'Rooftop Solar Energy Produced';
        this.subCategory = 'SOLAR_KWH';
        this.quantity = 25;
        this.unit = 'kWh';
        break;
    }
    this.recalculatePreview();
  }

  public recalculatePreview() {
    let factor = 0.35;
    if (this.selectedCategoryCode === 'TRANSPORTATION') {
      factor = this.subCategory === 'CAR_PETROL' ? 0.35 : this.subCategory === 'CAR_EV' ? 0.12 : this.subCategory === 'BUS' ? 0.08 : 0.05;
    } else if (this.selectedCategoryCode === 'ELECTRICITY') {
      factor = this.subCategory === 'RENEWABLE' ? 0.05 : 0.39;
    } else if (this.selectedCategoryCode === 'COOKING_FUEL') {
      factor = this.subCategory === 'LPG' ? 2.98 : this.subCategory === 'PNG' ? 2.05 : 1.80;
    } else if (this.selectedCategoryCode === 'FOOD_CONSUMPTION') {
      factor = this.subCategory === 'MEAT' ? 2.50 : this.subCategory === 'VEGETARIAN' ? 0.80 : 0.30;
    } else if (this.selectedCategoryCode === 'WATER_USAGE') {
      factor = 0.01;
    } else if (this.selectedCategoryCode === 'WASTE_MANAGEMENT') {
      factor = this.subCategory === 'ELECTRONIC_WASTE' ? 3.50 : 2.10;
    } else if (this.selectedCategoryCode === 'SHOPPING') {
      factor = this.subCategory === 'ELECTRONICS' ? 85.0 : 12.0;
    } else if (this.selectedCategoryCode === 'TRAVEL') {
      factor = 25.0;
    } else if (this.selectedCategoryCode === 'TREE_PLANTATION') {
      factor = 22.0;
    } else if (this.selectedCategoryCode === 'RECYCLING') {
      factor = 1.50;
    } else if (this.selectedCategoryCode === 'RENEWABLE_ENERGY') {
      factor = 0.35;
    }

    const val = (this.quantity || 0) * factor;
    this.calculatedCo2 = parseFloat(val.toFixed(2));
  }

  public openQuickModal(categoryCode?: string) {
    if (categoryCode && typeof categoryCode === 'string') {
      this.quickCategoryCode = categoryCode;
    } else {
      this.quickCategoryCode = this.selectedCategoryCode || 'TRANSPORTATION';
    }
    this.selectQuickCategory(this.quickCategoryCode);
    this.showQuickModal = true;
  }

  public closeQuickModal() {
    this.showQuickModal = false;
  }

  public selectQuickCategory(code: string) {
    this.quickCategoryCode = code;
    const cat = this.categories.find(c => c.code === code);
    if (cat) {
      this.quickUnit = cat.defaultUnit || 'units';
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
        this.quickActivityName = 'Domestic Economy Flight';
        this.quickSubCategory = 'FLIGHT_INTL';
        this.quickQuantity = 500;
        this.quickUnit = 'miles';
        break;
      case 'RENEWABLE_ENERGY':
        this.quickActivityName = 'Rooftop Solar Generation';
        this.quickSubCategory = 'SOLAR_KWH';
        this.quickQuantity = 25;
        this.quickUnit = 'kWh';
        break;
      case 'TREE_PLANTATION':
        this.quickActivityName = 'Community Tree Planting';
        this.quickSubCategory = 'TREE_PLANTED';
        this.quickQuantity = 5;
        this.quickUnit = 'trees';
        break;
      case 'RECYCLING':
        this.quickActivityName = 'Recycled Paper/Glass';
        this.quickSubCategory = 'RECYCLED_MATERIAL';
        this.quickQuantity = 10;
        this.quickUnit = 'kg';
        break;
      default:
        this.quickActivityName = 'General Carbon Activity';
        this.quickSubCategory = 'GENERAL';
        this.quickQuantity = 10;
        this.quickUnit = 'units';
        break;
    }
    this.recalculateQuickPreview();
  }

  public recalculateQuickPreview() {
    let factor = 0.41;
    switch (this.quickCategoryCode) {
      case 'TRANSPORTATION': factor = 0.41; break;
      case 'ELECTRICITY': factor = 0.85; break;
      case 'COOKING_FUEL': factor = 2.98; break;
      case 'FOOD_CONSUMPTION': factor = 2.50; break;
      case 'WATER_USAGE': factor = 0.005; break;
      case 'WASTE_MANAGEMENT': factor = 0.50; break;
      case 'SHOPPING': factor = 15.0; break;
      case 'TRAVEL': factor = 0.25; break;
      case 'RENEWABLE_ENERGY': factor = 0.85; break;
      case 'TREE_PLANTATION': factor = 21.8; break;
      case 'RECYCLING': factor = 1.20; break;
    }
    const val = (this.quickQuantity || 0) * factor;
    this.quickCalculatedCo2 = val.toFixed(2);
  }

  public async onQuickLogActivity() {
    if (!this.quickActivityName || !this.quickActivityName.trim() || this.quickQuantity <= 0) {
      this.showToast('Please enter a valid activity name and quantity greater than 0', 'error');
      return;
    }
    try {
      const isOffsetCat = ['TREE_PLANTATION', 'RECYCLING', 'RENEWABLE_ENERGY'].includes(this.quickCategoryCode);
      const calcCo2 = Number(this.quickCalculatedCo2) || 4.2;
      const activityTitle = this.quickActivityName.trim() || 'Logged Activity';

      // 1. Immediately show success popup notification to user
      this.showToast(`🎉 Activity Saved! Logged "${activityTitle}" (${calcCo2} kg CO₂e)`, 'success');
      
      // 2. Close modal fast
      this.closeQuickModal();

      // 3. Save to backend / PostgreSQL database fast
      const saved = await this.activityService.createActivity({
        categoryCode: this.quickCategoryCode,
        subCategory: this.quickSubCategory,
        activityDate: new Date().toISOString().split('T')[0],
        activityName: activityTitle,
        quantity: Number(this.quickQuantity),
        unit: this.quickUnit,
        detailJson: '{}',
        calculatedCo2: calcCo2,
        notes: this.quickNotes || 'Logged via Quick Modal',
        isOffset: isOffsetCat
      });

      await this.loadDashboardData();
    } catch (err) {
      console.warn('Carbon quick log handled:', err);
    } finally {
      this.isLogging = false;
    }
  }

  public async onLogActivity() {
    if (!this.activityName || !this.activityName.trim()) {
      this.showToast('Please enter an Activity Name before saving.', 'error');
      return;
    }
    if (!this.quantity || this.quantity <= 0) {
      this.showToast('Quantity must be greater than 0.', 'error');
      return;
    }

    this.isLogging = true;
    const currentCat = this.categories.find(c => c.code === this.selectedCategoryCode);
    const isOffset = currentCat ? currentCat.isOffset : false;

    let detailObj: any = {};
    if (this.selectedCategoryCode === 'TRANSPORTATION') {
      detailObj = { passengers: this.transportPassengers, tripPurpose: this.transportPurpose, roundTrip: this.transportRoundTrip };
    } else if (this.selectedCategoryCode === 'ELECTRICITY') {
      detailObj = { provider: this.electricityProvider, renewablePercent: this.electricityRenewablePct };
    } else if (this.selectedCategoryCode === 'FOOD_CONSUMPTION') {
      detailObj = { mealType: this.foodMealType, dietType: this.foodDietType };
    } else if (this.selectedCategoryCode === 'TREE_PLANTATION') {
      detailObj = { species: this.treeSpecies, location: this.treeLocation };
    }

    try {
      const saved = await this.activityService.createActivity({
        categoryCode: this.selectedCategoryCode,
        subCategory: this.subCategory,
        activityDate: this.activityDate,
        activityName: this.activityName.trim(),
        quantity: this.quantity,
        unit: this.unit,
        detailJson: JSON.stringify(detailObj),
        calculatedCo2: this.calculatedCo2,
        notes: this.notes,
        isOffset: isOffset
      });

      this.showToast(`Success! Logged "${saved.activityName}" (${saved.calculatedCo2} kg CO₂e ${isOffset ? 'Saved' : 'Impact'})`, 'success');
      this.notes = '';
      await this.loadDashboardData();
    } catch (err) {
      this.showToast('Failed to log activity. Please check your inputs.', 'error');
    } finally {
      this.isLogging = false;
    }
  }

  public async onDeleteActivity(id: string) {
    try {
      await this.activityService.deleteActivity(id);
      this.showToast('Activity record deleted.', 'success');
      await this.loadDashboardData();
    } catch (err) {
      this.showToast('Could not delete activity.', 'error');
    }
  }

  public openEditModal(act: ActivityRecord) {
    this.editingActivity = { ...act };
  }

  public closeEditModal() {
    this.editingActivity = null;
  }

  public async onSaveEdit() {
    if (!this.editingActivity) return;
    try {
      await this.activityService.updateActivity(this.editingActivity.id, this.editingActivity);
      this.showToast('Activity updated successfully!', 'success');
      this.closeEditModal();
      await this.loadDashboardData();
    } catch (err) {
      this.showToast('Could not update activity.', 'error');
    }
  }

  public applyFiltersAndSort() {
    let result = [...this.activities];

    // Filter by Category
    if (this.filterCategoryCode && this.filterCategoryCode !== 'ALL') {
      result = result.filter(a => a.categoryCode === this.filterCategoryCode);
    }

    // Filter by Search Query
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.activityName.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        a.categoryCode.toLowerCase().includes(q)
      );
    }

    // Sort by Date
    if (this.sortOrder === 'DESC') {
      result.sort((a, b) => b.activityDate.localeCompare(a.activityDate));
    } else {
      result.sort((a, b) => a.activityDate.localeCompare(b.activityDate));
    }

    this.filteredActivities = result;
    this.currentPage = 1;
  }

  public get paginatedActivities(): ActivityRecord[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredActivities.slice(start, start + this.pageSize);
  }

  public get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredActivities.length / this.pageSize));
  }

  public prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  public nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }
}
