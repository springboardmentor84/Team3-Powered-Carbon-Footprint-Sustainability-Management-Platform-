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

  private cachedGoals: Goal[] | null = null;

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
      this.cachedGoals = this.getLocalGoals();
    } else {
      this.cachedGoals = this.fallbackGoals;
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
    this.cachedGoals = goals;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify(goals));
    }
  }

  public async getGoals(): Promise<Goal[]> {
    // 1. Instantly return cached goals in 0ms if available
    if (this.cachedGoals && this.cachedGoals.length > 0) {
      // Trigger background sync non-blockingly
      this.syncBackgroundGoals();
      return this.enrichGoals(this.cachedGoals);
    }

    // 2. Fallback to local storage instant load
    const local = this.getLocalGoals();
    this.cachedGoals = local;
    this.syncBackgroundGoals();
    return this.enrichGoals(local);
  }

  private async syncBackgroundGoals(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.http.get(this.apiUrl).pipe(timeout(1500)));
      let goalsList: Goal[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        goalsList = res.data;
      } else if (Array.isArray(res)) {
        goalsList = res;
      }
      if (goalsList.length > 0) {
        this.saveLocalGoals(goalsList);
      }
    } catch {
      // Silent background catch - cached data is already displayed instantly
    }
  }

  public async createGoal(payload: Partial<Goal>): Promise<Goal> {
    const goals = this.cachedGoals ? [...this.cachedGoals] : this.getLocalGoals();
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

    // Instant local memory update (0ms)
    goals.unshift(newGoal);
    this.saveLocalGoals(goals);

    // Sync with backend fast
    try {
      const res: any = await firstValueFrom(this.http.post(this.apiUrl, payload).pipe(timeout(1500)));
      if (res && (res.success || res.id)) {
        const serverGoal = this.enrichGoal(res.data || res);
        // Replace temp id with server id if needed
        const idx = goals.findIndex(g => g.id === newGoal.id);
        if (idx !== -1) {
          goals[idx] = serverGoal;
          this.saveLocalGoals(goals);
        }
        return serverGoal;
      }
    } catch (err) {
      console.warn('API createGoal background sync handled:', err);
    }
    return this.enrichGoal(newGoal);
  }

  public async updateGoal(id: number | string, payload: Partial<Goal>): Promise<Goal> {
    const goals = this.cachedGoals ? [...this.cachedGoals] : this.getLocalGoals();
    const idx = goals.findIndex(g => g.id == id);
    let updatedGoal: Goal;

    if (idx !== -1) {
      const existing = goals[idx];
      const targetVal = payload.target !== undefined ? payload.target : existing.target;
      const currentVal = payload.current !== undefined ? payload.current : existing.current;
      updatedGoal = {
        ...existing,
        ...payload,
        target: targetVal,
        current: currentVal,
        status: currentVal >= targetVal ? 'Completed' : 'In Progress'
      };
      goals[idx] = updatedGoal;
      this.saveLocalGoals(goals);
    } else {
      updatedGoal = this.enrichGoal(payload as Goal);
    }

    try {
      await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, payload).pipe(timeout(1500)));
    } catch (err) {
      console.warn('API updateGoal background sync handled:', err);
    }
    return this.enrichGoal(updatedGoal);
  }

  public async deleteGoal(id: number | string): Promise<void> {
    let goals = this.cachedGoals ? [...this.cachedGoals] : this.getLocalGoals();
    goals = goals.filter(g => g.id != id);
    this.saveLocalGoals(goals);

    try {
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`).pipe(timeout(1500)));
    } catch (err) {
      console.warn('API deleteGoal background sync handled:', err);
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
