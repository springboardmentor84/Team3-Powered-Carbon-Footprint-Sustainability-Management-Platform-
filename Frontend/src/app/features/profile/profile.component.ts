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
  private authService = inject(AuthService);

  public fullname = '';
  public email = '';
  public role = 'Individual';
  public location = 'California, USA';

  public commuteMode = 'sedan';
  public dietPreference = 'vegetarian';

  public interests: Interest[] = [
    { id: 'renewable', name: 'Renewable Energy', selected: true },
    { id: 'recycling', name: 'Recycling & Waste reduction', selected: true },
    { id: 'sustainable', name: 'Sustainable Living', selected: false },
    { id: 'transport', name: 'Green Transportation', selected: true },
    { id: 'water', name: 'Water Conservation', selected: false },
    { id: 'products', name: 'Eco-Friendly Products', selected: true },
    { id: 'organic', name: 'Organic Farming', selected: false }
  ];

  public badges = [
    { name: 'Eco Warrior', icon: 'bi-gem', unlocked: true, desc: 'Earned by completing sustainability challenges.' },
    { name: 'Climate Hero', icon: 'bi-patch-check', unlocked: true, desc: 'Earned by logging low carbon activities.' },
    { name: 'Planet Protector', icon: 'bi-shield-fill-check', unlocked: false, desc: 'Reach next level to unlock.' }
  ];

  public message = '';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.fullname = user.name || user.fullName || user.email?.split('@')[0] || 'Eco User';
      this.email = user.email || 'user@ecotrack.com';
      this.role = user.role === 'ROLE_ORGANIZATION' ? 'Organization' : (user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Individual');
    }
  }

  public onSaveSettings() {
    const user = this.authService.currentUser() || {};
    const updated = {
      ...user,
      name: this.fullname,
      fullName: this.fullname,
      email: this.email
    };
    this.authService.currentUser.set(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ecotrack_user', JSON.stringify(updated));
    }

    this.message = 'Profile and preferences successfully updated!';
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}
