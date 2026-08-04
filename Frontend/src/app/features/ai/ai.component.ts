import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from './ai.service';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.css']
})
export class AiComponent {
  private aiService = inject(AIService);

  public messages: Message[] = [
    { sender: 'ai', text: 'Hello! I am your Eco-AI Assistant. Ask me anything about reducing your carbon footprint, green options, or sustainability targets!', timestamp: '2:15 PM' }
  ];

  public chatInput = '';
  public isTyping = false;

  public promptSuggestions = [
    'How can I reduce my home electricity consumption?',
    'Is public transport better than driving an EV?',
    'Suggest a green alternative for plastic packaging.'
  ];

  public async onSendMessage(text?: string) {
    const messageText = text || this.chatInput.trim();
    if (!messageText) return;

    // Add user message
    this.messages.push({
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (!text) {
      this.chatInput = '';
    }

    this.isTyping = true;

    try {
      const reply = await this.aiService.analyzeEmissions({ prompt: messageText });
      this.isTyping = false;
      this.messages.push({
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      this.isTyping = false;
      let fallbackReply = "That's an excellent question! I am analyzing your daily carbon footprint trends. Small changes in habits can reduce emissions by up to 25% annually.";
      
      const query = messageText.toLowerCase();
      if (query.includes('electricity') || query.includes('home')) {
        fallbackReply = 'To reduce electricity consumption at home: \n• Switch to energy-star labeled heat pump appliances.\n• Unplug stand-by phantom loads (TVs, chargers).\n• Utilize smart thermostats to lower heating when not home.\n• This can save up to 450kg CO₂ annually.';
      } else if (query.includes('transport') || query.includes('ev') || query.includes('car')) {
        fallbackReply = 'Comparing public transport to EVs:\n• Electric Vehicles reduce lifecycle emissions by ~60% compared to petrol engines.\n• However, trains and buses remain the greenest choice, especially for dense commutes, yielding up to 85% emission reductions per passenger-mile.';
      } else if (query.includes('plastic') || query.includes('packaging')) {
        fallbackReply = 'Green alternatives for plastic packaging include:\n• Biodegradable mushroom packaging (mycelium).\n• Post-consumer recycled paperboard.\n• Beeswax wraps or reusable silicon pouches for food storage.\n• Composting organic waste helps divert greenhouse methane production.';
      }

      this.messages.push({
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }
}

