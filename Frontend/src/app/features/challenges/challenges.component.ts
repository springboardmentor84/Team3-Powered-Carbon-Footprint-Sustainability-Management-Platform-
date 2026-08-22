import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  public challenges: Challenge[] = [];
  public leaderboard: LeaderboardUser[] = [];

  // Filtered cached arrays (Prevents template getter lag)
  public filteredChallenges: Challenge[] = [];
  public activeDrives: Challenge[] = [];
  public availableDrives: Challenge[] = [];
  public completedDrives: Challenge[] = [];

  // Quick Tab Selection ('ALL' | 'ACTIVE' | 'AVAILABLE' | 'COMPLETED')
  public activeTab: 'ALL' | 'ACTIVE' | 'AVAILABLE' | 'COMPLETED' = 'ALL';

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

  ngOnInit() {
    // 1. Instant 0ms render from synchronous cache
    this.challenges = this.challengesService.getCachedChallenges();
    this.leaderboard = this.challengesService.getCachedLeaderboard();
    this.updateFilteredLists();
    this.cdr.detectChanges();

    // 2. Background sync without blocking the UI
    this.loadData();
  }

  public async loadData() {
    try {
      const [challenges, leaderboard] = await Promise.all([
        this.challengesService.getChallenges(),
        this.challengesService.getLeaderboard()
      ]);
      if (challenges && challenges.length > 0) {
        this.challenges = challenges;
      }
      if (leaderboard && leaderboard.length > 0) {
        this.leaderboard = leaderboard;
      }
      this.updateFilteredLists();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Failed to load challenges in background:', err);
    }
  }

  public setTab(tab: 'ALL' | 'ACTIVE' | 'AVAILABLE' | 'COMPLETED') {
    this.activeTab = tab;
    if (tab === 'ALL') this.filterStatus = 'ALL';
    else if (tab === 'ACTIVE') this.filterStatus = 'JOINED';
    else if (tab === 'AVAILABLE') this.filterStatus = 'ACTIVE';
    else if (tab === 'COMPLETED') this.filterStatus = 'COMPLETED';
    this.updateFilteredLists();
    this.cdr.detectChanges();
  }

  // Efficient filter list updater
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
    if (this.filterStatus === 'ALL') this.activeTab = 'ALL';
    else if (this.filterStatus === 'JOINED') this.activeTab = 'ACTIVE';
    else if (this.filterStatus === 'ACTIVE') this.activeTab = 'AVAILABLE';
    else if (this.filterStatus === 'COMPLETED') this.activeTab = 'COMPLETED';

    this.updateFilteredLists();
    this.cdr.detectChanges();
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
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

  // --- Action: Join Challenge (Instant Optimistic UI) ---
  public async onJoinChallenge(ch: Challenge) {
    if (ch.joined) {
      this.showToast('You have already joined this challenge', 'success');
      return;
    }

    this.isJoiningId = ch.id;

    // Instant local mutation
    ch.joined = true;
    ch.status = 'In Progress';
    ch.currentProgress = ch.currentProgress || 0;
    ch.participantCount = (ch.participantCount || 0) + 1;

    // Persist joined state immediately
    this.challengesService.markChallengeJoinedInMap(ch.id, ch.currentProgress || 0, 'In Progress');
    this.challengesService.saveStoredChallenges(this.challenges);

    // Instantly update lists and trigger change detection
    this.updateFilteredLists();
    this.showToast('Successfully joined the challenge! 🎉', 'success');
    this.cdr.detectChanges();

    try {
      await this.challengesService.joinChallenge(ch.id);
    } catch (err) {
      console.error('Join error:', err);
    } finally {
      this.isJoiningId = null;
      this.challengesService.saveStoredChallenges(this.challenges);
      this.updateFilteredLists();
      this.cdr.detectChanges();
    }
  }

  // --- Action: Open Details Modal ---
  public openDetailsModal(ch: Challenge) {
    this.selectedChallengeDetails = ch;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
  }

  public closeDetailsModal() {
    this.selectedChallengeDetails = null;
    this.showDetailsModal = false;
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  public closeCreateEditModal() {
    this.showCreateEditModal = false;
    this.isEditMode = false;
    this.editingChallengeId = null;
    this.cdr.detectChanges();
  }

  public async onSubmitChallengeForm() {
    if (!this.formTitle.trim()) {
      this.showToast('Please enter a challenge title', 'error');
      return;
    }
    if (this.formTargetValue <= 0) {
      this.showToast('Target value must be greater than 0', 'error');
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

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
        const updated = await this.challengesService.updateChallenge(this.editingChallengeId, challengeData);
        const idx = this.challenges.findIndex(c => c.id === this.editingChallengeId);
        if (idx !== -1) {
          this.challenges[idx] = { ...this.challenges[idx], ...updated };
        }
        this.showToast('Challenge updated successfully ✨', 'success');
      } else {
        const created = await this.challengesService.createChallenge(challengeData);
        this.challenges.unshift(created);
        this.showToast('Challenge created successfully 🎉', 'success');
      }
      this.closeCreateEditModal();
      this.updateFilteredLists();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Challenge submit error:', err);
      this.showToast(this.isEditMode ? 'Failed to update challenge' : 'Failed to create challenge', 'error');
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  // --- Update Progress Modal Controls ---
  public openProgressModal(ch: Challenge) {
    this.progressChallenge = ch;
    this.newProgressValue = ch.currentProgress || 0;
    this.showProgressModal = true;
    this.cdr.detectChanges();
  }

  public closeProgressModal() {
    this.progressChallenge = null;
    this.showProgressModal = false;
    this.cdr.detectChanges();
  }

  public async onSaveProgress() {
    if (!this.progressChallenge) return;

    this.isUpdatingProgress = true;
    this.cdr.detectChanges();

    const target = this.progressChallenge.targetValue || 1;
    const isNowCompleted = this.newProgressValue >= target && this.progressChallenge.status !== 'Completed';

    try {
      const updated = await this.challengesService.updateProgress(this.progressChallenge.id, this.newProgressValue);
      const idx = this.challenges.findIndex(c => c.id === this.progressChallenge!.id);
      if (idx !== -1) {
        this.challenges[idx] = { ...this.challenges[idx], ...updated };
      }
      this.closeProgressModal();

      if (isNowCompleted || updated.status === 'Completed') {
        this.showToast(`🎉 Challenge completed! You earned +${this.progressChallenge.rewardPoints} Eco Points.`, 'success');
      } else {
        this.showToast('Challenge progress updated successfully ✨', 'success');
      }
      this.leaderboard = this.challengesService.getCachedLeaderboard();
      this.updateFilteredLists();
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Progress update error:', err);
      this.showToast('Failed to update progress', 'error');
    } finally {
      this.isUpdatingProgress = false;
      this.cdr.detectChanges();
    }
  }

  // --- Delete Confirmation Controls ---
  public openDeleteConfirm(ch: Challenge) {
    this.challengeToDelete = ch;
    this.showDeleteConfirm = true;
    this.cdr.detectChanges();
  }

  public closeDeleteConfirm() {
    this.challengeToDelete = null;
    this.showDeleteConfirm = false;
    this.cdr.detectChanges();
  }

  public async confirmDelete() {
    if (!this.challengeToDelete) return;

    const delId = this.challengeToDelete.id;
    this.isDeletingId = delId;
    this.challenges = this.challenges.filter(c => c.id !== delId);
    this.updateFilteredLists();
    this.closeDeleteConfirm();
    this.showToast('Challenge deleted successfully', 'success');
    this.cdr.detectChanges();

    try {
      await this.challengesService.deleteChallenge(delId);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      this.isDeletingId = null;
      this.cdr.detectChanges();
    }
  }
}
