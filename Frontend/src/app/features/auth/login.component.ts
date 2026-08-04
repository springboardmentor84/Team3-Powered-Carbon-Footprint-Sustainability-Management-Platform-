import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Simple state variables using standard JS structures
  public loginForm = this.fb.group({
    email: ['demo@ecotrack.com', [Validators.required, Validators.email]],
    password: ['password123', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  // Getters for form controls for clean HTML template validations
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  public showPassword = false;
  public isLoading = false;
  public isSuccess = false;
  public errorMessage = '';

  public togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  public onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    this.authService.login(email, password)
      .then((user) => {
        this.isLoading = false;
        this.isSuccess = true;
        
        // Hold success checkmark briefly before redirecting
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      })
      .catch((error) => {
        this.isLoading = false;
        this.errorMessage = typeof error === 'string' ? error : 'Authentication failed. Please check your credentials.';
      });
  }

  public onSSOLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    // Simulate SSO Login
    this.authService.login('sso@company.com', 'ssoPassword123')
      .then(() => {
        this.isLoading = false;
        this.isSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      })
      .catch((error) => {
        this.isLoading = false;
        this.errorMessage = 'SSO Authentication failed.';
      });
  }
}

