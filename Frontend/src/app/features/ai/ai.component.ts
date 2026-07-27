import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fade-in-section">
      <h1>AI Recommendations & Assistant</h1>
      <p style="color: var(--color-text-secondary);">Interact with the AI Assistant to optimize energy levels and carbon savings.</p>
      <div class="eco-card eco-card-hover" style="margin-top: 24px;">
        <h3>AI Assistant coming soon</h3>
       
      </div>
    </div>
  `
})
export class AiComponent {}
