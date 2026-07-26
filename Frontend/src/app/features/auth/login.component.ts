import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-placeholder">
      <h3>Login coming soon</h3>
      <p style="color: var(--color-text-secondary); margin-bottom: 24px;">This is a placeholder for Phase 2 (Authentication).</p>
      <button class="eco-badge eco-badge-primary" style="cursor: pointer; border: none; font-size: 0.85rem;" onclick="location.href='/dashboard'">
        Bypass Login (Go to Dashboard)
      </button>
    </div>
  `
})
export class LoginComponent {}
