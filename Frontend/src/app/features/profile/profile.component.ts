import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>User Profile & Preferences</h1>
      <p style="color: var(--color-text-secondary);">Manage account details, avatar images, tracking preferences, and interests.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Profile settings coming soon</h3>
      </div>
    </div>
  `
})
export class ProfileComponent {}
