import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);

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
        this.isAuthenticated.set(true);
        this.currentUser.set(JSON.parse(user));
      }
    }
  }

  public login(email: any, password: any) {
    // Simulated network promise using standard JS
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          // Success case mock JWT payload
          const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenYash";
          const mockUser = {
            id: 1,
            name: "Yash",
            email: email,
            role: "Sustainability Lead"
          };

          localStorage.setItem('ecotrack_token', mockToken);
          localStorage.setItem('ecotrack_user', JSON.stringify(mockUser));
          
          this.isAuthenticated.set(true);
          this.currentUser.set(mockUser);
          
          resolve(mockUser);
        } else {
          reject("Please fill in all credentials.");
        }
      }, 1500);
    });
  }

  public logout() {
    localStorage.removeItem('ecotrack_token');
    localStorage.removeItem('ecotrack_user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}
