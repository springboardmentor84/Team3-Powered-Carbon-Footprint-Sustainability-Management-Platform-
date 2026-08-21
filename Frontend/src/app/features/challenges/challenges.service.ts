import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

export interface Challenge {
  id: number;
  title: string;
  category: string;
  description: string;
  targetValue: number;
  unit: string;
  rewardPoints: number;
  badgeName?: string;
  startDate?: string;
  endDate?: string;
  rules?: string;
  active?: boolean;

  // User context
  joined?: boolean;
  currentProgress?: number;
  status?: 'Not Started' | 'In Progress' | 'Completed' | 'Expired';
  participantCount?: number;
}

export interface LeaderboardUser {
  rank: number;
  userId?: number;
  fullName: string;
  rewardPoints: number;
  badgeName: string;
  challengesCompleted: number;
  isCurrentUser?: boolean;
  profileImage?: string;
  hasImageError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChallengesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/challenges';
  private readonly HTTP_TIMEOUT_MS = 2000; // Strict 2-second HTTP timeout

  private defaultFallbackChallenges: Challenge[] = [
    {
      id: 1,
      title: 'Plastic-Free Week',
      category: 'PLASTIC_FREE_WEEK',
      description: 'Reduce single-use plastic for 7 consecutive days. Avoid plastic bottles, bags, and packaging.',
      targetValue: 7,
      unit: 'days',
      rewardPoints: 100,
      badgeName: 'Plastic Fighter',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      rules: 'Avoid single-use plastic bags, use reusable water bottles, and purchase unpackaged fresh produce.',
      joined: true,
      currentProgress: 4,
      status: 'In Progress',
      participantCount: 42
    },
    {
      id: 2,
      title: 'Cycle to Work',
      category: 'CYCLE_TO_WORK',
      description: 'Swap your car or motorized vehicle for a bicycle for at least 5 commute trips.',
      targetValue: 5,
      unit: 'trips',
      rewardPoints: 150,
      badgeName: 'Pedal Power',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      rules: 'Track your cycling commute trips. Walking or public transport can count towards non-motorized travel.',
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
      participantCount: 28
    },
    {
      id: 3,
      title: 'Energy Saving Challenge',
      category: 'ENERGY_SAVING',
      description: 'Reduce household electricity consumption by 20 kWh this week by turning off unused appliances.',
      targetValue: 20,
      unit: 'kWh',
      rewardPoints: 120,
      badgeName: 'Grid Saver',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      rules: 'Unplug standby electronics, switch to LED lighting, and minimize air conditioning usage.',
      joined: true,
      currentProgress: 20,
      status: 'Completed',
      participantCount: 65
    },
    {
      id: 4,
      title: 'Tree Plantation Drive',
      category: 'TREE_PLANTATION',
      description: 'Plant trees in your local community or support reforestation initiatives.',
      targetValue: 5,
      unit: 'trees',
      rewardPoints: 200,
      badgeName: 'Forest Guardian',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      rules: 'Plant saplings in community parks, gardens, or participate in authorized local planting drives.',
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
      participantCount: 112
    },
    {
      id: 5,
      title: 'Water Conservation Week',
      category: 'WATER_CONSERVATION',
      description: 'Practice water-saving habits daily for 7 days to preserve freshwater resources.',
      targetValue: 7,
      unit: 'days',
      rewardPoints: 100,
      badgeName: 'Hydro Hero',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      rules: 'Take shorter showers, fix leaking taps, and reuse greywater for garden plants.',
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
      participantCount: 19
    },
    {
      id: 6,
      title: 'Zero Waste Challenge',
      category: 'ZERO_WASTE',
      description: 'Divert at least 10 kg of waste from landfills through composting and recycling.',
      targetValue: 10,
      unit: 'kg',
      rewardPoints: 180,
      badgeName: 'Zero Waster',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      rules: 'Separate organic waste for compost, clean dry recyclables, and avoid landfill trash.',
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
      participantCount: 34
    }
  ];

  private defaultFallbackLeaderboard: LeaderboardUser[] = [
    { rank: 1, fullName: 'Sarah Jenkins', rewardPoints: 2450, badgeName: 'Platinum', challengesCompleted: 14, isCurrentUser: false, profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop' },
    { rank: 2, fullName: 'Alex Rivers', rewardPoints: 1840, badgeName: 'Gold', challengesCompleted: 10, isCurrentUser: false, profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop' },
    { rank: 3, fullName: 'Michael Torres', rewardPoints: 1250, badgeName: 'Gold', challengesCompleted: 7, isCurrentUser: false, profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop' },
    { rank: 4, fullName: 'Priya Sharma', rewardPoints: 980, badgeName: 'Silver', challengesCompleted: 5, isCurrentUser: false, profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop' },
    { rank: 5, fullName: 'You (Current User)', rewardPoints: 720, badgeName: 'Silver', challengesCompleted: 4, isCurrentUser: true }
  ];

  private getStoredChallenges(): Challenge[] {
    const raw = localStorage.getItem('ecotrack_challenges');
    if (!raw) {
      localStorage.setItem('ecotrack_challenges', JSON.stringify(this.defaultFallbackChallenges));
      return this.defaultFallbackChallenges;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.defaultFallbackChallenges;
    }
  }

  private saveStoredChallenges(challenges: Challenge[]): void {
    localStorage.setItem('ecotrack_challenges', JSON.stringify(challenges));
  }

  public async getChallenges(): Promise<Challenge[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(this.apiUrl).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        this.saveStoredChallenges(res.data);
        return res.data;
      }
      return this.getStoredChallenges();
    } catch (err) {
      console.warn(`API getChallenges timed out or failed (2s limit), using instant fallback:`, err);
      return this.getStoredChallenges();
    }
  }

  public async createChallenge(data: Partial<Challenge>): Promise<Challenge> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(this.apiUrl, data).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('Invalid backend response');
    } catch (err) {
      console.warn(`API createChallenge timed out or failed (2s limit), creating locally:`, err);
      const list = this.getStoredChallenges();
      const newId = Date.now();
      const newChallenge: Challenge = {
        id: newId,
        title: data.title || 'New Sustainability Challenge',
        category: data.category || 'PLASTIC_FREE_WEEK',
        description: data.description || 'Challenge description',
        targetValue: data.targetValue || 7,
        unit: data.unit || 'days',
        rewardPoints: data.rewardPoints || 100,
        badgeName: 'Eco Defender',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        rules: data.rules || 'Follow eco guidelines.',
        active: true,
        joined: false,
        currentProgress: 0,
        status: 'Not Started',
        participantCount: 1
      };
      list.unshift(newChallenge);
      this.saveStoredChallenges(list);
      return newChallenge;
    }
  }

  public async updateChallenge(id: number, data: Partial<Challenge>): Promise<Challenge> {
    try {
      const res: any = await firstValueFrom(
        this.http.put(`${this.apiUrl}/${id}`, data).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('Invalid backend response');
    } catch (err) {
      console.warn(`API updateChallenge timed out or failed (2s limit), updating locally:`, err);
      const list = this.getStoredChallenges();
      const idx = list.findIndex(c => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        this.saveStoredChallenges(list);
        return list[idx];
      }
      throw err;
    }
  }

  public async deleteChallenge(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${id}`).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
    } catch (err) {
      console.warn(`API deleteChallenge timed out or failed (2s limit), deleting locally:`, err);
      let list = this.getStoredChallenges();
      list = list.filter(c => c.id !== id);
      this.saveStoredChallenges(list);
    }
  }

  public async joinChallenge(id: number): Promise<Challenge> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/${id}/join`, {}).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('Invalid response');
    } catch (err) {
      console.warn(`API joinChallenge timed out or failed (2s limit), marking locally:`, err);
      const list = this.getStoredChallenges();
      const ch = list.find(c => c.id === id);
      if (ch) {
        ch.joined = true;
        ch.status = 'In Progress';
        ch.currentProgress = 0;
        ch.participantCount = (ch.participantCount || 0) + 1;
        this.saveStoredChallenges(list);
        return ch;
      }
      throw err;
    }
  }

  public async updateProgress(id: number, currentProgress: number): Promise<Challenge> {
    try {
      const res: any = await firstValueFrom(
        this.http.put(`${this.apiUrl}/${id}/progress`, { currentProgress }).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
      throw new Error('Invalid response');
    } catch (err) {
      console.warn(`API updateProgress timed out or failed (2s limit), updating locally:`, err);
      const list = this.getStoredChallenges();
      const ch = list.find(c => c.id === id);
      if (ch) {
        ch.currentProgress = currentProgress;
        const target = ch.targetValue || 1;

        if (currentProgress >= target && ch.status !== 'Completed') {
          ch.status = 'Completed';
          const lb = this.defaultFallbackLeaderboard.find(u => u.isCurrentUser);
          if (lb) {
            lb.rewardPoints += ch.rewardPoints;
            lb.challengesCompleted += 1;
          }
        } else if (currentProgress > 0) {
          ch.status = 'In Progress';
        }
        this.saveStoredChallenges(list);
        return ch;
      }
      throw err;
    }
  }

  public async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/leaderboard`).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return this.sortLeaderboard(this.defaultFallbackLeaderboard);
    } catch (err) {
      console.warn(`API getLeaderboard timed out or failed (2s limit), using fallback leaderboard:`, err);
      return this.sortLeaderboard(this.defaultFallbackLeaderboard);
    }
  }

  private sortLeaderboard(list: LeaderboardUser[]): LeaderboardUser[] {
    const sorted = [...list].sort((a, b) => b.rewardPoints - a.rewardPoints);
    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }
}
