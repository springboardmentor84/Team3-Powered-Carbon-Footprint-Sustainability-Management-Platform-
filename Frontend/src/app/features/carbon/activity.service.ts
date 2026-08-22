import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface ActivityCategory {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  defaultUnit: string;
  isOffset: boolean;
}

export interface ActivityRecord {
  id: string;
  userId?: number;
  categoryCode: string;
  subCategory?: string;
  activityDate: string;
  activityName: string;
  quantity: number;
  unit: string;
  detailJson?: string;
  calculatedCo2: number;
  emissionFactorUsed?: number;
  notes?: string;
  isOffset: boolean;
  createdAt?: string;
}

export interface CarbonSummary {
  todayEmission: number;
  monthlyEmission: number;
  yearlyEmission: number;
  totalOffsets: number;
  netCarbonScore: number;
  categoryBreakdown: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/activities';

  private fallbackCategories: ActivityCategory[] = [
    { id: 1, code: 'TRANSPORTATION', name: 'Transportation', description: 'Commute, trips, and vehicle usage', icon: 'bi-car-front', defaultUnit: 'miles', isOffset: false },
    { id: 2, code: 'ELECTRICITY', name: 'Electricity', description: 'Home or office electrical consumption', icon: 'bi-lightning-charge', defaultUnit: 'kWh', isOffset: false },
    { id: 3, code: 'COOKING_FUEL', name: 'Cooking Fuel', description: 'LPG, PNG, electric stoves, and biogas', icon: 'bi-fire', defaultUnit: 'kg', isOffset: false },
    { id: 4, code: 'FOOD_CONSUMPTION', name: 'Food Consumption', description: 'Meals, dietary impact, and groceries', icon: 'bi-egg-fried', defaultUnit: 'meals', isOffset: false },
    { id: 5, code: 'WATER_USAGE', name: 'Water Usage', description: 'Laundry, dish washing, showers, gardening', icon: 'bi-droplet', defaultUnit: 'litres', isOffset: false },
    { id: 6, code: 'WASTE_MANAGEMENT', name: 'Waste Management', description: 'Plastic, paper, glass, and E-waste', icon: 'bi-trash3', defaultUnit: 'kg', isOffset: false },
    { id: 7, code: 'SHOPPING', name: 'Shopping', description: 'Electronics, clothing, furniture, books', icon: 'bi-bag-check', defaultUnit: 'items', isOffset: false },
    { id: 8, code: 'TRAVEL', name: 'Travel', description: 'Flights, hotels, trains, and cabs', icon: 'bi-airplane', defaultUnit: 'miles', isOffset: false },
    { id: 9, code: 'TREE_PLANTATION', name: 'Tree Plantation', description: 'Trees planted and reforestation initiatives', icon: 'bi-tree', defaultUnit: 'trees', isOffset: true },
    { id: 10, code: 'RECYCLING', name: 'Recycling', description: 'Recycled materials and waste diversion', icon: 'bi-recycle', defaultUnit: 'kg', isOffset: true },
    { id: 11, code: 'RENEWABLE_ENERGY', name: 'Renewable Energy', description: 'Solar, wind, and green electricity', icon: 'bi-sun', defaultUnit: 'kWh', isOffset: true }
  ];

  private fallbackActivities: ActivityRecord[] = [
    {
      id: 'a1',
      categoryCode: 'TRANSPORTATION',
      subCategory: 'CAR_PETROL',
      activityDate: new Date().toISOString().split('T')[0],
      activityName: 'Commute to office (Sedan)',
      quantity: 14,
      unit: 'miles',
      detailJson: '{"passengers":1,"tripPurpose":"Work","roundTrip":true}',
      calculatedCo2: 4.90,
      emissionFactorUsed: 0.35,
      notes: 'Daily office commute',
      isOffset: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'a2',
      categoryCode: 'ELECTRICITY',
      subCategory: 'GRID_POWER',
      activityDate: new Date().toISOString().split('T')[0],
      activityName: 'Home Electricity Usage',
      quantity: 12,
      unit: 'kWh',
      detailJson: '{"provider":"Local Grid","renewablesPercent":10}',
      calculatedCo2: 4.68,
      emissionFactorUsed: 0.39,
      notes: 'Air conditioning and computers',
      isOffset: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'a3',
      categoryCode: 'TREE_PLANTATION',
      subCategory: 'TREE_PLANTED',
      activityDate: new Date().toISOString().split('T')[0],
      activityName: 'Planted Oak Sapling',
      quantity: 2,
      unit: 'trees',
      detailJson: '{"species":"Oak","location":"Community Park"}',
      calculatedCo2: 44.00,
      emissionFactorUsed: 22.00,
      notes: 'Weekend community plantation drive',
      isOffset: true,
      createdAt: new Date().toISOString()
    }
  ];

  public getFallbackActivities(): ActivityRecord[] {
    return [...this.fallbackActivities];
  }

  private cachedActivities: ActivityRecord[] | null = null;

  public async getCategories(): Promise<ActivityCategory[]> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/categories`).pipe(timeout(1500)));
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return this.fallbackCategories;
    } catch (err) {
      return this.fallbackCategories;
    }
  }

  public async getSummary(): Promise<CarbonSummary> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/summary/carbon`).pipe(timeout(1500)));
      if (res && res.success && res.data) {
        return res.data;
      }
      return this.calculateLocalSummary();
    } catch (err) {
      return this.calculateLocalSummary();
    }
  }

  public async getAllActivities(): Promise<ActivityRecord[]> {
    if (this.cachedActivities && this.cachedActivities.length > 0) {
      this.syncBackgroundActivities();
      return this.cachedActivities;
    }

    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/all`).pipe(timeout(1500)));
      if (res && res.success && Array.isArray(res.data)) {
        this.cachedActivities = res.data;
        return res.data;
      }
      this.cachedActivities = this.fallbackActivities;
      return this.fallbackActivities;
    } catch (err) {
      this.cachedActivities = this.fallbackActivities;
      return this.fallbackActivities;
    }
  }

  private async syncBackgroundActivities(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/all`).pipe(timeout(1500)));
      if (res && res.success && Array.isArray(res.data)) {
        this.cachedActivities = res.data;
      }
    } catch {
      // Silent background refresh
    }
  }

  public async createActivity(payload: Partial<ActivityRecord>): Promise<ActivityRecord> {
    try {
      const res: any = await firstValueFrom(this.http.post(this.apiUrl, payload));
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('API createActivity response invalid');
    } catch (err) {
      console.warn('API createActivity failed, saving locally:', err);
      let factor = 0.35;
      if (payload.categoryCode === 'ELECTRICITY') factor = 0.39;
      else if (payload.categoryCode === 'COOKING_FUEL') factor = 2.05;
      else if (payload.categoryCode === 'FOOD_CONSUMPTION') factor = 1.80;
      else if (payload.categoryCode === 'WATER_USAGE') factor = 0.01;
      else if (payload.categoryCode === 'WASTE_MANAGEMENT') factor = 1.50;
      else if (payload.categoryCode === 'SHOPPING') factor = 15.0;
      else if (payload.categoryCode === 'TRAVEL') factor = 25.0;
      else if (payload.categoryCode === 'TREE_PLANTATION') factor = 22.0;
      else if (payload.categoryCode === 'RECYCLING') factor = 1.50;
      else if (payload.categoryCode === 'RENEWABLE_ENERGY') factor = 0.35;

      const qty = payload.quantity || 1;
      const co2 = parseFloat((qty * factor).toFixed(2));

      const isOff = payload.categoryCode === 'TREE_PLANTATION' || payload.categoryCode === 'RECYCLING' || payload.categoryCode === 'RENEWABLE_ENERGY' || Boolean(payload.isOffset);

      const localRecord: ActivityRecord = {
        id: 'local-' + Date.now(),
        categoryCode: payload.categoryCode || 'TRANSPORTATION',
        subCategory: payload.subCategory || 'GENERAL',
        activityDate: payload.activityDate || new Date().toISOString().split('T')[0],
        activityName: payload.activityName || 'Logged Activity',
        quantity: qty,
        unit: payload.unit || 'units',
        detailJson: payload.detailJson || '{}',
        calculatedCo2: co2,
        emissionFactorUsed: factor,
        notes: payload.notes || '',
        isOffset: isOff,
        createdAt: new Date().toISOString()
      };

      this.fallbackActivities.unshift(localRecord);
      return localRecord;
    }
  }

  public async updateActivity(id: string, payload: Partial<ActivityRecord>): Promise<ActivityRecord> {
    try {
      const res: any = await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, payload));
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('API updateActivity response invalid');
    } catch (err) {
      console.warn('API updateActivity failed, updating locally:', err);
      const idx = this.fallbackActivities.findIndex(a => a.id === id);
      if (idx !== -1) {
        const existing = this.fallbackActivities[idx];
        const updated: ActivityRecord = {
          ...existing,
          ...payload,
          id: existing.id
        };
        this.fallbackActivities[idx] = updated;
        return updated;
      }
      throw err;
    }
  }

  public async deleteActivity(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    } catch (err) {
      console.warn('API deleteActivity failed, deleting locally:', err);
      this.fallbackActivities = this.fallbackActivities.filter(a => a.id !== id);
    }
  }

  private calculateLocalSummary(): CarbonSummary {
    const todayStr = new Date().toISOString().split('T')[0];
    let today = 0;
    let monthly = 0;
    let yearly = 0;
    let offsets = 0;
    const breakdown: { [key: string]: number } = {};

    for (const a of this.fallbackActivities) {
      if (a.isOffset) {
        offsets += a.calculatedCo2;
      } else {
        if (a.activityDate === todayStr) today += a.calculatedCo2;
        monthly += a.calculatedCo2;
        yearly += a.calculatedCo2;

        const cur = breakdown[a.categoryCode] || 0;
        breakdown[a.categoryCode] = parseFloat((cur + a.calculatedCo2).toFixed(2));
      }
    }

    let score = 85;
    if (monthly > 200) score -= 15;
    else if (monthly < 100) score += 10;
    if (offsets > 0) score += 5;
    score = Math.min(100, Math.max(0, score));

    return {
      todayEmission: parseFloat(today.toFixed(2)),
      monthlyEmission: parseFloat(monthly.toFixed(2)),
      yearlyEmission: parseFloat(yearly.toFixed(2)),
      totalOffsets: parseFloat(offsets.toFixed(2)),
      netCarbonScore: score,
      categoryBreakdown: breakdown
    };
  }
}
