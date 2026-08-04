import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ChallengeItem {
  id: number;
  title: string;
  category: string;
  description: string;
  points: number;
  completed: boolean;
  progress?: number;
  maxProgress?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChallengesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8081/api/challenges';

  private fallbackChallenges: ChallengeItem[] = [
    {
      id: 1,
      title: 'Zero-Emission Commute',
      category: 'transport',
      description: 'Commute by foot, bicycle, or public transit for 3 consecutive days.',
      points: 150,
      completed: false,
      progress: 2,
      maxProgress: 3
    },
    {
      id: 2,
      title: 'Plant-Powered Day',
      category: 'food',
      description: 'Log 3 vegetarian or vegan meals in a single day.',
      points: 100,
      completed: true,
      progress: 3,
      maxProgress: 3
    },
    {
      id: 3,
      title: 'Unplug Standby Devices',
      category: 'energy',
      description: 'Turn off or unplug electronics not in active use overnight.',
      points: 80,
      completed: false,
      progress: 1,
      maxProgress: 1
    },
    {
      id: 4,
      title: 'Zero Single-Use Plastic',
      category: 'waste',
      description: 'Use reusable bottles, bags, and coffee cups all week.',
      points: 200,
      completed: false,
      progress: 4,
      maxProgress: 7
    }
  ];

  public async getDailyChallenges(): Promise<ChallengeItem[]> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/daily`));
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return this.fallbackChallenges;
    } catch (err) {
      console.warn('API getDailyChallenges failed, using fallback challenges:', err);
      return this.fallbackChallenges;
    }
  }

  public async completeChallenge(id: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.apiUrl}/${id}/complete`, {}));
    } catch (err) {
      console.warn('API completeChallenge failed, marking locally:', err);
      const ch = this.fallbackChallenges.find(c => c.id === id);
      if (ch) {
        ch.completed = true;
        if (ch.maxProgress) ch.progress = ch.maxProgress;
      }
    }
  }
}
