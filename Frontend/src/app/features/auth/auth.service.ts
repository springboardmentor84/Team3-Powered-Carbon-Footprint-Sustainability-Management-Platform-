import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);

  public get apiUrl(): string {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const runtimeUrl = (window as any).__env?.API_BASE_URL;
      if (runtimeUrl && runtimeUrl.trim()) {
        return `${runtimeUrl.trim().replace(/\/$/, '')}/users`;
      }
      if (!isLocal) {
        return 'https://feisty-recreation-production-c4e5.up.railway.app/api/users';
      }
    }
    return environment?.apiBaseUrl ? `${environment.apiBaseUrl}/users` : 'http://localhost:8081/api/users';
  }

  // Signals for tracking auth state reactively
  public isAuthenticated = signal(false);
  public currentUser = signal<any>(null);

  constructor() {
    this.checkSession();
  }

  private checkSession() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ecotrack_token');
      const user = localStorage.getItem('ecotrack_user');

      if (token && user) {
        try {
          const parsed = JSON.parse(user);
          this.isAuthenticated.set(true);
          this.currentUser.set(parsed);
          // Sync DB fields on session restore (background, does not block)
          this.syncProfileFromDatabase();
        } catch {
          this.isAuthenticated.set(false);
          this.currentUser.set(null);
        }
      }
    }
  }

  /**
   * Syncs non-image profile fields from the backend into the signal and localStorage.
   * profileImage is LOCAL-ONLY and is always preserved from the current local value.
   */
  public async syncProfileFromDatabase(): Promise<void> {
    try {
      const dbProfile = await this.getUserProfile();
      if (dbProfile && (dbProfile.email || dbProfile.fullName)) {
        const current = this.currentUser() || {};
        const updated = {
          ...current,
          id:                     dbProfile.id                     || current.id,
          name:                   dbProfile.fullName               || current.name     || current.fullName,
          fullName:               dbProfile.fullName               || current.fullName || current.name,
          email:                  dbProfile.email                  || current.email,
          role:                   dbProfile.role                   || current.role,
          rewardPoints:           dbProfile.rewardPoints           !== undefined ? dbProfile.rewardPoints           : current.rewardPoints,
          badgeName:              dbProfile.badgeName              || current.badgeName,
          location:               dbProfile.location               !== undefined ? dbProfile.location               : current.location,
          environmentalInterests: dbProfile.environmentalInterests !== undefined ? dbProfile.environmentalInterests : current.environmentalInterests,
          lifestyleConfig:        dbProfile.lifestyleConfig        !== undefined ? dbProfile.lifestyleConfig        : current.lifestyleConfig,
          // profileImage is local-only — always preserve what is in localStorage
          profileImage: current.profileImage || ''
        };
        localStorage.setItem('ecotrack_user', JSON.stringify(updated));
        this.currentUser.set(updated);
      }
    } catch {
      // Background sync — silently ignore network errors
    }
  }

  public async login(email: any, password: any): Promise<any> {
    if (!email || !password) {
      return Promise.reject('Please enter both your email and password.');
    }

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/login`, { email, password })
      );
      if (res && res.success && res.data) {
        const loginData = res.data;
        let resolvedName = loginData.fullName || loginData.name;
        if (!resolvedName) {
          resolvedName = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
        }

        const userObj = {
          id:                     loginData.id                     || 1,
          name:                   resolvedName,
          fullName:               resolvedName,
          email:                  loginData.email                  || email,
          userRole:               loginData.role                   || 'ROLE_USER',
          role:                   loginData.role                   || 'ROLE_USER',
          rewardPoints:           loginData.rewardPoints           !== undefined ? loginData.rewardPoints : 1240,
          badgeName:              loginData.badgeName              || 'Level 12 Explorer',
          location:               loginData.location               || '',
          environmentalInterests: loginData.environmentalInterests || '',
          lifestyleConfig:        loginData.lifestyleConfig        || '',
          profileImage:           '' // profileImage is local-only, not loaded from DB on login
        };

        localStorage.setItem('ecotrack_token', loginData.token);
        localStorage.setItem('ecotrack_user', JSON.stringify(userObj));
        this.isAuthenticated.set(true);
        this.currentUser.set(userObj);
        return userObj;
      } else {
        return Promise.reject(res?.message || 'Invalid credentials. Please check your email and password.');
      }
    } catch (err: any) {
      console.error('API login error:', err);
      const serverMsg = err?.error?.message;
      if (serverMsg) {
        if (serverMsg.toLowerCase().includes('not found')) {
          return Promise.reject('Invalid email. No account found with this email. Please provide a valid email or register first.');
        }
        if (serverMsg.toLowerCase().includes('password')) {
          return Promise.reject('Invalid password. Please check your password or reset it.');
        }
        return Promise.reject(serverMsg);
      }
      if (err?.status === 404) {
        return Promise.reject('Invalid email. No account found with this email. Please provide a valid email or register first.');
      }
      if (err?.status === 400 || err?.status === 401) {
        return Promise.reject('Invalid email or password. Please provide a valid email.');
      }
      return Promise.reject('Unable to connect to authentication server. Please check your connection.');
    }
  }

  public async googleLogin(payload: { idToken?: string; email?: string; name?: string; picture?: string }): Promise<any> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/google-login`, payload)
      );
      if (res && res.success && res.data) {
        const loginData = res.data;
        const resolvedName = loginData.fullName || loginData.name || payload.name || 'Eco User';
        const userObj = {
          id:                     loginData.id                     || 1,
          name:                   resolvedName,
          fullName:               resolvedName,
          email:                  loginData.email                  || payload.email || '',
          userRole:               loginData.role                   || 'ROLE_USER',
          role:                   loginData.role                   || 'ROLE_USER',
          rewardPoints:           loginData.rewardPoints           !== undefined ? loginData.rewardPoints : 100,
          badgeName:              loginData.badgeName              || 'Eco Pioneer',
          location:               loginData.location               || '',
          environmentalInterests: loginData.environmentalInterests || '',
          lifestyleConfig:        loginData.lifestyleConfig        || '',
          profileImage:           loginData.profileImage           || payload.picture || ''
        };

        localStorage.setItem('ecotrack_token', loginData.token);
        localStorage.setItem('ecotrack_user', JSON.stringify(userObj));
        this.isAuthenticated.set(true);
        this.currentUser.set(userObj);
        return userObj;
      } else {
        return Promise.reject(res?.message || 'Google Login failed on server.');
      }
    } catch (err: any) {
      console.error('API google-login error:', err);
      return Promise.reject('Google Login failed. Could not authenticate with server.');
    }
  }

  public async getGoogleClientId(): Promise<string> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/google-client-id`));
      if (res && res.success && res.data && res.data.clientId) {
        return res.data.clientId;
      }
    } catch (e) {
      console.warn('Could not fetch google client ID from backend:', e);
    }
    return '';
  }

  public async register(registerData: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    location?: string;
    environmentalInterests?: string;
    lifestyleConfig?: string;
  }): Promise<any> {
    const { fullName, email, password } = registerData;
    if (!fullName || !email || !password) {
      return Promise.reject('Please fill in all required fields.');
    }

    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/register`, registerData)
      );
      if (res && res.success) {
        return res.data || res;
      } else {
        return Promise.reject(res?.message || 'Registration failed.');
      }
    } catch (err: any) {
      console.error('API register error:', err);
      const serverMsg = err?.error?.message;
      if (serverMsg) {
        return Promise.reject(serverMsg);
      }
      if (err?.status === 400) {
        return Promise.reject('Registration failed. This email may already be registered.');
      }
      return Promise.reject('Registration failed. Please check your connection and try again.');
    }
  }

  public logout() {
    localStorage.removeItem('ecotrack_token');
    localStorage.removeItem('ecotrack_user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  public async getUserProfile(): Promise<any> {
    try {
      const res: any = await firstValueFrom(this.http.get(`${this.apiUrl}/profile`));
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('Failed to fetch profile from server:', err);
    }
    return this.currentUser();
  }

  /**
   * Saves profile fields to the backend database.
   * profileImage is intentionally excluded — it is stored in localStorage only.
   *
   * Step 1: Signal is updated IMMEDIATELY (before HTTP call) so navbar/sidebar
   *         reflect the new name instantly without any page navigation.
   * Step 2: HTTP PUT persists to DB — throws on failure so caller shows error toast.
   */
  public async updateUserProfile(payload: {
    fullName?: string;
    email?: string;
    location?: string;
    environmentalInterests?: string;
    lifestyleConfig?: string;
  }): Promise<any> {

    // Step 1: Optimistic local update — navbar/sidebar update INSTANTLY
    const current = this.currentUser() || {};
    const localMerge = {
      ...current,
      name:                   payload.fullName               !== undefined ? payload.fullName               : current.name,
      fullName:               payload.fullName               !== undefined ? payload.fullName               : current.fullName,
      email:                  payload.email                  !== undefined ? payload.email                  : current.email,
      location:               payload.location               !== undefined ? payload.location               : current.location,
      environmentalInterests: payload.environmentalInterests !== undefined ? payload.environmentalInterests : current.environmentalInterests,
      lifestyleConfig:        payload.lifestyleConfig        !== undefined ? payload.lifestyleConfig        : current.lifestyleConfig
      // profileImage is preserved from spread of ...current — not explicitly set here
    };
    localStorage.setItem('ecotrack_user', JSON.stringify(localMerge));
    this.currentUser.set(localMerge); // ← navbar/sidebar update instantly here

    // Step 2: Persist to backend (throws on HTTP error → caller shows error toast)
    const res: any = await firstValueFrom(this.http.put(`${this.apiUrl}/profile`, payload));
    if (res && res.success && res.data) {
      const dbUser = res.data;
      const mergedUser = {
        ...localMerge,
        id:                     dbUser.id                     ?? current.id,
        name:                   dbUser.fullName               || localMerge.name,
        fullName:               dbUser.fullName               || localMerge.fullName,
        email:                  dbUser.email                  || localMerge.email,
        location:               dbUser.location               !== undefined ? dbUser.location               : localMerge.location,
        environmentalInterests: dbUser.environmentalInterests !== undefined ? dbUser.environmentalInterests : localMerge.environmentalInterests,
        lifestyleConfig:        dbUser.lifestyleConfig        !== undefined ? dbUser.lifestyleConfig        : localMerge.lifestyleConfig,
        // Preserve local-only profileImage — never overwrite from DB response
        profileImage: current.profileImage || '',
        _savedToDb: true
      };
      localStorage.setItem('ecotrack_user', JSON.stringify(mergedUser));
      this.currentUser.set(mergedUser);
      return mergedUser;
    }

    // Backend responded but success=false — return optimistic local merge
    return localMerge;
  }
}
