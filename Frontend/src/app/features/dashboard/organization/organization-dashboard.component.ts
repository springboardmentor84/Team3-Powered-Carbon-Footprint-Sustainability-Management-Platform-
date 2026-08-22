import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Champion {
  rank: number;
  name: string;
  dept: string;
  points: number;
  avatar: string;
}

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './organization-dashboard.component.html',
  styleUrls: ['./organization-dashboard.component.css']
})
export class OrganizationDashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  // Toast Alerts
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';

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

  public orgChartPoints = [
    { x: 20, y: 90, label: 'Jan', val: '12,100' },
    { x: 80, y: 80, label: 'Mar', val: '12,450' },
    { x: 140, y: 85, label: 'May', val: '12,300' },
    { x: 200, y: 95, label: 'Jul', val: '11,900' },
    { x: 260, y: 55, label: 'Sep', val: '14,050' },
    { x: 320, y: 75, label: 'Nov', val: '13,280' }
  ];

  public activeOrgPoint: { index: number; label: string; value: string; x: number; y: number } | null = null;

  ngOnInit() {
    this.cdr.detectChanges();
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

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }
}
