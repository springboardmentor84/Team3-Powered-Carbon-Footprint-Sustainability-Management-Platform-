import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Activity {
  id: number;
  icon: string;
  category: string;
  detail: string;
  emissions: number;
  time: string;
}

interface Champion {
  rank: number;
  name: string;
  dept: string;
  points: number;
  avatar: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public currentMode: 'individual' | 'organization' = 'individual';

  // Hover states for chart points
  public activeIndivPoint: { index: number; label: string; value: string; x: number; y: number } | null = null;
  public activeOrgPoint: { index: number; label: string; value: string; x: number; y: number } | null = null;

  // Individual mode data
  public indivActivities: Activity[] = [
    { id: 1, icon: 'bi-car-front', category: 'Transportation', detail: 'Commute to office (12 mi, Sedan)', emissions: 4.2, time: '8:30 AM' },
    { id: 2, icon: 'bi-egg-fried', category: 'Food & Diet', detail: 'Vegetarian Lunch', emissions: 0.8, time: '1:15 PM' },
    { id: 3, icon: 'bi-lightning', category: 'Energy Usage', detail: 'Air Conditioning (4 hrs, 1.2kW)', emissions: 1.5, time: '5:00 PM' }
  ];

  // Individual chart coordinates (for 300x120 viewBox)
  public indivChartPoints = [
    { x: 10, y: 80, label: '01 Jul', val: '2.8' },
    { x: 50, y: 70, label: '06 Jul', val: '3.1' },
    { x: 90, y: 85, label: '12 Jul', val: '2.5' },
    { x: 130, y: 50, label: '18 Jul', val: '4.2' },
    { x: 170, y: 65, label: '24 Jul', val: '3.4' },
    { x: 210, y: 80, label: '25 Jul', val: '2.9' },
    { x: 250, y: 90, label: '26 Jul', val: '2.2' },
    { x: 290, y: 40, label: 'Today', val: '4.2' }
  ];

  // Organization mode data
  public departmentBreakdown = [
    { name: 'Logistics & Supply', percentage: 42, color: '#EF4444' },
    { name: 'Manufacturing', percentage: 28, color: '#10B981' },
    { name: 'Data Centers', percentage: 18, color: '#3B82F6' },
    { name: 'Corporate Offices', percentage: 12, color: '#F59E0B' }
  ];

  public orgChampions: Champion[] = [
    { rank: 1, name: 'Sarah Jenkins', dept: 'Marketing Dept', points: 2450, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=60&auto=format&fit=crop' },
    { rank: 2, name: 'Alex Rivers', dept: 'Engineering Dept', points: 2100, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=60&auto=format&fit=crop' },
    { rank: 3, name: 'Mike Thornton', dept: 'Logistics Dept', points: 1950, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=60&auto=format&fit=crop' }
  ];

  // Organization chart coordinates (for 350x120 viewBox)
  public orgChartPoints = [
    { x: 20, y: 90, label: 'Jan', val: '12,100' },
    { x: 80, y: 80, label: 'Mar', val: '12,450' },
    { x: 140, y: 85, label: 'May', val: '12,300' },
    { x: 200, y: 95, label: 'Jul', val: '11,900' },
    { x: 260, y: 55, label: 'Sep', val: '14,050' },
    { x: 320, y: 75, label: 'Nov', val: '13,280' }
  ];

  ngOnInit() {
    // Default mode check
  }

  public setMode(mode: 'individual' | 'organization') {
    this.currentMode = mode;
  }

  public showIndivTooltip(point: any, index: number) {
    this.activeIndivPoint = {
      index,
      label: point.label,
      value: `${point.val} kg CO₂e`,
      x: point.x,
      y: point.y - 12
    };
  }

  public hideIndivTooltip() {
    this.activeIndivPoint = null;
  }

  public showOrgTooltip(point: any, index: number) {
    this.activeOrgPoint = {
      index,
      label: point.label,
      value: `${point.val} tCO₂e`,
      x: point.x,
      y: point.y - 12
    };
  }

  public hideOrgTooltip() {
    this.activeOrgPoint = null;
  }

  public getPathString(points: Array<{x: number, y: number}>): string {
    if (points.length === 0) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Use cubic bezier to draw smooth curves
      const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY1 = points[i-1].y;
      const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY2 = points[i].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    return path;
  }

  public getAreaPathString(points: Array<{x: number, y: number}>, height: number): string {
    if (points.length === 0) return '';
    const linePath = this.getPathString(points);
    return `${linePath} L ${points[points.length-1].x} ${height} L ${points[0].x} ${height} Z`;
  }
}
