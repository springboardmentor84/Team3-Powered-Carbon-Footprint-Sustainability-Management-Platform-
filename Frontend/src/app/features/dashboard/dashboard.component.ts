import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <div class="dashboard-header">
        <h1>Welcome back, Yash</h1>
        <p class="subtitle text-secondary">Here is your carbon footprint analytics overview for today.</p>
      </div>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Dashboard Feature Coming Soon</h3>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      margin-bottom: 24px;
    }
    .subtitle {
      font-size: 1rem;
      color: var(--color-text-secondary);
    }
  `]
})
export class DashboardComponent {}
