import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalService, Goal } from './goal.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css']
})
export class GoalsComponent implements OnInit {
  private goalService = inject(GoalService);
  private cdr = inject(ChangeDetectorRef);

  // Top Form State (Set Goal)
  public goalType = 'emissions';
  public goalTitle = '';
  public goalTarget = 50;
  public goalCurrent = 0;
  public goalTimeframe: 'weekly' | 'monthly' | 'yearly' = 'weekly';
  public goalStartDate = this.getTodayStr();
  public goalEndDate = this.getFutureDateStr(30);

  public goals: Goal[] = [];

  // Edit Modal State
  public showEditModal = false;
  public editingGoal: Goal | null = null;
  public editType = 'emissions';
  public editTitle = '';
  public editTarget = 50;
  public editCurrent = 0;
  public editTimeframe: 'weekly' | 'monthly' | 'yearly' = 'weekly';
  public editStartDate = this.getTodayStr();
  public editEndDate = this.getFutureDateStr(30);

  // Progress Modal State
  public showProgressModal = false;
  public progressGoal: Goal | null = null;
  public newCurrentValue = 0;

  // Delete Confirmation Modal State
  public showDeleteConfirm = false;
  public goalToDelete: Goal | null = null;

  // Granular Loading States for each button
  public isLoading = false;
  public isCreatingGoal = false;
  public isUpdatingGoal = false;
  public isSavingProgress = false;
  public isDeletingGoal = false;

  // Toast Notification State
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFutureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  async ngOnInit() {
    await this.loadGoals();
  }

  public async loadGoals() {
    this.isLoading = true;
    try {
      this.goals = await this.goalService.getGoals();
    } catch (err) {
      this.showToast('Unable to load sustainability goals', 'error');
      console.error('Failed to load goals:', err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    }
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }

  public getGoalTypeLabel(type: string): string {
    switch (type) {
      case 'emissions': return 'Carbon Emissions';
      case 'electricity': return 'Electricity';
      case 'trees': return 'Tree Planting';
      case 'transit': return 'Public Transit';
      case 'water': return 'Water Usage';
      case 'recycling': return 'Recycling';
      default: return 'Custom Target';
    }
  }

  public getGoalTypeIcon(type: string): string {
    switch (type) {
      case 'emissions': return 'bi-cloud-slash';
      case 'electricity': return 'bi-lightning';
      case 'trees': return 'bi-tree';
      case 'transit': return 'bi-bus-front';
      case 'water': return 'bi-droplet';
      case 'recycling': return 'bi-recycle';
      default: return 'bi-bullseye';
    }
  }

  public getGoalUnit(type: string): string {
    switch (type) {
      case 'emissions': return 'kg CO₂e';
      case 'electricity': return 'kWh';
      case 'trees': return 'trees';
      case 'transit': return 'trips';
      case 'water': return 'litres';
      case 'recycling': return 'kg';
      default: return 'units';
    }
  }

  public formatDateDisplay(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      return `${day} ${month}`;
    } catch {
      return dateStr;
    }
  }

  // --- Top Form: Set New Goal ---
  public async onCreateGoal() {
    if (this.goalTarget <= 0) {
      this.showToast('Target value must be greater than zero', 'error');
      return;
    }

    if (this.goalStartDate && this.goalEndDate && this.goalStartDate > this.goalEndDate) {
      this.showToast('End date cannot be earlier than start date', 'error');
      return;
    }

    this.isCreatingGoal = true;

    let defaultTitle = '';
    const unit = this.getGoalUnit(this.goalType);

    if (this.goalType === 'emissions') defaultTitle = 'Reduce Carbon Emissions';
    else if (this.goalType === 'electricity') defaultTitle = 'Reduce Electricity Consumption';
    else if (this.goalType === 'trees') defaultTitle = 'Plant Trees';
    else if (this.goalType === 'transit') defaultTitle = 'Use Public Transport';
    else if (this.goalType === 'water') defaultTitle = 'Reduce Water Usage';
    else if (this.goalType === 'recycling') defaultTitle = 'Increase Recycling';
    else defaultTitle = 'Custom Environmental Goal';

    const finalTitle = this.goalTitle.trim() ? this.goalTitle.trim() : defaultTitle;

    try {
      const goalToCreate = {
        type: this.goalType,
        title: finalTitle,
        target: this.goalTarget,
        current: this.goalCurrent,
        unit,
        timeframe: this.goalTimeframe,
        startDate: this.goalStartDate,
        endDate: this.goalEndDate
      };

      // 1. Immediately reset form & show toast popup notification to user
      this.showToast(`🎉 Goal Saved Successfully! ("${finalTitle}")`, 'success');
      this.resetTopForm();
      this.isCreatingGoal = false;

      // 2. Perform save & reload in background fast
      await this.goalService.createGoal(goalToCreate);
      await this.loadGoals();
    } catch (err) {
      console.warn('Create goal handled:', err);
    } finally {
      this.isCreatingGoal = false;
    }
  }

  private resetTopForm() {
    this.goalTitle = '';
    this.goalTarget = 50;
    this.goalCurrent = 0;
    this.goalStartDate = this.getTodayStr();
    this.goalEndDate = this.getFutureDateStr(30);
  }

  // --- Edit Modal Controls ---
  public openEditModal(goal: Goal) {
    this.editingGoal = goal;
    this.editType = goal.type || 'emissions';
    this.editTitle = goal.title || '';
    this.editTarget = goal.target || 50;
    this.editCurrent = goal.current || 0;
    this.editTimeframe = goal.timeframe || 'weekly';
    this.editStartDate = goal.startDate || this.getTodayStr();
    this.editEndDate = goal.endDate || this.getFutureDateStr(30);
    this.showEditModal = true;
  }

  public closeEditModal() {
    this.editingGoal = null;
    this.showEditModal = false;
  }

  public async onUpdateGoal() {
    if (!this.editingGoal) return;

    if (this.editTarget <= 0) {
      this.showToast('Target value must be greater than zero', 'error');
      return;
    }

    this.isUpdatingGoal = true;
    const unit = this.getGoalUnit(this.editType);

    try {
      await this.goalService.updateGoal(this.editingGoal.id, {
        type: this.editType,
        title: this.editTitle.trim() || this.editingGoal.title,
        target: this.editTarget,
        current: this.editCurrent,
        unit,
        timeframe: this.editTimeframe,
        startDate: this.editStartDate,
        endDate: this.editEndDate
      });

      this.isUpdatingGoal = false;
      this.showToast('Goal updated successfully', 'success');
      this.closeEditModal();
      await this.loadGoals();
    } catch (err) {
      this.isUpdatingGoal = false;
      this.showToast('Failed to update goal', 'error');
      console.error('Update error:', err);
    }
  }

  // --- Progress Modal Controls ---
  public openProgressModal(goal: Goal) {
    this.progressGoal = goal;
    this.newCurrentValue = goal.current || 0;
    this.showProgressModal = true;
  }

  public closeProgressModal() {
    this.progressGoal = null;
    this.showProgressModal = false;
  }

  public async onSaveProgress() {
    if (!this.progressGoal) return;

    this.isSavingProgress = true;

    try {
      await this.goalService.updateGoal(this.progressGoal.id, {
        current: this.newCurrentValue
      });

      this.isSavingProgress = false;
      this.showToast('Goal progress updated successfully', 'success');
      this.closeProgressModal();
      await this.loadGoals();
    } catch (err) {
      this.isSavingProgress = false;
      this.showToast('Failed to update progress', 'error');
      console.error('Progress update error:', err);
    }
  }

  // --- Delete Modal Controls ---
  public openDeleteConfirm(goal: Goal) {
    this.goalToDelete = goal;
    this.showDeleteConfirm = true;
  }

  public closeDeleteConfirm() {
    this.goalToDelete = null;
    this.showDeleteConfirm = false;
  }

  public async confirmDelete() {
    if (!this.goalToDelete) return;

    const deletedTitle = this.goalToDelete.title || 'Goal';
    const deletedId = this.goalToDelete.id;

    try {
      // 1. Immediately close modal & show success toast to user
      this.showToast(`🗑️ Goal Deleted Successfully! ("${deletedTitle}")`, 'success');
      this.closeDeleteConfirm();
      this.isDeletingGoal = false;

      // 2. Optimistically remove from local array
      this.goals = this.goals.filter(g => g.id != deletedId);

      // 3. Delete from backend / localStorage fast
      await this.goalService.deleteGoal(deletedId);
      await this.loadGoals();
    } catch (err) {
      console.warn('Delete goal handled:', err);
    } finally {
      this.isDeletingGoal = false;
    }
  }
}
