import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class ProfileComponent {
  public fullname = 'Alex Rivers';
  public email = 'alex.rivers@company.com';
  public role = 'Sustainability Lead';
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
    { name: 'Eco Warrior', icon: 'bi-gem', unlocked: true, desc: 'Earned by completing 5 challenges.' },
    { name: 'Climate Hero', icon: 'bi-patch-check', unlocked: true, desc: 'Earned by saving over 500kg CO₂.' },
    { name: 'Planet Protector', icon: 'bi-shield-fill-check', unlocked: false, desc: 'Reach level 15 to unlock.' }
  ];

  public message = '';

  public onSaveSettings() {
    this.message = 'Profile and preferences successfully updated!';
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
}
