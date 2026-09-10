import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface UserProfile {
  id?: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  organization?: string;
  employeeId?: string;
  location?: string;
  profileImage?: string;
  role?: string;
  rewardPoints?: number;
  badgeName?: string;

  environmentalInterests?: string;
  sustainabilityPreferences?: string;
  personalGoals?: string;
  lifestyleConfig?: string;

  completionPercentage?: number;
  missingFields?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private get apiUrl(): string {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const runtimeUrl = (window as any).__env?.API_BASE_URL;
      if (runtimeUrl && runtimeUrl.trim()) {
        return `${runtimeUrl.trim().replace(/\/$/, '')}/users/profile`;
      }
      if (!isLocal) {
        return 'https://feisty-recreation-production-c4e5.up.railway.app/api/users/profile';
      }
    }
    return environment?.apiBaseUrl ? `${environment.apiBaseUrl}/users/profile` : 'http://localhost:8081/api/users/profile';
  }
  private readonly HTTP_TIMEOUT_MS = 2500;
  private storageKey = 'ecotrack_profile';

  private defaultFallbackProfile: UserProfile = {
    fullName: 'Alex Rivers',
    email: 'alex.rivers@ecotrack.org',
    phoneNumber: '+1 (555) 234-5678',
    dateOfBirth: '1995-06-15',
    gender: 'Prefer not to say',
    bio: 'Passionate sustainability advocate dedicated to zero waste and green transit.',
    organization: 'EcoTrack Platform Initiative',
    employeeId: 'ECO-9482',
    location: 'California, USA',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    role: 'Individual',
    rewardPoints: 1240,
    badgeName: 'Gold Achiever',
    environmentalInterests: 'Recycling,Green Transportation,Climate Action,Renewable Energy',
    sustainabilityPreferences: 'Renewable Energy,Recycling,Waste Reduction,Green Transportation',
    personalGoals: 'Reduce carbon footprint,Use public transportation,Reduce plastic usage,Save electricity',
    lifestyleConfig: JSON.stringify({
      commuteMode: 'transit',
      transitFrequency: 'daily',
      cyclingFrequency: 'weekly',
      vehicleOwnership: 'ev',
      energyPreference: 'renewable',
      renewableUsage: 'high',
      dietPreference: 'vegetarian',
      organicFoodFrequency: 'frequent',
      recyclingHabit: 'always',
      wasteReductionHabit: 'high',
      composting: 'active'
    }),
    completionPercentage: 83,
    missingFields: ['Employee ID verification']
  };

  public getStoredProfile(): UserProfile {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          // parse error
        }
      }
      // Check user session
      const userRaw = localStorage.getItem('ecotrack_user');
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw);
          const merged: UserProfile = {
            ...this.defaultFallbackProfile,
            fullName: userObj.fullName || userObj.name || this.defaultFallbackProfile.fullName,
            email: userObj.email || this.defaultFallbackProfile.email,
            profileImage: userObj.profileImage || this.defaultFallbackProfile.profileImage,
            location: userObj.location || this.defaultFallbackProfile.location
          };
          this.saveStoredProfile(merged);
          return merged;
        } catch {
          // parse error
        }
      }
    }
    return this.defaultFallbackProfile;
  }

  private saveStoredProfile(profile: UserProfile): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.storageKey, JSON.stringify(profile));
    }
  }

  public async getProfile(): Promise<UserProfile> {
    try {
      const res: any = await firstValueFrom(
        this.http.get(this.apiUrl).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        const stored = this.getStoredProfile();
        const merged: UserProfile = {
          ...stored,
          ...res.data,
          fullName: res.data.fullName || stored.fullName,
          email: res.data.email || stored.email,
          phoneNumber: res.data.phoneNumber || stored.phoneNumber,
          dateOfBirth: res.data.dateOfBirth || stored.dateOfBirth,
          gender: res.data.gender || stored.gender,
          bio: res.data.bio || stored.bio,
          organization: res.data.organization || stored.organization,
          employeeId: res.data.employeeId || stored.employeeId,
          location: res.data.location || stored.location,
          profileImage: res.data.profileImage || stored.profileImage,
          environmentalInterests: res.data.environmentalInterests || stored.environmentalInterests,
          sustainabilityPreferences: res.data.sustainabilityPreferences || stored.sustainabilityPreferences,
          personalGoals: res.data.personalGoals || stored.personalGoals,
          lifestyleConfig: res.data.lifestyleConfig || stored.lifestyleConfig,
          badgeName: res.data.badgeName || stored.badgeName,
          rewardPoints: res.data.rewardPoints !== undefined ? res.data.rewardPoints : stored.rewardPoints,
        };
        this.saveStoredProfile(merged);
        return merged;
      }
      return this.getStoredProfile();
    } catch (err) {
      console.warn('API getProfile failed or timed out (2s), using fallback profile:', err);
      return this.getStoredProfile();
    }
  }

  public async updateProfile(data: UserProfile): Promise<UserProfile> {
    try {
      const res: any = await firstValueFrom(
        this.http.put(this.apiUrl, data).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        this.saveStoredProfile(res.data);
        return res.data;
      }
      throw new Error('Invalid backend response');
    } catch (err) {
      console.warn('API updateProfile failed, saving locally:', err);
      const current = this.getStoredProfile();
      const updated = { ...current, ...data };
      this.saveStoredProfile(updated);
      return updated;
    }
  }

  public async updateProfilePicture(profileImage: string): Promise<UserProfile> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/picture`, { profileImage }).pipe(timeout(this.HTTP_TIMEOUT_MS))
      );
      if (res && res.success && res.data) {
        this.saveStoredProfile(res.data);
        return res.data;
      }
      throw new Error('Invalid backend response');
    } catch (err) {
      console.warn('API updateProfilePicture failed, saving locally:', err);
      const current = this.getStoredProfile();
      current.profileImage = profileImage;
      this.saveStoredProfile(current);
      return current;
    }
  }
}
