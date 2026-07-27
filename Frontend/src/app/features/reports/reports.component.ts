import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {
  public reportType = 'carbon';
  public dateRange = 'last-30';
  public format = 'pdf';

  public isGenerating = false;
  public downloadLink = '';
  public message = '';

  public onGenerateReport() {
    this.isGenerating = true;
    this.message = '';
    this.downloadLink = '';

    setTimeout(() => {
      this.isGenerating = false;
      this.downloadLink = 'mock-download';
      this.message = `Successfully prepared your ${this.getReportLabel(this.reportType)} report in ${this.format.toUpperCase()} format!`;
    }, 2000);
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

  public triggerDownload() {
    this.message = 'Downloading report... check your downloads folder.';
    setTimeout(() => {
      this.downloadLink = '';
      this.message = '';
    }, 2500);
  }
}
