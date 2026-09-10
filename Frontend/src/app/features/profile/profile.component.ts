import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, UserProfile } from './profile.service';
import { AuthService } from '../auth/auth.service';

export interface InterestChip {
  name: string;
  selected: boolean;
}

export interface GoalOption {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  public profileService = inject(ProfileService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Loading & Action States
  public isLoading = false;
  public isSubmitting = false;
  public isUploadingPicture = false;
  public hasImageError = false;

  // Toast Feedback State
  public toastMessage: string | null = null;
  public toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  // Profile Fields
  public fullName = '';
  public email = '';
  public phoneNumber = '';
  public dateOfBirth = '';
  public gender = 'Prefer not to say';
  public bio = '';
  public organization = '';
  public employeeId = '';
  public location = '';
  public profileImage = '';

  // 10 Sustainability Preferences
  public sustainabilityPreferences: InterestChip[] = [
    { name: 'Renewable Energy', selected: true },
    { name: 'Recycling', selected: true },
    { name: 'Waste Reduction', selected: true },
    { name: 'Sustainable Living', selected: false },
    { name: 'Green Transportation', selected: true },
    { name: 'Water Conservation', selected: false },
    { name: 'Eco-Friendly Products', selected: true },
    { name: 'Climate Action', selected: true },
    { name: 'Organic Farming', selected: false },
    { name: 'Wildlife Conservation', selected: false }
  ];

  // Environmental Interests Chips
  public environmentalInterests: string[] = ['Recycling', 'Green Transportation', 'Climate Action', 'Renewable Energy'];
  public newInterestInput = '';

  // 9 Personal Sustainability Goals Options
  public personalGoals: GoalOption[] = [
    { id: 'carbon', label: 'Reduce carbon footprint', selected: true },
    { id: 'plastic', label: 'Reduce plastic usage', selected: true },
    { id: 'transit', label: 'Use public transportation', selected: true },
    { id: 'walk', label: 'Walk/cycle more', selected: false },
    { id: 'electricity', label: 'Save electricity', selected: true },
    { id: 'water', label: 'Save water', selected: false },
    { id: 'recycling_goal', label: 'Increase recycling', selected: true },
    { id: 'food_waste', label: 'Reduce food waste', selected: false },
    { id: 'eco_products', label: 'Use eco-friendly products', selected: true }
  ];

  // Lifestyle Configuration Fields
  public commuteMode = 'transit';
  public transitFrequency = 'daily';
  public cyclingFrequency = 'weekly';
  public vehicleOwnership = 'ev';

  public energyPreference = 'renewable';
  public renewableUsage = 'high';

  public dietPreference = 'vegetarian';
  public organicFoodFrequency = 'frequent';

  public recyclingHabit = 'always';
  public wasteReductionHabit = 'high';
  public composting = 'active';

  // Completion Analytics
  public completionPercentage = 0;
  public missingFields: string[] = [];

  async ngOnInit() {
    // 1. Immediately hydrate with cached data synchronously on ngOnInit
    const cached = this.profileService.getStoredProfile();
    this.populateProfileForm(cached);

    // 2. Fetch fresh backend data
    await this.loadProfileData();
  }

  public async loadProfileData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    try {
      const profile = await this.profileService.getProfile();
      this.ngZone.run(() => {
        this.populateProfileForm(profile);
        this.cdr.markForCheck();
      });
    } catch (err) {
      console.error('Failed to load user profile:', err);
      this.ngZone.run(() => {
        this.showToast('Unable to load profile data', 'error');
        this.cdr.markForCheck();
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  private populateProfileForm(p: UserProfile) {
    const user = this.authService.currentUser() || {};
    this.fullName = p.fullName || user.fullName || user.name || 'Alex Rivers';
    this.email = p.email || user.email || 'alex.rivers@ecotrack.org';
    this.phoneNumber = p.phoneNumber || '+1 (555) 234-5678';
    this.dateOfBirth = p.dateOfBirth || '1995-06-15';
    this.gender = p.gender || 'Prefer not to say';
    this.bio = p.bio || 'Passionate sustainability advocate dedicated to zero waste and green transit.';
    this.organization = p.organization || 'EcoTrack Platform Initiative';
    this.employeeId = p.employeeId || 'ECO-9482';
    this.location = p.location || user.location || 'California, USA';
    this.profileImage = p.profileImage || user.profileImage || '';
    this.hasImageError = false;

    // Populate Sustainability Preferences
    if (p.sustainabilityPreferences) {
      const prefList = p.sustainabilityPreferences.split(',').map(s => s.trim().toLowerCase());
      this.sustainabilityPreferences.forEach(item => {
        item.selected = prefList.includes(item.name.toLowerCase());
      });
    }

    // Populate Environmental Interests
    if (p.environmentalInterests) {
      this.environmentalInterests = p.environmentalInterests.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    // Populate Personal Goals
    if (p.personalGoals) {
      const goalList = p.personalGoals.split(',').map(g => g.trim().toLowerCase());
      this.personalGoals.forEach(g => {
        g.selected = goalList.includes(g.label.toLowerCase());
      });
    }

    // Populate Lifestyle Config
    if (p.lifestyleConfig) {
      try {
        const lc = JSON.parse(p.lifestyleConfig);
        if (lc.commuteMode) this.commuteMode = lc.commuteMode;
        if (lc.transitFrequency) this.transitFrequency = lc.transitFrequency;
        if (lc.cyclingFrequency) this.cyclingFrequency = lc.cyclingFrequency;
        if (lc.vehicleOwnership) this.vehicleOwnership = lc.vehicleOwnership;
        if (lc.energyPreference) this.energyPreference = lc.energyPreference;
        if (lc.renewableUsage) this.renewableUsage = lc.renewableUsage;
        if (lc.dietPreference) this.dietPreference = lc.dietPreference;
        if (lc.organicFoodFrequency) this.organicFoodFrequency = lc.organicFoodFrequency;
        if (lc.recyclingHabit) this.recyclingHabit = lc.recyclingHabit;
        if (lc.wasteReductionHabit) this.wasteReductionHabit = lc.wasteReductionHabit;
        if (lc.composting) this.composting = lc.composting;
      } catch {
        // use defaults
      }
    }

    this.recalculateCompletion();
    this.cdr.markForCheck();
  }

  // --- Dynamic Completion Calculation ---
  public recalculateCompletion() {
    const missing: string[] = [];
    let completed = 0;
    const total = 6;

    // 1. Basic Info
    if (this.fullName.trim() && this.email.trim() && this.phoneNumber.trim()) {
      completed++;
    } else {
      missing.push('Basic Contact Info (Phone/Name/Email)');
    }

    // 2. Profile Picture
    if (this.profileImage.trim() && !this.hasImageError) {
      completed++;
    } else {
      missing.push('Profile Picture');
    }

    // 3. Location
    if (this.location.trim()) {
      completed++;
    } else {
      missing.push('Location');
    }

    // 4. Environmental Interests
    if (this.environmentalInterests.length > 0) {
      completed++;
    } else {
      missing.push('Environmental Interests');
    }

    // 5. Personal Sustainability Goals
    if (this.personalGoals.some(g => g.selected)) {
      completed++;
    } else {
      missing.push('Personal Sustainability Goals');
    }

    // 6. Lifestyle Configuration
    if (this.commuteMode && this.dietPreference && this.energyPreference) {
      completed++;
    } else {
      missing.push('Lifestyle Configuration');
    }

    this.completionPercentage = Math.min(100, Math.round((completed / total) * 100));
    this.missingFields = missing;
    this.cdr.markForCheck();
  }

  // --- Profile Picture Upload & Removal ---
  public onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Please select a valid image file (PNG, JPEG, WEBP, GIF)', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Profile picture must be smaller than 5MB', 'error');
      return;
    }

    this.isUploadingPicture = true;
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = async () => {
      this.ngZone.run(() => {
        this.profileImage = reader.result as string;
        this.hasImageError = false;
        this.recalculateCompletion();
        this.cdr.markForCheck();
      });

      try {
        await this.profileService.updateProfilePicture(this.profileImage);
        this.ngZone.run(() => {
          this.syncSharedUser();
          this.showToast('Profile picture uploaded successfully', 'success');
          this.cdr.markForCheck();
        });
      } catch (err) {
        console.error('Picture update error:', err);
        this.ngZone.run(() => {
          this.showToast('Failed to save picture to server', 'error');
          this.cdr.markForCheck();
        });
      } finally {
        this.ngZone.run(() => {
          this.isUploadingPicture = false;
          this.cdr.markForCheck();
        });
      }
    };
    reader.onerror = () => {
      this.ngZone.run(() => {
        this.isUploadingPicture = false;
        this.showToast('Failed to read image file', 'error');
        this.cdr.markForCheck();
      });
    };
    reader.readAsDataURL(file);
  }

  public removeProfilePicture() {
    this.profileImage = '';
    this.hasImageError = false;
    this.recalculateCompletion();
    this.syncSharedUser();
    this.showToast('Profile picture removed. Initials fallback active.', 'success');
    this.cdr.markForCheck();
  }

  // --- Environmental Interests Chip Methods ---
  public addInterest() {
    const val = this.newInterestInput.trim();
    if (!val) return;
    if (this.environmentalInterests.some(i => i.toLowerCase() === val.toLowerCase())) {
      this.showToast('Interest already added', 'error');
      return;
    }
    this.environmentalInterests.push(val);
    this.newInterestInput = '';
    this.recalculateCompletion();
    this.cdr.markForCheck();
  }

  public removeInterest(interestName: string) {
    this.environmentalInterests = this.environmentalInterests.filter(i => i !== interestName);
    this.recalculateCompletion();
    this.cdr.markForCheck();
  }

  public togglePreference(item: InterestChip) {
    item.selected = !item.selected;
    this.recalculateCompletion();
    this.cdr.markForCheck();
  }

  public toggleGoal(g: GoalOption) {
    g.selected = !g.selected;
    this.recalculateCompletion();
    this.cdr.markForCheck();
  }

  // --- Save Profile Changes ---
  public async onSaveProfile() {
    if (!this.fullName.trim()) {
      this.showToast('Full name is required', 'error');
      return;
    }

    this.isSubmitting = true;
    this.recalculateCompletion();
    this.cdr.markForCheck();

    const selectedPrefStr = this.sustainabilityPreferences
      .filter(p => p.selected)
      .map(p => p.name)
      .join(',');

    const selectedGoalsStr = this.personalGoals
      .filter(g => g.selected)
      .map(g => g.label)
      .join(',');

    const lifestyleObj = {
      commuteMode: this.commuteMode,
      transitFrequency: this.transitFrequency,
      cyclingFrequency: this.cyclingFrequency,
      vehicleOwnership: this.vehicleOwnership,
      energyPreference: this.energyPreference,
      renewableUsage: this.renewableUsage,
      dietPreference: this.dietPreference,
      organicFoodFrequency: this.organicFoodFrequency,
      recyclingHabit: this.recyclingHabit,
      wasteReductionHabit: this.wasteReductionHabit,
      composting: this.composting
    };

    const profileDTO: UserProfile = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      phoneNumber: this.phoneNumber.trim(),
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      bio: this.bio.trim(),
      organization: this.organization.trim(),
      employeeId: this.employeeId.trim(),
      location: this.location.trim(),
      profileImage: this.profileImage,
      environmentalInterests: this.environmentalInterests.join(','),
      sustainabilityPreferences: selectedPrefStr,
      personalGoals: selectedGoalsStr,
      lifestyleConfig: JSON.stringify(lifestyleObj),
      completionPercentage: this.completionPercentage
    };

    try {
      const updated = await this.profileService.updateProfile(profileDTO);
      this.ngZone.run(() => {
        this.populateProfileForm(updated);
        this.syncSharedUser();
        this.showToast('Profile updated successfully!', 'success');
        this.cdr.markForCheck();
      });
    } catch (err) {
      console.error('Save profile error:', err);
      this.ngZone.run(() => {
        this.showToast('Failed to update profile', 'error');
        this.cdr.markForCheck();
      });
    } finally {
      this.ngZone.run(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      });
    }
  }

  // Synchronize state to AuthService so Navbar & Leaderboard update live
  private syncSharedUser() {
    this.authService.updateCurrentUser({
      name: this.fullName,
      fullName: this.fullName,
      email: this.email,
      location: this.location,
      profileImage: this.profileImage,
      bio: this.bio
    });
  }

  // Toast Helper
  public showToast(message: string, type: 'success' | 'error' = 'success') {
    this.ngZone.run(() => {
      this.toastMessage = message;
      this.toastType = type;
      this.cdr.markForCheck();
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = setTimeout(() => {
        this.ngZone.run(() => {
          this.toastMessage = null;
          this.cdr.markForCheck();
        });
      }, 4000);
    });
  }
}
