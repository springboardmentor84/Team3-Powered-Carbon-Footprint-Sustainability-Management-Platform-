import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>Sustainability Goals</h1>
      <p style="color: var(--color-text-secondary);">Set carbon limits, track progress bars, and check achievements timeline.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Goal Management coming soon</h3>
      </div>
    </div>
  `
})
export class GoalsComponent {}
