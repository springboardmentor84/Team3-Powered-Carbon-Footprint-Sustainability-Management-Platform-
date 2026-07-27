import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>Community Challenges</h1>
      <p style="color: var(--color-text-secondary);">Join community challenges, view leaderboards, and earn badges.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Community Challenges coming soon</h3>
      </div>
    </div>
  `
})
export class ChallengesComponent {}
