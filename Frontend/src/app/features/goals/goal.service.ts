import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface Goal {
  id: number | string;
  type: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  timeframe: 'weekly' | 'monthly' | 'yearly';
  status: 'In Progress' | 'Completed';
  startDate?: string;
  endDate?: string;
  progress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/goals';
  private storageKey = 'ecotrack_goals';

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFutureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  private fallbackGoals: Goal[] = [
    { id: 1, type: 'emissions', title: 'Reduce Carbon Emissions', target: 50, current: 32, unit: 'kg', timeframe: 'weekly', status: 'In Progress', startDate: this.getTodayStr(), endDate: this.getFutureDateStr(30) },
    { id: 2, type: 'electricity', title: 'Reduce Electricity Consumption', target: 200, current: 150, unit: 'kWh', timeframe: 'monthly', status: 'In Progress', startDate: this.getTodayStr(), endDate: this.getFutureDateStr(30) },
    { id: 3, type: 'trees', title: 'Plant Trees', target: 5, current: 3, unit: 'trees', timeframe: 'yearly', status: 'In Progress', startDate: this.getTodayStr(), endDate: this.getFutureDateStr(90) },
    { id: 4, type: 'transit', title: 'Use Public Transport', target: 5, current: 5, unit: 'trips', timeframe: 'weekly', status: 'Completed', startDate: this.getTodayStr(), endDate: this.getFutureDateStr(7) }
  ];

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!localStorage.getItem(this.storageKey)) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.fallbackGoals));
      }
    }
  }

  private getLocalGoals(): Goal[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : this.fallbackGoals;
    }
    return this.fallbackGoals;
  }

  private saveLocalGoals(goals: Goal[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify(goals));
    }
  }

  public async getGoals(): Promise<Goal[]> {
    try {
      const res: any = await firstValueFrom(this.http.get(this.apiUrl).pipe(timeout(2000)));
      let goalsList: Goal[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        goalsList = res.data;
      } else if (Array.isArray(res)) {
        goalsList = res;
      } else {
        goalsList = this.getLocalGoals();
      }
      return this.enrichGoals(goalsList);
    } catch (err) {
      console.warn('API getGoals failed, using localStorage fallback:', err);
      return this.enrichGoals(this.getLocalGoals());
    }
  }

  public async createGoal(payload: Partial<Goal>): Promise<Goal> {
    try {
      const res: any = await firstValueFrom(this.http.post(this.apiUrl, payload).pipe(timeout(2000)));
      if (res && (res.success || res.id)) {
        return this.enrichGoal(res.data || res);
      }
      throw new Error('API createGoal response invalid');
    } catch (err) {
      console.warn('API createGoal failed, saving in localStorage fallback:', err);
      const goals = this.getLocalGoals();
      const targetVal = payload.target || 10;
      const currentVal = payload.current || 0;
      const newGoal: Goal = {
        id: Date.now(),
        type: payload.type || 'emissions',
        title: payload.title || 'Reduce Carbon Footprint',
        target: targetVal,
        current: currentVal,
        unit: payload.unit || 'kg',
        timeframe: payload.timeframe || 'weekly',
        status: currentVal >= targetVal ? 'Completed' : 'In Progress',
        startDate: payload.startDate || this.getTodayStr(),
        endDate: payload.endDate || this.getFutureDateStr(30)
      };
      goals.unshift(newGoal);
      this.saveLocalGoals(goals);
      return this.enrichGoal(newGoal);
    }
  }

  public async updateGoal(id: number | string, payload: Partial<Goal>): Promise<Goal> {
    try {
      const res: any = await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, payload).pipe(timeout(2000)));
      if (res && (res.success || res.id)) {
        return this.enrichGoal(res.data || res);
      }
      throw new Error('API updateGoal response invalid');
    } catch (err) {
      console.warn('API updateGoal failed, updating in localStorage fallback:', err);
      const goals = this.getLocalGoals();
      const idx = goals.findIndex(g => g.id == id);
      if (idx !== -1) {
        const existing = goals[idx];
        const targetVal = payload.target !== undefined ? payload.target : existing.target;
        const currentVal = payload.current !== undefined ? payload.current : existing.current;
        const updated: Goal = {
          ...existing,
          ...payload,
          target: targetVal,
          current: currentVal,
          status: currentVal >= targetVal ? 'Completed' : 'In Progress'
        };
        goals[idx] = updated;
        this.saveLocalGoals(goals);
        return this.enrichGoal(updated);
      }
      throw err;
    }
  }

  public async deleteGoal(id: number | string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`).pipe(timeout(2000)));
    } catch (err) {
      console.warn('API deleteGoal failed, deleting from localStorage fallback:', err);
      let goals = this.getLocalGoals();
      goals = goals.filter(g => g.id != id);
      this.saveLocalGoals(goals);
    }
  }

  private enrichGoals(goals: Goal[]): Goal[] {
    return goals.map(g => this.enrichGoal(g));
  }

  private enrichGoal(goal: Goal): Goal {
    const target = goal.target || 1;
    const current = goal.current || 0;
    const pct = Math.min(100, Math.round((current / target) * 100));
    return {
      ...goal,
      progress: pct,
      status: current >= target ? 'Completed' : 'In Progress',
      startDate: goal.startDate || this.getTodayStr(),
      endDate: goal.endDate || this.getFutureDateStr(30)
    };
  }
}
