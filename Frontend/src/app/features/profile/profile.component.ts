import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

interface Interest {
  id: string;
  name: string;
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
  public authService = inject(AuthService);

  public fullname = '';
  public email = '';
  public role = 'Individual';
  public location = '';

  public commuteMode = 'sedan';
  public dietPreference = 'vegetarian';

  public defaultAvatarUrl = 'https://ui-avatars.com/api/?name=Eco+User&background=2e7d32&color=fff&size=128';
  public profileImage = '';

  public interests: Interest[] = [
    { id: 'renewable', name: 'Renewable Energy', selected: false },
    { id: 'recycling', name: 'Recycling & Waste reduction', selected: false },
    { id: 'sustainable', name: 'Sustainable Living', selected: false },
    { id: 'transport', name: 'Green Transportation', selected: false },
    { id: 'water', name: 'Water Conservation', selected: false },
    { id: 'products', name: 'Eco-Friendly Products', selected: false },
    { id: 'organic', name: 'Organic Farming', selected: false }
  ];

  public badges = [
    { name: 'Eco Warrior', icon: 'bi-gem', unlocked: true, desc: 'Earned by completing sustainability challenges.' },
    { name: 'Climate Hero', icon: 'bi-patch-check', unlocked: true, desc: 'Earned by logging low carbon activities.' },
    { name: 'Planet Protector', icon: 'bi-shield-fill-check', unlocked: false, desc: 'Reach next level to unlock.' }
  ];

  // Toast notification state
  public toast = { show: false, message: '', type: 'success' as 'success' | 'error' | 'info' };
  public isSaving = false;
  private toastTimer: any = null;

  async ngOnInit() {
    await this.loadProfileFromDB();
  }

  private async loadProfileFromDB() {
    try {
      const user = await this.authService.getUserProfile();
      if (user) {
        this.fullname = user.fullName || user.name || user.email?.split('@')[0] || 'Eco User';
        this.email = user.email || '';
        this.role = user.role === 'ROLE_ORGANIZATION' ? 'Organization'
          : (user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Individual');
        this.location = user.location || '';
        this.profileImage = user.profileImage || '';

        if (user.lifestyleConfig) {
          try {
            const cfg = typeof user.lifestyleConfig === 'string'
              ? JSON.parse(user.lifestyleConfig)
              : user.lifestyleConfig;
            if (cfg.commuteMode) this.commuteMode = cfg.commuteMode;
            if (cfg.dietPreference) this.dietPreference = cfg.dietPreference;
          } catch { /* ignore parse errors */ }
        }

        if (user.environmentalInterests !== undefined && user.environmentalInterests !== null) {
          const ids = user.environmentalInterests
            ? user.environmentalInterests.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
          this.interests.forEach(item => { item.selected = ids.includes(item.id); });
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];

    if (file.size > 10 * 1024 * 1024) {
      this.showToast('Image must be smaller than 10 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } }
          else        { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) { ctx.drawImage(img, 0, 0, w, h); this.profileImage = canvas.toDataURL('image/jpeg', 0.85); }
          else { this.profileImage = rawDataUrl; }
        } catch { this.profileImage = rawDataUrl; }
        this.showToast('Picture updated — stored locally in your browser only.', 'info');
      };
      img.onerror = () => { this.profileImage = rawDataUrl; this.showToast('Picture updated — stored locally in your browser only.', 'info'); };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  public async onSaveSettings() {
    if (this.isSaving) return;
    this.isSaving = true;

    // --- Step 1: Save profile picture to localStorage ONLY (not sent to DB) ---
    const current = this.authService.currentUser() || {};
    const localUser = { ...current, profileImage: this.profileImage };
    localStorage.setItem('ecotrack_user', JSON.stringify(localUser));
    this.authService.currentUser.set(localUser);

    // --- Step 2: Save all other fields to the backend database ---
    const dbPayload = {
      fullName: this.fullname,
      email: this.email,
      location: this.location,
      environmentalInterests: this.interests.filter(i => i.selected).map(i => i.id).join(','),
      lifestyleConfig: JSON.stringify({ commuteMode: this.commuteMode, dietPreference: this.dietPreference })
    };

    try {
      const result = await this.authService.updateUserProfile(dbPayload);

      if (result && result._savedToDb) {
        this.showToast('Profile saved to database successfully!', 'success');
      } else {
        this.showToast('Profile saved locally. (Database sync may be offline)', 'info');
      }

      // Signal is already updated by updateUserProfile — no extra sync needed

    } catch (err: any) {
      console.error('Profile save error:', err);
      this.showToast('Failed to save profile: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      this.isSaving = false;
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { show: true, message, type };
    this.toastTimer = setTimeout(() => { this.toast = { ...this.toast, show: false }; }, 4500);
  }
}
