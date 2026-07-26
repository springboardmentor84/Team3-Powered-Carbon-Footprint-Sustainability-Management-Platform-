import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-carbon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>Carbon Footprint Tracking</h1>
      <p style="color: var(--color-text-secondary);">Log your transportation, energy usage, food consumption, and calculate emissions.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Carbon Tracking coming soon</h3>
      </div>
    </div>
  `
})
export class CarbonComponent {}
