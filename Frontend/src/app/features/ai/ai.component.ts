import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from './ai.service';
import { ActivityService } from '../carbon/activity.service';
import { GoalService } from '../goals/goal.service';

/** Represents a single chat message in the conversation. */
interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

/** Holds the calculated score (0-100) for each sustainability category, matched to Dashboard logic. */
interface CategoryScore {
  code: string;
  name: string;
  score: number;
}

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.css']
})
export class AiComponent implements OnInit {
  private aiService       = inject(AIService);
  private activityService = inject(ActivityService);
  private goalService     = inject(GoalService);
  private cdr             = inject(ChangeDetectorRef);

  public messages: Message[] = [
    {
      sender: 'ai',
      text: 'Hello! I am your Eco-AI Assistant.\n\nI can see your live Sustainability Dashboard scores. Ask me about any category like Electricity, Water, Transportation, Waste, or ask how your score affects the earth!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  public chatInput  = '';
  public isTyping   = false;

  public overallScore   = 89;
  public categoryScores: CategoryScore[] = [];

  public promptSuggestions = [
    'What is my electricity score?',
    'Based on my score how much it affects the earth?',
    'How can I improve my water usage score?',
    'How to improve my transportation score?'
  ];

  async ngOnInit() {
    await this.loadLiveDashboardScores();
  }

  /**
   * Loads live category scores from user activity data using the exact same
   * formula as DashboardComponent.calculateSustainabilityTrackers().
   */
  public async loadLiveDashboardScores(): Promise<void> {
    try {
      const summary       = await this.activityService.getSummary();
      const allActivities = await this.activityService.getAllActivities();
      const goals         = await this.goalService.getGoals();

      // Build emission totals per category
      const emissionMap = new Map<string, number>();
      for (const act of allActivities) {
        emissionMap.set(act.categoryCode, (emissionMap.get(act.categoryCode) || 0) + (act.calculatedCo2 || 0));
      }

      // Goal Progress Score
      const totalGoals     = goals.length || 1;
      const completedGoals = goals.filter(g => g.status === 'Completed' || (g.progress && g.progress >= 100)).length;
      const avgProgress    = goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals;
      const goalScore      = Math.min(100, Math.max(50, Math.round((completedGoals / totalGoals) * 40 + avgProgress * 0.6)));

      // Category definitions — 12 items matching Dashboard exactly
      const categories = [
        { code: 'CARBON',           name: 'Carbon Footprint'     },
        { code: 'ELECTRICITY',      name: 'Energy (Electricity)' },
        { code: 'WATER_USAGE',      name: 'Water Usage'          },
        { code: 'WASTE_MANAGEMENT', name: 'Waste Management'     },
        { code: 'TRANSPORTATION',   name: 'Transportation'       },
        { code: 'TRAVEL',           name: 'Travel'               },
        { code: 'FOOD_CONSUMPTION', name: 'Food & Diet'          },
        { code: 'SHOPPING',         name: 'Shopping'             },
        { code: 'RECYCLING',        name: 'Recycling'            },
        { code: 'TREE_PLANTATION',  name: 'Tree Plantation'      },
        { code: 'RENEWABLE_ENERGY', name: 'Renewable Energy'     },
        { code: 'GOAL_PROGRESS',    name: 'Goal Progress'        }
      ];

      this.categoryScores = categories.map(cat => {
        let score: number;

        if (cat.code === 'GOAL_PROGRESS') {
          score = goalScore;
        } else if (['TREE_PLANTATION', 'RECYCLING', 'RENEWABLE_ENERGY'].includes(cat.code)) {
          const offset = emissionMap.get(cat.code) || 0;
          score = Math.min(100, Math.max(85, Math.round(85 + offset * 0.5)));
        } else if (cat.code === 'CARBON') {
          const net = summary.monthlyEmission || 100;
          score = Math.min(100, Math.max(40, Math.round(100 - (net / 200) * 20)));
        } else {
          const emission = emissionMap.get(cat.code) || 0;
          score = emission > 20
            ? Math.max(45, Math.round(85 - (emission - 20) * 0.8))
            : Math.min(100, Math.max(70, Math.round(85 + (20 - emission) * 0.5)));
        }

        return { code: cat.code, name: cat.name, score };
      });

      // Overall = average of all 12 category scores (matches Dashboard exactly)
      const sum = this.categoryScores.reduce((acc, c) => acc + c.score, 0);
      this.overallScore = Math.round(sum / this.categoryScores.length);

    } catch {
      this.overallScore = 89;
    }
  }

  /** Converts newline characters to HTML line breaks for display. */
  public formatMessage(text: string): string {
    return (text || '').replace(/\n/g, '<br>');
  }

  /**
   * Sends user message to Backend OpenAI API first.
   * Falls back instantly to the smart local engine if the backend is unavailable.
   */
  public async onSendMessage(text?: string) {
    const messageText = (text || this.chatInput).trim();
    if (!messageText) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.messages.push({ sender: 'user', text: messageText, timestamp: time });
    if (!text) this.chatInput = '';

    this.isTyping = true;
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    // Try live OpenAI API via backend
    try {
      const backendReply = await this.aiService.analyzeEmissions({ prompt: messageText });
      if (backendReply && !backendReply.includes('commuting transportation')) {
        this.pushAiMessage(backendReply);
        return;
      }
    } catch {
      // Fall through to instant local engine
    }

    // Instant local engine as fallback
    this.pushAiMessage(this.generateContextualResponse(messageText));
  }

  /** Adds an AI message to the chat and triggers change detection. */
  private pushAiMessage(text: string): void {
    this.isTyping = false;
    this.messages.push({
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /** Returns a category score object by code (e.g. 'ELECTRICITY'). */
  private getCategoryScore(code: string): CategoryScore | undefined {
    return this.categoryScores.find(c => c.code === code);
  }

  /** Returns a human-readable status label based on score. */
  private scoreStatus(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  }

  /** Returns true if the query includes any keyword from the provided list. */
  private matchesAny(query: string, keywords: string[]): boolean {
    return keywords.some(k => query.includes(k));
  }

  /**
   * Routes the user's message to the correct response builder based on detected intent.
   * Earth/environment impact is checked first to prevent it from being caught
   * by the generic score bucket.
   */
  private generateContextualResponse(prompt: string): string {
    const query = prompt.toLowerCase();

    if (this.matchesAny(query, ['earth', 'affect', 'impact', 'planet', 'global warming', 'climate', 'pollution', 'environment', 'atmosphere', 'greenhouse', 'nature', 'world', 'warming'])) {
      return this.buildEarthImpactResponse();
    }
    if (this.matchesAny(query, ['electricity', 'energy', 'kwh', 'power', 'bulb', 'appliance', 'grid'])) {
      return this.buildElectricityResponse();
    }
    if (this.matchesAny(query, ['water', 'litre', 'liter', 'shower', 'tap', 'consumption'])) {
      return this.buildWaterResponse();
    }
    if (this.matchesAny(query, ['transport', 'car', 'ev', 'commute', 'drive', 'bike', 'flight', 'petrol', 'fuel', 'vehicle'])) {
      return this.buildTransportResponse();
    }
    if (this.matchesAny(query, ['waste', 'trash', 'garbage', 'landfill', 'bin', 'plastic'])) {
      return this.buildWasteResponse();
    }
    if (this.matchesAny(query, ['food', 'diet', 'meat', 'vegan', 'meal', 'agriculture', 'dairy'])) {
      return this.buildFoodResponse();
    }
    if (this.matchesAny(query, ['recycle', 'tree', 'plant', 'solar', 'renewable', 'offset'])) {
      return this.buildOffsetResponse();
    }
    if (this.matchesAny(query, ['goal', 'target', 'progress', 'challenge', 'complete'])) {
      return this.buildGoalResponse();
    }
    if (this.matchesAny(query, ['score', 'overall', 'sustainability', 'carbon', 'footprint', 'reduce', 'emission', 'improve', 'rating'])) {
      return this.buildOverallScoreResponse();
    }
    if (this.matchesAny(query, ['hi', 'hello', 'hey', 'who are you', 'what are you'])) {
      return `Hello! I am your Eco-AI Assistant.\n\n` +
        `Your current Overall Sustainability Score is ${this.overallScore}/100.\n\n` +
        `Ask me about any category (Electricity, Water, Transportation, Waste, Food, Goals) or ask how your score affects the earth!`;
    }

    return this.buildGenericFallback();
  }

  // ─── Response Builders ───────────────────────────────────────────────────────

  /**
   * Earth and environmental impact response.
   * Explains how the user's current score translates into real-world effects
   * on global warming, air quality, and ecosystems.
   */
  private buildEarthImpactResponse(): string {
    const score   = this.overallScore;
    const weakest = this.categoryScores.length > 0
      ? [...this.categoryScores].sort((a, b) => a.score - b.score)[0]
      : null;

    let impactLevel: string;
    let co2Estimate: string;
    let context: string;

    if (score >= 80) {
      impactLevel = 'low';
      co2Estimate = 'approximately 2 to 4 tonnes of CO2 per year';
      context     = 'Your lifestyle has a relatively low environmental impact. You are contributing positively to reducing global carbon emissions.';
    } else if (score >= 60) {
      impactLevel = 'moderate';
      co2Estimate = 'approximately 5 to 8 tonnes of CO2 per year';
      context     = 'Your lifestyle has a moderate environmental impact. Small consistent changes can significantly reduce your contribution to global warming.';
    } else {
      impactLevel = 'high';
      co2Estimate = 'approximately 9 to 14 tonnes of CO2 per year';
      context     = 'Your current habits are contributing significantly to greenhouse gas emissions. Taking action now can make a meaningful difference.';
    }

    let response =
      `Your Overall Sustainability Score is ${score}/100, which indicates a ${impactLevel} environmental impact.\n\n` +
      `${context}\n\n` +
      `Estimated annual CO2 output based on your score: ${co2Estimate}.\n\n`;

    if (weakest) {
      response +=
        `Your weakest area is ${weakest.name} at ${weakest.score}/100. ` +
        `Improving this category will help you reduce your environmental impact in these ways:\n\n`;
    } else {
      response += `Here is how improving your score further protects the earth:\n\n`;
    }

    response +=
      `• Reducing electricity consumption lowers demand on fossil-fuel power plants, which directly prevents air pollution and reduces CO2 emissions that drive global warming and rising temperatures.\n` +
      `• Using public transit or walking reduces vehicle exhaust, which is a leading cause of urban air pollution and contributes to the greenhouse effect that warms the planet.\n` +
      `• Adopting a more plant-based diet reduces methane from livestock farming. Methane is 25 times more potent than CO2 as a greenhouse gas, so reducing it has an immediate effect on slowing atmospheric warming.\n` +
      `• Planting trees and recycling offsets carbon in the atmosphere. Trees absorb CO2 and restore the oxygen balance that sustains all life on earth. Recycling reduces energy used in manufacturing, cutting factory emissions.\n\n` +
      `Every point gained on your sustainability score represents a real reduction in harmful gases entering the atmosphere, a direct contribution to slowing climate change, and a positive impact on ecosystems and future generations.`;

    return response;
  }

  /** Electricity score response with environmental context. */
  private buildElectricityResponse(): string {
    const cat    = this.getCategoryScore('ELECTRICITY');
    const score  = cat?.score ?? 75;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Energy (Electricity) Score: ${score}/100 — ${status}\n\n` +
        `Your electricity usage is above the sustainable threshold. Here is how to reduce it and why it matters for the planet:\n\n` +
        `• Unplug standby devices such as TVs and chargers. This saves up to 10% on monthly consumption. Less electricity drawn from the grid means fewer fossil fuels burned at power stations, directly reducing air pollution and the CO2 emissions that cause global warming.\n` +
        `• Switch all bulbs to LED lighting. LEDs use 75% less energy than incandescent bulbs. Lower electricity demand prevents hundreds of kilograms of CO2 from entering the atmosphere each year.\n` +
        `• Set your thermostat 2 degrees lower when you are away from home. Heating and cooling account for nearly 40% of home energy use. Reducing it keeps excess greenhouse gases out of the atmosphere.\n` +
        `• Log electricity saving activities in the Carbon Tracker. Each action recorded raises your score and contributes to a measurable reduction in grid-level carbon output.\n\n` +
        `Improving your electricity habits can raise your score above 80/100 and prevent an estimated 300 to 600 kg of CO2 from entering the atmosphere each year.`;
    }

    return `Your Energy (Electricity) Score: ${score}/100 — ${status}\n\n` +
      `Your electricity habits are excellent. You are already preventing significant CO2 emissions. To go further:\n\n` +
      `• Consider installing solar panels. Generating your own renewable energy eliminates grid dependency and produces zero operational emissions, protecting air quality and the climate.\n` +
      `• Continue monitoring your monthly kWh usage in the Carbon Tracker to sustain your high score.`;
  }

  /** Water usage response with environmental context. */
  private buildWaterResponse(): string {
    const cat    = this.getCategoryScore('WATER_USAGE');
    const score  = cat?.score ?? 60;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Water Usage Score: ${score}/100 — ${status}\n\n` +
        `Reducing water consumption has a direct impact on the environment and on your score. Here is what you can do:\n\n` +
        `• Install aerated faucet heads to save up to 120 litres of water daily. Water treatment and pumping consume large amounts of energy, so using less water also reduces electricity demand and its associated CO2 emissions.\n` +
        `• Fix leaking taps immediately. A single dripping tap wastes up to 15 litres per day and depletes freshwater reserves that aquatic ecosystems depend on.\n` +
        `• Take 5-minute showers instead of baths, which reduces personal water use by up to 70 litres per wash.\n` +
        `• Log water conservation activities in the Carbon Tracker to see your Water score rise.\n\n` +
        `Freshwater scarcity affects 40% of the global population. Every litre you save helps preserve this vital resource for both people and nature, and reduces the energy burden of water treatment systems.`;
    }

    return `Your Water Usage Score: ${score}/100 — ${status}\n\n` +
      `Your water management is excellent. You are actively conserving freshwater and reducing the energy needed for water treatment, which in turn lowers CO2 emissions. Keep logging activities to maintain this score.`;
  }

  /** Transportation response with environmental context. */
  private buildTransportResponse(): string {
    const cat    = this.getCategoryScore('TRANSPORTATION');
    const score  = cat?.score ?? 85;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Transportation Score: ${score}/100 — ${status}\n\n` +
        `Transportation is one of the largest contributors to air pollution and climate change. Here is how to improve your score and reduce your impact on the earth:\n\n` +
        `• Switch 2 days a week to public transit. Buses and trains carry many passengers per trip, reducing individual emissions by up to 85% per person. This directly prevents nitrogen dioxide and particulate matter pollution, which causes respiratory disease and smog.\n` +
        `• Consider carpooling to share the fuel emissions among passengers. This removes additional cars from the road and reduces both traffic congestion and air pollution levels.\n` +
        `• Walk or cycle for trips under 5 km. Zero-emission travel keeps your local air clean and avoids adding exhaust gases to the atmosphere.\n` +
        `• Log every green transit choice in the Carbon Tracker. Each entry raises your Transportation score and documents a real reduction in prevented emissions.\n\n` +
        `Improving your transportation habits can reduce your personal CO2 output by 1 to 2 tonnes per year and meaningfully cut your contribution to urban air pollution and global warming.`;
    }

    return `Your Transportation Score: ${score}/100 — ${status}\n\n` +
      `Your transportation habits are excellent. You are actively reducing your contribution to road emissions and air pollution. Continue logging trips in the Carbon Tracker to maintain your high score.`;
  }

  /** Waste management response with environmental context. */
  private buildWasteResponse(): string {
    const cat    = this.getCategoryScore('WASTE_MANAGEMENT');
    const score  = cat?.score ?? 72;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Waste Management Score: ${score}/100 — ${status}\n\n` +
        `Waste sent to landfills releases methane as organic matter decomposes. Methane is 25 times more potent than CO2 as a greenhouse gas. Here is how to improve your score and protect the earth:\n\n` +
        `• Compost organic kitchen waste. Diverting food scraps from landfills stops methane generation at the source and produces nutrient-rich soil that supports plant growth and biodiversity.\n` +
        `• Recycle paper, plastic, and glass separately. Manufacturing from recycled materials uses significantly less energy than raw production, reducing factory emissions and protecting forests from destructive extraction.\n` +
        `• Buy products with minimal packaging. Excess packaging ends up in landfills or oceans, harming marine ecosystems and releasing toxins into soil and water.\n` +
        `• Log waste reduction activities in the Carbon Tracker to raise your score and track your environmental contribution.\n\n` +
        `By improving your waste habits, you prevent methane emissions, conserve natural resources, and help protect soil, ocean health, and biodiversity.`;
    }

    return `Your Waste Management Score: ${score}/100 — ${status}\n\n` +
      `Your waste habits are excellent. You are actively preventing methane emissions and conserving resources. Continue composting and recycling to keep your score high.`;
  }

  /** Food and diet response with environmental context. */
  private buildFoodResponse(): string {
    const cat    = this.getCategoryScore('FOOD_CONSUMPTION');
    const score  = cat?.score ?? 78;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Food & Diet Score: ${score}/100 — ${status}\n\n` +
        `Food production accounts for approximately 26% of global greenhouse gas emissions. Here is how to reduce your food-related carbon footprint and improve your score:\n\n` +
        `• Adopt Meatless Mondays. Livestock farming produces methane through digestion and land-use changes. Reducing red meat consumption by even one day per week cuts agricultural methane impact by approximately 24%, directly helping to slow global warming.\n` +
        `• Choose locally sourced produce. Food transported over long distances burns significant fuel. Buying local reduces transport emissions and supports regional biodiversity.\n` +
        `• Plan meals to reduce food waste. Food wasted in landfills contributes to methane emissions. Meal planning can cut household food waste by up to 25%.\n` +
        `• Log plant-based meals in the Carbon Tracker. Each meal logged raises your Food score and documents a real reduction in agricultural emissions.\n\n` +
        `A shift in diet is one of the most impactful individual actions to reduce global warming. Small, consistent changes add up to significant environmental results over time.`;
    }

    return `Your Food & Diet Score: ${score}/100 — ${status}\n\n` +
      `Your dietary choices are sustainable and have a positive environmental impact. Your plant-focused habits help reduce methane and CO2 emissions from agriculture. Keep logging meals in the Carbon Tracker.`;
  }

  /** Green offset categories response — recycling, tree plantation, renewable energy. */
  private buildOffsetResponse(): string {
    const recycling = this.getCategoryScore('RECYCLING');
    const tree      = this.getCategoryScore('TREE_PLANTATION');
    const renewable = this.getCategoryScore('RENEWABLE_ENERGY');

    return `Your Green Offset Scores:\n\n` +
      `• Recycling: ${recycling?.score ?? 85}/100\n` +
      `• Tree Plantation: ${tree?.score ?? 85}/100\n` +
      `• Renewable Energy: ${renewable?.score ?? 85}/100\n\n` +
      `These categories directly offset your carbon footprint and benefit the earth in concrete ways:\n\n` +
      `• Planting trees — each tree absorbs approximately 22 kg of CO2 annually and releases oxygen that supports all life. Trees also prevent soil erosion, regulate local temperatures, and provide habitat for wildlife.\n` +
      `• Recycling — reduces the need for raw material extraction, cutting factory emissions and preserving forests and mineral ecosystems from destructive mining.\n` +
      `• Renewable energy — solar and wind power generate zero operational emissions. Every kilowatt-hour from a renewable source replaces one generated by burning coal or gas, directly reducing air pollution and slowing climate change.\n\n` +
      `Log all offset activities in the Carbon Tracker to raise these scores and increase your measurable contribution to a healthier planet.`;
  }

  /** Goal progress response. */
  private buildGoalResponse(): string {
    const cat    = this.getCategoryScore('GOAL_PROGRESS');
    const score  = cat?.score ?? 80;
    const status = this.scoreStatus(score);

    if (score < 80) {
      return `Your Goal Progress Score: ${score}/100 — ${status}\n\n` +
        `Completing sustainability goals is the fastest way to raise your overall score and make a real-world difference. Steps to improve:\n\n` +
        `• Go to the Goals tab and complete your active weekly targets.\n` +
        `• Each completed goal adds up to +40 points to your overall sustainability score.\n` +
        `• Set realistic, measurable targets — for example, reduce car trips by 3 this week or choose plant-based dinners twice a week.\n\n` +
        `Every goal you complete translates into a direct action that reduces emissions, lowers pollution, and contributes to a measurable improvement in your environmental footprint.`;
    }

    return `Your Goal Progress Score: ${score}/100 — ${status}\n\n` +
      `You are consistently completing your sustainability goals. Each completed goal represents a real positive action for the environment. To go further:\n\n` +
      `• Set more ambitious goals in the Goals tab — for example, target a 50% reduction in car trips this month.\n` +
      `• Each goal completed directly links to reduced air pollution, lower CO2 emissions, and a healthier planet.`;
  }

  /** Overall sustainability score improvement response. */
  private buildOverallScoreResponse(): string {
    const score   = this.overallScore;
    const target  = Math.min(100, score + 10);
    const weakest = this.categoryScores.length > 0
      ? [...this.categoryScores].sort((a, b) => a.score - b.score)[0]
      : null;

    return `Your Overall Sustainability Score: ${score}/100\n\n` +
      (weakest
        ? `Your weakest category is ${weakest.name} at ${weakest.score}/100. Focusing here will have the greatest impact on both your score and the environment.\n\n`
        : '') +
      `To raise your score to ${target}/100:\n\n` +
      `1. Switch 2 days a week to public transit or carpooling — reduces transport emissions, one of the biggest contributors to air pollution and global warming.\n` +
      `2. Lower your home thermostat by 2 degrees and switch to LED lighting — reduces electricity demand, cutting CO2 released by power plants.\n` +
      `3. Compost kitchen waste and recycle daily — prevents methane generation from landfills and reduces energy used in raw material production.\n` +
      `4. Complete active sustainability goals in the Goals tab — each completed goal is a direct, recorded contribution to reducing your carbon footprint.`;
  }

  /** Generic fallback when no clear intent is matched. */
  private buildGenericFallback(): string {
    const weakest = this.categoryScores.length > 0
      ? [...this.categoryScores].sort((a, b) => a.score - b.score)[0]
      : null;

    return `Based on your live dashboard, your Overall Sustainability Score is ${this.overallScore}/100.\n\n` +
      (weakest
        ? `Your lowest scoring category is ${weakest.name} at ${weakest.score}/100. Ask me about ${weakest.name} for specific tips to improve your score and reduce your environmental impact.`
        : `Ask me about Electricity, Water, Transportation, Waste, Food, Goal Progress, or ask how your score affects the earth for personalised recommendations.`);
  }
}
