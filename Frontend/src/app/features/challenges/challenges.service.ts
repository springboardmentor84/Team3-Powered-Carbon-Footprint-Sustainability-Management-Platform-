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

  // Creator context
  creatorName?: string;
  createdByUserId?: number;
  isCreatedByCurrentUser?: boolean;
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
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
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
      joined: false,
      currentProgress: 0,
      status: 'Not Started',
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

  private getUserStorageKey(baseKey: string): string {
    if (typeof window === 'undefined') return baseKey;
    try {
      const userRaw = localStorage.getItem('ecotrack_user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user && (user.id || user.email)) {
          return `${baseKey}_${user.id || user.email}`;
        }
      }
    } catch {}
    return `${baseKey}_anonymous`;
  }

  private getJoinedMap(): Record<number, { joined: boolean; currentProgress: number; status: string }> {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(this.getUserStorageKey('ecotrack_joined_map'));
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  public saveJoinedMap(map: Record<number, { joined: boolean; currentProgress: number; status: string }>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getUserStorageKey('ecotrack_joined_map'), JSON.stringify(map));
    }
  }

  public markChallengeJoinedInMap(id: number, progress: number = 0, status: string = 'In Progress'): void {
    const map = this.getJoinedMap();
    map[id] = { joined: true, currentProgress: progress, status };
    this.saveJoinedMap(map);
  }

  public mergeWithJoinedMap(challenges: Challenge[]): Challenge[] {
    const map = this.getJoinedMap();
    return challenges.map(ch => {
      const entry = map[ch.id];
      if (entry) {
        return {
          ...ch,
          joined: true,
          currentProgress: entry.currentProgress !== undefined ? entry.currentProgress : (ch.currentProgress || 0),
          status: (entry.status || ch.status || 'In Progress' as any)
        };
      }
      return ch;
    });
  }

  public getCachedChallenges(): Challenge[] {
    return this.getStoredChallenges();
  }

  public getCachedLeaderboard(): LeaderboardUser[] {
    if (typeof window === 'undefined') return this.sortLeaderboard(this.defaultFallbackLeaderboard);
    const raw = localStorage.getItem('ecotrack_leaderboard');
    if (!raw) {
      return this.sortLeaderboard(this.defaultFallbackLeaderboard);
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.sortLeaderboard(this.defaultFallbackLeaderboard);
    }
  }

  private saveStoredLeaderboard(list: LeaderboardUser[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecotrack_leaderboard', JSON.stringify(list));
    }
  }

  private getStoredChallenges(): Challenge[] {
    if (typeof window === 'undefined') return this.defaultFallbackChallenges;
    const raw = localStorage.getItem(this.getUserStorageKey('ecotrack_challenges'));
    if (!raw) {
      return this.mergeWithJoinedMap(this.defaultFallbackChallenges);
    }
    try {
      const parsed: Challenge[] = JSON.parse(raw);
      return this.mergeWithJoinedMap(parsed);
    } catch {
      return this.mergeWithJoinedMap(this.defaultFallbackChallenges);
    }
  }

  public saveStoredChallenges(challenges: Challenge[]): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getUserStorageKey('ecotrack_challenges'), JSON.stringify(challenges));
    }
  }

  public async getChallenges(): Promise<Challenge[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(this.apiUrl).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const merged = this.mergeWithJoinedMap(res.data);
        const map = this.getJoinedMap();
        merged.forEach(c => {
          if (c.joined) {
            map[c.id] = { joined: true, currentProgress: c.currentProgress || 0, status: c.status || 'In Progress' };
          }
        });
        this.saveJoinedMap(map);
        this.saveStoredChallenges(merged);
        return merged;
      }
      return this.getStoredChallenges();
    } catch (err) {
      return this.getStoredChallenges();
    }
  }

  public async createChallenge(data: Partial<Challenge>): Promise<Challenge> {
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

    // Save locally first for 0ms lag
    list.unshift(newChallenge);
    this.saveStoredChallenges(list);

    try {
      const res: any = await firstValueFrom(
        this.http.post(this.apiUrl, data).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        const updatedList = this.getStoredChallenges();
        const idx = updatedList.findIndex(c => c.id === newId);
        if (idx !== -1) {
          updatedList[idx] = { ...newChallenge, ...res.data };
          this.saveStoredChallenges(updatedList);
        }
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend API createChallenge synced locally:`, err);
    }
    return newChallenge;
  }

  public async updateChallenge(id: number, data: Partial<Challenge>): Promise<Challenge> {
    const list = this.getStoredChallenges();
    const idx = list.findIndex(c => c.id === id);
    let updatedCh = list[idx] || (data as Challenge);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      this.saveStoredChallenges(list);
      updatedCh = list[idx];
    }

    try {
      const res: any = await firstValueFrom(
        this.http.put(`${this.apiUrl}/${id}`, data).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend API updateChallenge synced locally:`, err);
    }
    return updatedCh;
  }

  public async deleteChallenge(id: number): Promise<void> {
    let list = this.getStoredChallenges();
    list = list.filter(c => c.id !== id);
    this.saveStoredChallenges(list);

    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/${id}`).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
    } catch (err) {
      console.warn(`Backend API deleteChallenge synced locally:`, err);
    }
  }

  public async joinChallenge(id: number): Promise<Challenge> {
    this.markChallengeJoinedInMap(id, 0, 'In Progress');
    const list = this.getStoredChallenges();
    const ch = list.find(c => c.id === id);
    if (ch) {
      ch.joined = true;
      ch.status = 'In Progress';
      ch.currentProgress = ch.currentProgress || 0;
      ch.participantCount = (ch.participantCount || 0) + 1;
      this.saveStoredChallenges(list);
    }

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/${id}/join`, {}).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend API joinChallenge synced locally:`, err);
    }
    return ch || ({} as Challenge);
  }

  public async updateProgress(id: number, currentProgress: number): Promise<Challenge> {
    const list = this.getStoredChallenges();
    const ch = list.find(c => c.id === id);
    let finalStatus = 'In Progress';

    if (ch) {
      ch.currentProgress = currentProgress;
      const target = ch.targetValue || 1;

      if (currentProgress >= target && ch.status !== 'Completed') {
        ch.status = 'Completed';
        finalStatus = 'Completed';
        const lb = this.getCachedLeaderboard();
        const userLb = lb.find(u => u.isCurrentUser);
        if (userLb) {
          userLb.rewardPoints += ch.rewardPoints;
          userLb.challengesCompleted = (userLb.challengesCompleted || 0) + 1;
          this.saveStoredLeaderboard(this.sortLeaderboard(lb));
        }
      } else if (currentProgress > 0 && ch.status !== 'Completed') {
        ch.status = 'In Progress';
        finalStatus = 'In Progress';
      }
      this.saveStoredChallenges(list);
    }

    this.markChallengeJoinedInMap(id, currentProgress, finalStatus);

    try {
      const res: any = await firstValueFrom(
        this.http.put(`${this.apiUrl}/${id}/progress`, { currentProgress }).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`Backend API updateProgress synced locally:`, err);
    }
    return ch || ({} as Challenge);
  }

  public async getLeaderboard(): Promise<LeaderboardUser[]> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(`${this.apiUrl}/leaderboard`).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sorted = this.sortLeaderboard(res.data);
        this.saveStoredLeaderboard(sorted);
        return sorted;
      }
      return this.getCachedLeaderboard();
    } catch (err) {
      return this.getCachedLeaderboard();
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
