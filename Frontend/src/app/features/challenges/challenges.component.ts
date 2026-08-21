import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChallengesService, Challenge, LeaderboardUser } from './challenges.service';

@Component({
  selector: 'app-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './challenges.component.html',
  styleUrls: ['./challenges.component.css']
})
export class ChallengesComponent implements OnInit {
  private challengesService = inject(ChallengesService);

  public challenges: Challenge[] = [];
  public leaderboard: LeaderboardUser[] = [];

  // Filtered cached arrays (Prevents template getter lag)
  public filteredChallenges: Challenge[] = [];
  public activeDrives: Challenge[] = [];
  public availableDrives: Challenge[] = [];
  public completedDrives: Challenge[] = [];

  // Filter and Search
  public searchQuery = '';
  public filterCategory = 'ALL';
  public filterStatus = 'ALL';

  // Loading States
  public isLoading = false;
  public isSubmitting = false;
  public isJoiningId: number | null = null;
  public isUpdatingProgress = false;
  public isDeletingId: number | null = null;

  // Toast Notification State
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  // Create / Edit Modal State
  public showCreateEditModal = false;
  public isEditMode = false;
  public editingChallengeId: number | null = null;

  public formTitle = '';
  public formCategory = 'PLASTIC_FREE_WEEK';
  public formDescription = '';
  public formStartDate = this.getTodayStr();
  public formEndDate = this.getFutureDateStr(7);
  public formTargetValue = 7;
  public formUnit = 'days';
  public formRewardPoints = 100;
  public formRules = '';

  // Progress Update Modal State
  public showProgressModal = false;
  public progressChallenge: Challenge | null = null;
  public newProgressValue = 0;

  // Delete Confirmation Modal State
  public showDeleteConfirm = false;
  public challengeToDelete: Challenge | null = null;

  // Details Modal State
  public showDetailsModal = false;
  public selectedChallengeDetails: Challenge | null = null;

  async ngOnInit() {
    await this.loadData();
  }

  public async loadData() {
    this.isLoading = true;
    try {
      this.challenges = await this.challengesService.getChallenges();
      this.leaderboard = await this.challengesService.getLeaderboard();
      this.updateFilteredLists();
    } catch (err) {
      console.error('Failed to load challenges:', err);
      this.showToast('Unable to fetch challenges', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Efficient filter list updater (called only on data load or search/filter change)
  public updateFilteredLists() {
    const search = this.searchQuery.trim().toLowerCase();
    const cat = this.filterCategory;
    const stat = this.filterStatus;

    this.filteredChallenges = this.challenges.filter(ch => {
      const matchesSearch = !search || 
        ch.title.toLowerCase().includes(search) ||
        ch.description.toLowerCase().includes(search);

      const matchesCategory = cat === 'ALL' || ch.category === cat;

      let matchesStatus = true;
      if (stat === 'JOINED') {
        matchesStatus = !!ch.joined && ch.status !== 'Completed';
      } else if (stat === 'COMPLETED') {
        matchesStatus = ch.status === 'Completed';
      } else if (stat === 'ACTIVE') {
        matchesStatus = !ch.joined && ch.status !== 'Completed' && ch.status !== 'Expired';
      } else if (stat === 'EXPIRED') {
        matchesStatus = ch.status === 'Expired';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.activeDrives = this.filteredChallenges.filter(c => c.joined && c.status !== 'Completed');
    this.availableDrives = this.filteredChallenges.filter(c => !c.joined && c.status !== 'Completed');
    this.completedDrives = this.filteredChallenges.filter(c => c.status === 'Completed');
  }

  public onFilterChange() {
    this.updateFilteredLists();
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

  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFutureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // --- Category Formatting Helpers ---
  public getCategoryLabel(category?: string): string {
    switch (category) {
      case 'PLASTIC_FREE_WEEK': return 'Plastic-Free Week';
      case 'CYCLE_TO_WORK': return 'Cycle to Work';
      case 'ENERGY_SAVING': return 'Energy Saving';
      case 'TREE_PLANTATION': return 'Tree Plantation Drive';
      case 'WATER_CONSERVATION': return 'Water Conservation';
      case 'ZERO_WASTE': return 'Zero Waste Challenge';
      default: return 'Eco Challenge';
    }
  }

  public getCategoryIcon(category?: string): string {
    switch (category) {
      case 'PLASTIC_FREE_WEEK': return 'bi-bag-x-fill';
      case 'CYCLE_TO_WORK': return 'bi-bicycle';
      case 'ENERGY_SAVING': return 'bi-lightning-charge-fill';
      case 'TREE_PLANTATION': return 'bi-tree-fill';
      case 'WATER_CONSERVATION': return 'bi-droplet-half';
      case 'ZERO_WASTE': return 'bi-recycle';
      default: return 'bi-trophy-fill';
    }
  }

  public getCategoryBadgeClass(category?: string): string {
    switch (category) {
      case 'PLASTIC_FREE_WEEK': return 'badge-plastic';
      case 'CYCLE_TO_WORK': return 'badge-cycle';
      case 'ENERGY_SAVING': return 'badge-energy';
      case 'TREE_PLANTATION': return 'badge-tree';
      case 'WATER_CONSERVATION': return 'badge-water';
      case 'ZERO_WASTE': return 'badge-waste';
      default: return 'badge-default';
    }
  }

  public getProgressPercentage(ch: Challenge): number {
    if (!ch.targetValue || ch.targetValue <= 0) return 0;
    const curr = ch.currentProgress || 0;
    return Math.min(100, Math.round((curr / ch.targetValue) * 100));
  }

  public getDaysRemaining(endDateStr?: string): number {
    if (!endDateStr) return 0;
    try {
      const end = new Date(endDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.ceil((end - now) / (1000 * 3600 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch {
      return 0;
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

  // --- Action: Join Challenge ---
  public async onJoinChallenge(ch: Challenge) {
    if (ch.joined) {
      this.showToast('You have already joined this challenge', 'success');
      return;
    }

    this.isJoiningId = ch.id;
    try {
      const updated = await this.challengesService.joinChallenge(ch.id);
      ch.joined = true;
      ch.status = updated.status || 'In Progress';
      ch.currentProgress = updated.currentProgress || 0;
      ch.participantCount = (ch.participantCount || 0) + 1;

      // Update local lists immediately for instantaneous UI transition
      this.updateFilteredLists();
      this.showToast('Successfully joined the challenge.', 'success');
    } catch (err) {
      console.error('Join error:', err);
      this.showToast('Failed to join challenge', 'error');
    } finally {
      this.isJoiningId = null; // Instantly turn off button loading spinner!
    }

    // Refresh background data
    this.loadData();
  }

  // --- Action: Open Details Modal ---
  public openDetailsModal(ch: Challenge) {
    this.selectedChallengeDetails = ch;
    this.showDetailsModal = true;
  }

  public closeDetailsModal() {
    this.selectedChallengeDetails = null;
    this.showDetailsModal = false;
  }

  // --- Create & Edit Modal Controls ---
  public openCreateModal() {
    this.isEditMode = false;
    this.editingChallengeId = null;
    this.formTitle = '';
    this.formCategory = 'PLASTIC_FREE_WEEK';
    this.formDescription = '';
    this.formStartDate = this.getTodayStr();
    this.formEndDate = this.getFutureDateStr(7);
    this.formTargetValue = 7;
    this.formUnit = 'days';
    this.formRewardPoints = 100;
    this.formRules = 'Avoid single-use plastics and adopt sustainable daily practices.';
    this.showCreateEditModal = true;
  }

  public openEditModal(ch: Challenge) {
    this.isEditMode = true;
    this.editingChallengeId = ch.id;
    this.formTitle = ch.title || '';
    this.formCategory = ch.category || 'PLASTIC_FREE_WEEK';
    this.formDescription = ch.description || '';
    this.formStartDate = ch.startDate || this.getTodayStr();
    this.formEndDate = ch.endDate || this.getFutureDateStr(7);
    this.formTargetValue = ch.targetValue || 7;
    this.formUnit = ch.unit || 'days';
    this.formRewardPoints = ch.rewardPoints || 100;
    this.formRules = ch.rules || '';
    this.showCreateEditModal = true;
  }

  public closeCreateEditModal() {
    this.showCreateEditModal = false;
    this.isEditMode = false;
    this.editingChallengeId = null;
  }

  public async onSubmitChallengeForm() {
    if (!this.formTitle.trim()) {
      this.showToast('Please enter a challenge name', 'error');
      return;
    }
    if (this.formTargetValue <= 0) {
      this.showToast('Target value must be greater than 0', 'error');
      return;
    }

    this.isSubmitting = true;
    const challengeData: Partial<Challenge> = {
      title: this.formTitle.trim(),
      category: this.formCategory,
      description: this.formDescription.trim(),
      startDate: this.formStartDate,
      endDate: this.formEndDate,
      targetValue: this.formTargetValue,
      unit: this.formUnit.trim() || 'units',
      rewardPoints: this.formRewardPoints,
      rules: this.formRules.trim()
    };

    try {
      if (this.isEditMode && this.editingChallengeId) {
        await this.challengesService.updateChallenge(this.editingChallengeId, challengeData);
        this.showToast('Challenge updated successfully', 'success');
      } else {
        await this.challengesService.createChallenge(challengeData);
        this.showToast('Challenge created successfully', 'success');
      }
      this.closeCreateEditModal();
    } catch (err) {
      console.error('Challenge submit error:', err);
      this.showToast(this.isEditMode ? 'Failed to update challenge' : 'Failed to create challenge', 'error');
    } finally {
      this.isSubmitting = false; // Instantly turn off button loading spinner!
    }

    // Refresh background data
    this.loadData();
  }

  // --- Update Progress Modal Controls ---
  public openProgressModal(ch: Challenge) {
    this.progressChallenge = ch;
    this.newProgressValue = ch.currentProgress || 0;
    this.showProgressModal = true;
  }

  public closeProgressModal() {
    this.progressChallenge = null;
    this.showProgressModal = false;
  }

  public async onSaveProgress() {
    if (!this.progressChallenge) return;

    this.isUpdatingProgress = true;
    const target = this.progressChallenge.targetValue || 1;
    const isNowCompleted = this.newProgressValue >= target && this.progressChallenge.status !== 'Completed';

    try {
      const updated = await this.challengesService.updateProgress(this.progressChallenge.id, this.newProgressValue);
      this.closeProgressModal();

      if (isNowCompleted || updated.status === 'Completed') {
        this.showToast(`🎉 Challenge completed! You earned ${this.progressChallenge.rewardPoints} Eco Points.`, 'success');
      } else {
        this.showToast('Challenge progress updated successfully', 'success');
      }
    } catch (err) {
      console.error('Progress update error:', err);
      this.showToast('Failed to update progress', 'error');
    } finally {
      this.isUpdatingProgress = false; // Instantly turn off button loading spinner!
    }

    // Refresh background data to sync points & re-sort leaderboard rankings
    this.loadData();
  }

  // --- Delete Confirmation Controls ---
  public openDeleteConfirm(ch: Challenge) {
    this.challengeToDelete = ch;
    this.showDeleteConfirm = true;
  }

  public closeDeleteConfirm() {
    this.challengeToDelete = null;
    this.showDeleteConfirm = false;
  }

  public async confirmDelete() {
    if (!this.challengeToDelete) return;

    this.isDeletingId = this.challengeToDelete.id;
    try {
      await this.challengesService.deleteChallenge(this.challengeToDelete.id);
      this.showToast('Challenge deleted successfully', 'success');
      this.closeDeleteConfirm();
    } catch (err) {
      console.error('Delete error:', err);
      this.showToast('Failed to delete challenge', 'error');
    } finally {
      this.isDeletingId = null; // Instantly turn off button loading spinner!
    }

    // Refresh background data
    this.loadData();
  }
}
