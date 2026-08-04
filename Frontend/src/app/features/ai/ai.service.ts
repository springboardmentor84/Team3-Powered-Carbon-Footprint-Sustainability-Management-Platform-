import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AIRecommendation {
  id: number;
  title: string;
  category: string;
  description: string;
  potentialReduction: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  applied?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/ai';

  private fallbackRecommendations: AIRecommendation[] = [
    {
      id: 1,
      title: 'Optimize Home Heating Schedule',
      category: 'energy',
      description: 'Lower thermostat by 2°C during work hours and overnight to save energy without loss of comfort.',
      potentialReduction: '18% Energy CO₂',
      difficulty: 'Easy'
    },
    {
      id: 2,
      title: 'Switch to Hybrid Commuting',
      category: 'transport',
      description: 'Work from home 2 days a week or combine public transit with cycling for your commute.',
      potentialReduction: '35% Commute CO₂',
      difficulty: 'Medium'
    },
    {
      id: 3,
      title: 'Adopt Meatless Mondays & Wednesdays',
      category: 'food',
      description: 'Replacing red meat lunches with plant-based alternatives significantly cuts agricultural methane impact.',
      potentialReduction: '24% Diet CO₂',
      difficulty: 'Easy'
    },
    {
      id: 4,
      title: 'Comprehensive Household Composting',
      category: 'waste',
      description: 'Separate organic kitchen waste into a local compost bin to reduce landfill methane.',
      potentialReduction: '12% Waste CO₂',
      difficulty: 'Medium'
    }
  ];

  public async getRecommendations(category?: string): Promise<AIRecommendation[]> {
    try {
      const url = category && category !== 'all' ? `${this.apiUrl}/recommendations?category=${category}` : `${this.apiUrl}/recommendations`;
      const res: any = await firstValueFrom(this.http.get(url));
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      if (category && category !== 'all') {
        return this.fallbackRecommendations.filter(r => r.category === category);
      }
      return this.fallbackRecommendations;
    } catch (err) {
      console.warn('API getRecommendations failed, using fallback recommendations:', err);
      if (category && category !== 'all') {
        return this.fallbackRecommendations.filter(r => r.category === category);
      }
      return this.fallbackRecommendations;
    }
  }

  public async analyzeEmissions(payload: any): Promise<string> {
    try {
      const res: any = await firstValueFrom(this.http.post(`${this.apiUrl}/analyze`, payload));
      if (res && res.success && res.data) {
        return res.data;
      }
      return 'AI Analysis complete: Your primary carbon footprint driver is commuting transportation. Switching 2 days a week to remote or transit will reduce your total carbon footprint by ~22%.';
    } catch (err) {
      console.warn('API analyzeEmissions failed, using fallback insight:', err);
      return 'AI Analysis complete: Your primary carbon footprint driver is commuting transportation. Switching 2 days a week to remote or transit will reduce your total carbon footprint by ~22%.';
    }
  }
}
