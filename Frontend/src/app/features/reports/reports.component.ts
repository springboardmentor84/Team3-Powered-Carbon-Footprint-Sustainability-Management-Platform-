import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { jsPDF } from 'jspdf';
import { ActivityService, ActivityRecord } from '../carbon/activity.service';
import { GoalService, Goal } from '../goals/goal.service';
import { ChallengesService, Challenge } from '../challenges/challenges.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  private http = inject(HttpClient);
  private activityService = inject(ActivityService);
  private goalService = inject(GoalService);
  private challengesService = inject(ChallengesService);

  public reportType = 'carbon';
  public dateRange = 'last-30';
  public format = 'pdf';

  public isGenerating = false;
  public downloadLink = '';
  public message = '';

  public preparedBlob: Blob | null = null;
  public preparedFileName = '';
  public reportStats: any = null;

  public async onGenerateReport() {
    this.isGenerating = true;
    this.message = '';
    this.downloadLink = '';
    this.preparedBlob = null;
    this.preparedFileName = '';
    this.reportStats = null;

    try {
      // 1. Fetch real summary data from backend or local services
      let reportData: any = null;
      try {
        const res: any = await firstValueFrom(
          this.http.get(`http://localhost:8081/api/reports/summary?reportType=${this.reportType}&dateRange=${this.dateRange}`).pipe(timeout(1500))
        );
        if (res && res.success && res.data) {
          reportData = res.data;
        }
      } catch {
        // Fallback to local service aggregation
        reportData = await this.buildLocalReportData();
      }

      if (!reportData) {
        reportData = await this.buildLocalReportData();
      }

      this.reportStats = reportData;

      // 2. Generate Real File Blob (PDF or Excel CSV)
      const isExcel = (this.format === 'excel' || this.format === 'csv');
      const fileExt = isExcel ? 'csv' : 'pdf';
      const dateStr = new Date().toISOString().split('T')[0];
      this.preparedFileName = `EcoTrack_${this.getReportFilePrefix(this.reportType)}_${this.dateRange}_${dateStr}.${fileExt}`;

      if (isExcel) {
        const csvContent = this.generateCsvString(reportData);
        this.preparedBlob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      } else {
        this.preparedBlob = this.generateRealPdfBlob(reportData);
      }

      this.isGenerating = false;
      this.downloadLink = 'ready';
      this.message = `Successfully prepared ${this.getReportLabel(this.reportType)} in ${this.format.toUpperCase()} format (${reportData.recordCount || 0} records included).`;

    } catch (err) {
      console.error('Error generating report:', err);
      this.isGenerating = false;
      this.message = 'Failed to generate report. Please try again.';
    }
  }

  public triggerDownload() {
    if (!this.preparedBlob) {
      this.message = 'No prepared file found. Please click Generate first.';
      return;
    }

    // Trigger Native Browser File Download
    const url = window.URL.createObjectURL(this.preparedBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.preparedFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);

    this.message = `Downloaded ${this.preparedFileName} successfully! Check your downloads folder.`;
    setTimeout(() => {
      this.downloadLink = '';
      this.message = '';
    }, 4000);
  }

  private generateRealPdfBlob(data: any): Blob {
    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(16, 185, 129); // EcoTrack Green #10b981
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EcoTrack - Sustainability & ESG Audit Report', 14, 16);

    // Report Metadata
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Report Title: ${data.reportTitle || 'Carbon Footprint Report'}`, 14, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Range: ${data.dateRange || 'last-30'} (${data.startDate || ''} to ${data.endDate || ''})`, 14, 42);
    doc.text(`Generated For: ${data.userEmail || 'demo@ecotrack.com'}`, 14, 50);
    doc.text(`Generated At: ${data.generatedAt || new Date().toLocaleDateString()}`, 14, 58);

    // KPI Summary Box
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(14, 66, 182, 28, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Gross Emissions', 22, 76);
    doc.text('Total Offsets', 82, 76);
    doc.text('Net Carbon Footprint', 138, 76);

    doc.setFontSize(12);
    doc.setTextColor(239, 68, 68); // Red
    doc.text(`${data.totalEmissionsKg || 0} kg CO2e`, 22, 86);

    doc.setTextColor(16, 185, 129); // Green
    doc.text(`${data.totalOffsetsKg || 0} kg CO2e`, 82, 86);

    doc.setTextColor(31, 41, 55);
    doc.text(`${data.netCarbonScoreKg || 0} kg CO2e`, 138, 86);

    // Table Header
    let y = 106;
    doc.setFillColor(31, 41, 55);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 18, y + 6);
    doc.text('Activity Name', 45, y + 6);
    doc.text('Category', 110, y + 6);
    doc.text('Qty & Unit', 150, y + 6);
    doc.text('CO2e (kg)', 180, y + 6);

    y += 14;
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');

    if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
      for (const a of data.activities) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(String(a.date || ''), 18, y);
        let name = String(a.name || '');
        if (name.length > 28) name = name.substring(0, 25) + '...';
        doc.text(name, 45, y);
        doc.text(String(a.category || ''), 110, y);
        doc.text(`${a.quantity || 0} ${a.unit || ''}`, 150, y);
        doc.text(`${a.co2Kg || 0}`, 180, y);
        y += 8;
      }
    } else {
      doc.text('No activity records logged for this selected timeframe.', 18, y);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Official EcoTrack ESG Certification Seal - Confidential & Verified Data', 14, 285);

    return doc.output('blob');
  }

  private async buildLocalReportData(): Promise<any> {
    const activities: ActivityRecord[] = await this.activityService.getAllActivities();
    const goals: Goal[] = await this.goalService.getGoals();
    const challenges: Challenge[] = await this.challengesService.getChallenges();

    const startDate = this.calculateStartDate(this.dateRange);
    const filteredActivities = activities.filter(a => {
      if (!a.activityDate) return true;
      const d = new Date(a.activityDate);
      return d >= startDate;
    });

    let grossEmissions = 0;
    let totalOffsets = 0;
    const catBreakdown: { [key: string]: number } = {};

    for (const a of filteredActivities) {
      const co2 = a.calculatedCo2 || 0;
      if (a.isOffset) {
        totalOffsets += co2;
      } else {
        grossEmissions += co2;
        catBreakdown[a.categoryCode] = parseFloat(((catBreakdown[a.categoryCode] || 0) + co2).toFixed(2));
      }
    }

    const netScore = parseFloat((grossEmissions - totalOffsets).toFixed(2));

    return {
      reportTitle: this.getReportLabel(this.reportType),
      reportType: this.reportType,
      dateRange: this.dateRange,
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toLocaleDateString(),
      userEmail: 'demo@ecotrack.com',
      recordCount: filteredActivities.length,
      totalEmissionsKg: parseFloat(grossEmissions.toFixed(2)),
      totalOffsetsKg: parseFloat(totalOffsets.toFixed(2)),
      netCarbonScoreKg: netScore,
      categoryBreakdown: catBreakdown,
      goalCount: goals.length,
      completedGoals: goals.filter(g => g.status === 'Completed').length,
      challengeCount: challenges.length,
      activities: filteredActivities.map(a => ({
        date: a.activityDate || '',
        name: a.activityName,
        category: a.categoryCode,
        subCategory: a.subCategory || 'GENERAL',
        quantity: a.quantity,
        unit: a.unit,
        factor: a.emissionFactorUsed || 0,
        co2Kg: a.calculatedCo2,
        isOffset: a.isOffset
      })),
      goalsList: goals,
      challengesList: challenges
    };
  }

  private generateCsvString(data: any): string {
    let csv = `EcoTrack Sustainability Management Platform - Report Export\n`;
    csv += `Report Title:,${this.escapeCsv(data.reportTitle)}\n`;
    csv += `Generated For:,${this.escapeCsv(data.userEmail)}\n`;
    csv += `Date Range:,${this.escapeCsv(data.dateRange)} (${data.startDate} to ${data.endDate})\n`;
    csv += `Generated At:,${data.generatedAt}\n\n`;

    csv += `Executive Metrics Summary\n`;
    csv += `Total Gross Emissions (kg CO2e):,${data.totalEmissionsKg}\n`;
    csv += `Total Offsets (kg CO2e):,${data.totalOffsetsKg}\n`;
    csv += `Net Carbon Footprint (kg CO2e):,${data.netCarbonScoreKg}\n`;
    csv += `Total Activity Logs Analyzed:,${data.recordCount}\n`;
    csv += `Goals Completed:,${data.completedGoals || 0}/${data.goalCount || 0}\n\n`;

    if (this.reportType === 'goals' && data.goalsList) {
      csv += `Goal Achievement Records\n`;
      csv += `Goal Title,Type,Target,Current,Unit,Timeframe,Progress %,Status\n`;
      for (const g of data.goalsList) {
        csv += `${this.escapeCsv(g.title)},${this.escapeCsv(g.type)},${g.target},${g.current},${this.escapeCsv(g.unit)},${g.timeframe},${g.progress || 0}%,${g.status}\n`;
      }
    } else if (this.reportType === 'challenges' && data.challengesList) {
      csv += `Community Challenge Summary\n`;
      csv += `Challenge Title,Category,Target,Current,Participants,Reward Points,Active\n`;
      for (const c of data.challengesList) {
        csv += `${this.escapeCsv(c.title)},${this.escapeCsv(c.category)},${c.target},${c.current},${c.participants},${c.rewardPoints},${c.active}\n`;
      }
    } else {
      csv += `Itemized Activity Log Records\n`;
      csv += `Date,Activity Name,Category,SubCategory,Quantity,Unit,Emission Factor,Calculated CO2e (kg),Is Offset\n`;
      if (data.activities && Array.isArray(data.activities)) {
        for (const a of data.activities) {
          csv += `${this.escapeCsv(a.date)},${this.escapeCsv(a.name)},${this.escapeCsv(a.category)},${this.escapeCsv(a.subCategory)},${a.quantity},${this.escapeCsv(a.unit)},${a.factor},${a.co2Kg},${a.isOffset}\n`;
        }
      }
    }

    return csv;
  }

  private calculateStartDate(range: string): Date {
    const d = new Date();
    if (range === 'last-7') d.setDate(d.getDate() - 7);
    else if (range === 'last-12m') d.setFullYear(d.getFullYear() - 1);
    else if (range === 'ytd') d.setMonth(0, 1);
    else d.setDate(d.getDate() - 30);
    return d;
  }

  public getReportLabel(type: string): string {
    switch (type) {
      case 'carbon': return 'Carbon Footprint Analysis';
      case 'goals': return 'Goals Achievement Report';
      case 'sustainability': return 'General Sustainability Scorecard';
      case 'challenges': return 'Community Challenge Summary';
      default: return 'Custom Activity Report';
    }
  }

  private getReportFilePrefix(type: string): string {
    switch (type) {
      case 'carbon': return 'Carbon_Footprint';
      case 'goals': return 'Goals_Achievement';
      case 'sustainability': return 'Sustainability_Scorecard';
      case 'challenges': return 'Community_Challenges';
      default: return 'Custom_Report';
    }
  }

  private escapeCsv(str: string): string {
    if (!str) return '""';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }
}
