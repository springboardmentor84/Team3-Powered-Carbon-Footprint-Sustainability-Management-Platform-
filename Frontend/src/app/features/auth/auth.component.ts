import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout flex-center fade-in-section">
      <div class="eco-card glass-panel auth-card">
        <div class="auth-header">
          <i class="bi bi-leaf-fill brand-icon"></i>
          <h2>EcoTrack</h2>
        </div>
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      width: 100vw;
      background-color: var(--color-background);
      padding: 24px;
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 40px 32px;
      text-align: center;
    }
    .auth-header {
      margin-bottom: 32px;
    }
    .brand-icon {
      color: var(--color-primary);
      font-size: 2.5rem;
      display: inline-block;
      margin-bottom: 8px;
    }
  `]
})
export class AuthComponent {}
