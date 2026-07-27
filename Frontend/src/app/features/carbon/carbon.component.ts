import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ActivityLog {
  category: string;
  detail: string;
  amount: number;
  unit: string;
  emissions: number;
  date: string;
}

@Component({
  selector: 'app-carbon',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carbon.component.html',
  styleUrls: ['./carbon.component.css']
})
export class CarbonComponent {
  public selectedCategory = 'transport';

  // Calculator inputs
  public transportType = 'car-petrol';
  public distance = 0;

  public electricityKwh = 0;
  public heatingGas = 0;

  public dietMeals = 1;
  public dietType = 'meat';

  public wasteBags = 0;
  public wasteRecycleRate = 50;

  // Real-time calculation result
  public calculatedEmissions = 0;

  // History log
  public activityLogs: ActivityLog[] = [
    { category: 'transport', detail: 'Commute to office (Sedan, Petrol)', amount: 12, unit: 'miles', emissions: 4.2, date: '2026-07-27' },
    { category: 'food', detail: 'Vegetarian meals (3 meals)', amount: 3, unit: 'meals', emissions: 0.8, date: '2026-07-27' },
    { category: 'energy', detail: 'Electricity usage (Grid average)', amount: 15, unit: 'kWh', emissions: 5.8, date: '2026-07-26' }
  ];

  public setCategory(cat: string) {
    this.selectedCategory = cat;
    this.calculateCurrent();
  }

  public calculateCurrent() {
    let result = 0;
    if (this.selectedCategory === 'transport') {
      const factor = this.transportType === 'car-petrol' ? 0.35 : this.transportType === 'car-ev' ? 0.12 : 0.08; // kg per mile
      result = this.distance * factor;
    } else if (this.selectedCategory === 'energy') {
      result = (this.electricityKwh * 0.39) + (this.heatingGas * 0.18); // kg per kWh / unit
    } else if (this.selectedCategory === 'food') {
      const mealFactor = this.dietType === 'meat' ? 2.5 : this.dietType === 'vegetarian' ? 0.8 : 0.3; // kg per meal
      result = this.dietMeals * mealFactor;
    } else if (this.selectedCategory === 'waste') {
      // 1 bag = 15kg waste. Recycle rate reduces impact
      const baseEmissions = this.wasteBags * 2.1;
      result = baseEmissions * (1 - this.wasteRecycleRate / 100);
    }
    this.calculatedEmissions = parseFloat(result.toFixed(2));
  }

  public onLogActivity() {
    if (this.calculatedEmissions <= 0) return;

    let detail = '';
    let amount = 0;
    let unit = '';

    if (this.selectedCategory === 'transport') {
      detail = `Commute by ${this.transportType.replace('-', ' ')}`;
      amount = this.distance;
      unit = 'miles';
    } else if (this.selectedCategory === 'energy') {
      detail = `Electricity (${this.electricityKwh}kWh) & Gas (${this.heatingGas} units)`;
      amount = this.electricityKwh + this.heatingGas;
      unit = 'units';
    } else if (this.selectedCategory === 'food') {
      detail = `${this.dietType.charAt(0).toUpperCase() + this.dietType.slice(1)} diet (${this.dietMeals} meals)`;
      amount = this.dietMeals;
      unit = 'meals';
    } else if (this.selectedCategory === 'waste') {
      detail = `Household waste (${this.wasteBags} bags, ${this.wasteRecycleRate}% recycled)`;
      amount = this.wasteBags;
      unit = 'bags';
    }

    const newLog: ActivityLog = {
      category: this.selectedCategory,
      detail,
      amount,
      unit,
      emissions: this.calculatedEmissions,
      date: new Date().toISOString().split('T')[0]
    };

    this.activityLogs.unshift(newLog);
    
    // Reset calculator inputs
    this.distance = 0;
    this.electricityKwh = 0;
    this.heatingGas = 0;
    this.dietMeals = 1;
    this.wasteBags = 0;
    this.calculatedEmissions = 0;
  }

  public getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'transport': return 'bi-car-front';
      case 'energy': return 'bi-lightning-charge';
      case 'food': return 'bi-egg-fried';
      case 'waste': return 'bi-trash3';
      default: return 'bi-activity';
    }
  }
}
