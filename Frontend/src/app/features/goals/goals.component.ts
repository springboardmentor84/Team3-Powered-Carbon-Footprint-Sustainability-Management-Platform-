import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Goal {
  id: number;
  type: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  timeframe: 'weekly' | 'monthly' | 'yearly';
  progress: number;
}

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css']
})
export class GoalsComponent {
  // Goal creation form state
  public goalType = 'emissions';
  public goalTarget = 10;
  public goalTimeframe: 'weekly' | 'monthly' | 'yearly' = 'weekly';

  public goals: Goal[] = [
    { id: 1, type: 'emissions', title: 'Reduce Carbon Emissions', target: 50, current: 42, unit: 'kg', timeframe: 'weekly', progress: 84 },
    { id: 2, type: 'electricity', title: 'Reduce Electricity Consumption', target: 200, current: 150, unit: 'kWh', timeframe: 'monthly', progress: 75 },
    { id: 3, type: 'trees', title: 'Plant Trees', target: 5, current: 3, unit: 'trees', timeframe: 'yearly', progress: 60 },
    { id: 4, type: 'transit', title: 'Use Public Transport', target: 5, current: 5, unit: 'trips', timeframe: 'weekly', progress: 100 }
  ];

  public getGoalTypeLabel(type: string): string {
    switch (type) {
      case 'emissions': return 'Carbon Emissions';
      case 'electricity': return 'Electricity';
      case 'trees': return 'Tree Planting';
      case 'transit': return 'Public Transit';
      default: return 'Custom';
    }
  }

  public getGoalTypeIcon(type: string): string {
    switch (type) {
      case 'emissions': return 'bi-cloud-slash';
      case 'electricity': return 'bi-lightning';
      case 'trees': return 'bi-tree';
      case 'transit': return 'bi-bus-front';
      default: return 'bi-bookmark';
    }
  }

  public onCreateGoal() {
    if (this.goalTarget <= 0) return;

    let title = '';
    let unit = '';

    if (this.goalType === 'emissions') {
      title = 'Reduce Carbon Emissions';
      unit = 'kg';
    } else if (this.goalType === 'electricity') {
      title = 'Reduce Electricity Consumption';
      unit = 'kWh';
    } else if (this.goalType === 'trees') {
      title = 'Plant Trees';
      unit = 'trees';
    } else if (this.goalType === 'transit') {
      title = 'Use Public Transport';
      unit = 'trips';
    }

    const newGoal: Goal = {
      id: Date.now(),
      type: this.goalType,
      title,
      target: this.goalTarget,
      current: 0,
      unit,
      timeframe: this.goalTimeframe,
      progress: 0
    };

    this.goals.push(newGoal);

    // Reset Form
    this.goalTarget = 10;
  }

  public incrementProgress(goalId: number) {
    const goal = this.goals.find(g => g.id === goalId);
    if (goal && goal.current < goal.target) {
      goal.current += 1;
      goal.progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
    }
  }
}
