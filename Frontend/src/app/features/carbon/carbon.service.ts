import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface CarbonEmissionRecord {
  id?: number;
  userId?: number;
  transportationEmission: number;
  electricityEmission: number;
  foodEmission: number;
  wasteEmission: number;
  totalEmission?: number;
  createdAt?: string;
  category?: string;
  detail?: string;
  unit?: string;
  amount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarbonService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/emissions';

  // Demo fallback logs in case backend is offline
  private fallbackLogs: CarbonEmissionRecord[] = [
    {
      id: 101,
      transportationEmission: 4.2,
      electricityEmission: 0,
      foodEmission: 0,
      wasteEmission: 0,
      totalEmission: 4.2,
      createdAt: '2026-07-27T08:30:00',
      category: 'transport',
      detail: 'Commute to office (Sedan, Petrol)',
      amount: 12,
      unit: 'miles'
    },
    {
      id: 102,
      transportationEmission: 0,
      electricityEmission: 0,
      foodEmission: 0.8,
      wasteEmission: 0,
      totalEmission: 0.8,
      createdAt: '2026-07-27T13:15:00',
      category: 'food',
      detail: 'Vegetarian meals (3 meals)',
      amount: 3,
      unit: 'meals'
    },
    {
      id: 103,
      transportationEmission: 0,
      electricityEmission: 5.8,
      foodEmission: 0,
      wasteEmission: 0,
      totalEmission: 5.8,
      createdAt: '2026-07-26T18:00:00',
      category: 'energy',
      detail: 'Electricity usage (Grid average)',
      amount: 15,
      unit: 'kWh'
    }
  ];

  public async getAllEmissions(): Promise<CarbonEmissionRecord[]> {
    try {
      const res: any = await firstValueFrom(this.http.get(this.apiUrl));
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item: any) => this.mapBackendToUI(item));
      }
      return this.fallbackLogs;
    } catch (err) {
      console.warn('API getAllEmissions failed, using fallback logs:', err);
      return this.fallbackLogs;
    }
  }

  public async addEmission(payload: {
    transportationEmission: number;
    electricityEmission: number;
    foodEmission: number;
    wasteEmission: number;
    category?: string;
    detail?: string;
    amount?: number;
    unit?: string;
  }): Promise<CarbonEmissionRecord> {
    try {
      const res: any = await firstValueFrom(this.http.post(this.apiUrl, {
        transportationEmission: payload.transportationEmission,
        electricityEmission: payload.electricityEmission,
        foodEmission: payload.foodEmission,
        wasteEmission: payload.wasteEmission
      }));
      if (res && res.success && res.data) {
        const record = this.mapBackendToUI(res.data);
        record.category = payload.category || record.category;
        record.detail = payload.detail || record.detail;
        record.amount = payload.amount || record.amount;
        record.unit = payload.unit || record.unit;
        return record;
      }
      throw new Error('Failed to save emission');
    } catch (err) {
      console.warn('API addEmission failed, saving locally:', err);
      const total = payload.transportationEmission + payload.electricityEmission + payload.foodEmission + payload.wasteEmission;
      const localRecord: CarbonEmissionRecord = {
        id: Date.now(),
        transportationEmission: payload.transportationEmission,
        electricityEmission: payload.electricityEmission,
        foodEmission: payload.foodEmission,
        wasteEmission: payload.wasteEmission,
        totalEmission: parseFloat(total.toFixed(2)),
        createdAt: new Date().toISOString(),
        category: payload.category || 'transport',
        detail: payload.detail || 'Logged activity',
        amount: payload.amount || 1,
        unit: payload.unit || 'unit'
      };
      this.fallbackLogs.unshift(localRecord);
      return localRecord;
    }
  }

  public async deleteEmission(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    } catch (err) {
      console.warn('API deleteEmission failed, removing locally:', err);
      this.fallbackLogs = this.fallbackLogs.filter(log => log.id !== id);
    }
  }

  private mapBackendToUI(item: any): CarbonEmissionRecord {
    // Determine category based on which emission is highest
    let category = 'transport';
    let detail = 'Transportation Emission';
    let amount = item.transportationEmission || 0;
    let unit = 'kg';

    if (item.electricityEmission > item.transportationEmission) {
      category = 'energy';
      detail = 'Electricity & Heating';
      amount = item.electricityEmission;
    } else if (item.foodEmission > item.transportationEmission && item.foodEmission > item.electricityEmission) {
      category = 'food';
      detail = 'Dietary Footprint';
      amount = item.foodEmission;
    } else if (item.wasteEmission > 0 && item.wasteEmission > item.transportationEmission) {
      category = 'waste';
      detail = 'Waste Generation';
      amount = item.wasteEmission;
    }

    return {
      id: item.id,
      userId: item.userId,
      transportationEmission: item.transportationEmission || 0,
      electricityEmission: item.electricityEmission || 0,
      foodEmission: item.foodEmission || 0,
      wasteEmission: item.wasteEmission || 0,
      totalEmission: item.totalEmission || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      category,
      detail,
      amount: parseFloat(Number(amount).toFixed(1)),
      unit
    };
  }
}
