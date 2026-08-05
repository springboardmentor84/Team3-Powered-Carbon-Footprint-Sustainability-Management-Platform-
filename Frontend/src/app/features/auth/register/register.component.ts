import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Multi-step form tracking (Step 1: Account Credentials, Step 2: Profile & Sustainability Interests)
  public currentStep = 1;

  // Form definition
  public registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: ['ROLE_USER', [Validators.required]],
    location: ['New York, USA'],
    lifestyleConfig: ['Urban Living, Hybrid Transportation']
  });

  // Environmental Interest Categories from Project PDF Page 3
  public interestOptions = [
    { id: 'Renewable Energy', name: 'Renewable Energy', icon: 'bi-sun', selected: true },
    { id: 'Recycling', name: 'Recycling & Upcycling', icon: 'bi-recycle', selected: true },
    { id: 'Waste Reduction', name: 'Waste Reduction', icon: 'bi-trash3', selected: false },
    { id: 'Sustainable Living', name: 'Sustainable Living', icon: 'bi-house-check', selected: true },
    { id: 'Green Transportation', name: 'Green Transportation', icon: 'bi-car-front', selected: false },
    { id: 'Water Conservation', name: 'Water Conservation', icon: 'bi-droplet', selected: false },
    { id: 'Eco-Friendly Products', name: 'Eco-Friendly Products', icon: 'bi-bag-heart', selected: false },
    { id: 'Climate Action', name: 'Climate Action', icon: 'bi-globe-americas', selected: true },
    { id: 'Organic Farming', name: 'Organic Farming', icon: 'bi-flower2', selected: false },
    { id: 'Wildlife Conservation', name: 'Wildlife Conservation', icon: 'bi-tree', selected: false }
  ];

  public lifestyleOptions = [
    'Urban Apartment',
    'Suburban Home',
    'Electric / Hybrid Vehicle',
    'Public Transit Rider',
    'Solar Powered Home',
    'Plant-Based Diet'
  ];

  public selectedLifestyle: string[] = ['Urban Apartment', 'Electric / Hybrid Vehicle'];

  public isLoading = false;
  public isSuccess = false;
  public errorMessage = '';

  public toggleInterest(interest: any) {
    interest.selected = !interest.selected;
  }

  public toggleLifestyle(option: string) {
    if (this.selectedLifestyle.includes(option)) {
      this.selectedLifestyle = this.selectedLifestyle.filter(i => i !== option);
    } else {
      this.selectedLifestyle.push(option);
    }
  }

  public goToStep(step: number) {
    if (step === 2) {
      // Validate Step 1 first
      const controls = ['fullName', 'email', 'password', 'confirmPassword'];
      let isValid = true;
      controls.forEach(c => {
        const control = this.registerForm.get(c);
        if (control && control.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      });

      if (!isValid) {
        this.errorMessage = 'Please fix errors in basic credentials before proceeding.';
        return;
      }

      if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
        this.errorMessage = 'Passwords do not match.';
        return;
      }
    }
    this.errorMessage = '';
    this.currentStep = step;
  }

  public onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Please complete all required fields correctly.';
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const selectedInterestsStr = this.interestOptions
      .filter(i => i.selected)
      .map(i => i.name)
      .join(', ');

    const lifestyleStr = this.selectedLifestyle.join(', ');

    const registerData = {
      fullName: this.registerForm.value.fullName!,
      email: this.registerForm.value.email!,
      password: this.registerForm.value.password!,
      role: this.registerForm.value.role || 'ROLE_USER',
      location: this.registerForm.value.location || 'Global',
      environmentalInterests: selectedInterestsStr || 'Sustainable Living',
      lifestyleConfig: lifestyleStr || 'Standard'
    };

    this.authService.register(registerData)
      .then(() => {
        this.isLoading = false;
        this.isSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1200);
      })
      .catch((err: any) => {
        this.isLoading = false;
        this.errorMessage = typeof err === 'string' ? err : 'Registration failed. Email may already exist.';
      });
  }
}