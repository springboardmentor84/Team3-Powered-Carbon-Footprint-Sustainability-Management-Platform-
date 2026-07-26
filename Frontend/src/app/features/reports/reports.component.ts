import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>Reports & Analytics</h1>
      <p style="color: var(--color-text-secondary);">Review your weekly footprint, compile data reports, and export to PDF/Excel.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>Reports dashboard coming soon</h3>
      </div>
    </div>
  `
})
export class ReportsComponent {}
