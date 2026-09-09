import { Component, OnInit, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // Form initialized without demo credentials
  public loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  // Getters for form controls for clean HTML template validations
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  public showPassword = false;
  public isLoading = false;
  public isGoogleLoading = false;
  public isSuccess = false;
  public errorMessage = '';

  // Popup modal state
  public showPopup = false;
  public popupTitle = '';
  public popupMessage = '';

  private cachedClientId = '';

  public triggerPopup(title: string, message: string) {
    this.ngZone.run(() => {
      this.popupTitle = title;
      this.popupMessage = message;
      this.showPopup = true;
      this.cdr.detectChanges();
    });
  }

  public closePopup() {
    this.ngZone.run(() => {
      this.showPopup = false;
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.initGoogleIdentity();
  }

  /**
   * Multi-tier resolver for Google Client ID:
   * 1. Check window.__env (Runtime Docker/Nginx container injection in Railway)
   * 2. Check Angular environment.googleClientId (Local development via set-env.js)
   * 3. Fetch from Spring Boot backend /api/users/google-client-id (Zero-build-config fallback)
   */
  public async getResolvedClientId(): Promise<string> {
    if (this.cachedClientId) {
      return this.cachedClientId;
    }

    // 1. Runtime injection via window.__env
    if (typeof window !== 'undefined') {
      const winEnv = (window as any).__env?.GOOGLE_CLIENT_ID;
      if (winEnv && winEnv.trim()) {
        this.cachedClientId = winEnv.trim();
        return this.cachedClientId;
      }
    }

    // 2. Angular compiled environment
    if (environment.googleClientId && environment.googleClientId.trim()) {
      this.cachedClientId = environment.googleClientId.trim();
      return this.cachedClientId;
    }

    // 3. Dynamic backend fetch
    try {
      const backendId = await this.authService.getGoogleClientId();
      if (backendId && backendId.trim()) {
        this.cachedClientId = backendId.trim();
        return this.cachedClientId;
      }
    } catch (e) {
      console.warn('[Google OAuth] Could not fetch client ID from backend:', e);
    }

    return '';
  }

  /**
   * Initializes Google Identity Services if loaded and client ID is available
   */
  private async initGoogleIdentity(): Promise<void> {
    if (typeof window === 'undefined') return;

    const clientId = await this.getResolvedClientId();
    if (!clientId) return;

    // Retry briefly if script is loading asynchronously
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        clearInterval(checkGoogle);
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              this.ngZone.run(() => this.handleGoogleCredentialResponse(response));
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });
        } catch (e) {
          console.warn('[Google OAuth] Init error:', e);
        }
      }
    }, 300);

    // Timeout check after 4 seconds
    setTimeout(() => clearInterval(checkGoogle), 4000);
  }

  public togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  public onSubmit() {
    this.errorMessage = '';

    const emailVal = (this.loginForm.value.email || '').trim();
    const passwordVal = this.loginForm.value.password || '';

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // 1. Empty or invalid email format check
    if (!emailVal || !emailRegex.test(emailVal)) {
      const msg = 'Invalid email. Please provide a valid email.';
      this.errorMessage = msg;
      this.triggerPopup('Invalid Email', msg);
      this.loginForm.get('email')?.markAsTouched();
      return;
    }

    // 2. Empty or invalid password check
    if (!passwordVal || passwordVal.length < 6) {
      const msg = !passwordVal 
        ? 'Password is required. Please provide a valid password.' 
        : 'Invalid password. Password must be at least 6 characters.';
      this.errorMessage = msg;
      this.triggerPopup('Invalid Password', msg);
      this.loginForm.get('password')?.markAsTouched();
      return;
    }

    // 3. Overall form validity
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      const msg = 'Invalid email or password. Please provide a valid email.';
      this.errorMessage = msg;
      this.triggerPopup('Invalid Credentials', msg);
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.login(emailVal, passwordVal)
      .then((user) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.isSuccess = true;
          this.cdr.detectChanges();
          
          // Hold success checkmark briefly before redirecting
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        });
      })
      .catch((error) => {
        this.ngZone.run(() => {
          this.isLoading = false;
          const msg = typeof error === 'string' && error.trim() 
            ? error 
            : 'Invalid password. Please provide a valid password.';
          this.errorMessage = msg;
          const isPasswordError = msg.toLowerCase().includes('password');
          const isEmailError = msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account');
          const title = isPasswordError ? 'Invalid Password' : (isEmailError ? 'Invalid Email' : 'Authentication Failed');
          this.triggerPopup(title, msg);
          this.cdr.detectChanges();
        });
      });
  }

  /**
   * Handler for the "Sign in with Google" button click
   */
  public async signInWithGoogle(): Promise<void> {
    this.errorMessage = '';

    const clientId = await this.getResolvedClientId();
    if (!clientId) {
      this.errorMessage = 'Google Client ID is not configured on the server or in .env.';
      return;
    }

    if (typeof google === 'undefined' || !google?.accounts) {
      this.errorMessage = 'Google Identity Services could not be loaded. Please check your internet connection.';
      return;
    }

    this.isGoogleLoading = true;

    try {
      // Use OAuth2 token client for standard interactive popup flow
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Fetch user profile from Google userinfo API
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await res.json();

              this.ngZone.run(() => {
                this.authService.googleLogin({
                  idToken: tokenResponse.access_token,
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture
                }).then(() => {
                  this.isGoogleLoading = false;
                  this.isSuccess = true;
                  setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                  }, 1200);
                }).catch((err: any) => {
                  this.isGoogleLoading = false;
                  this.errorMessage = typeof err === 'string' ? err : 'Failed to authenticate with backend.';
                });
              });
            } catch (fetchErr) {
              this.ngZone.run(() => {
                this.isGoogleLoading = false;
                this.errorMessage = 'Failed to fetch user details from Google.';
              });
            }
          } else {
            this.ngZone.run(() => {
              this.isGoogleLoading = false;
            });
          }
        },
        error_callback: (err: any) => {
          this.ngZone.run(() => {
            this.isGoogleLoading = false;
            this.errorMessage = err?.message || 'Google Sign-In was cancelled or failed.';
          });
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      this.isGoogleLoading = false;
      this.errorMessage = e?.message || 'Error initiating Google Sign-In.';
    }
  }

  /**
   * Handler for Google One Tap / ID Token credential response
   */
  private handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) return;

    this.isGoogleLoading = true;
    this.errorMessage = '';

    let decodedProfile: any = {};
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      decodedProfile = JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('Could not parse Google ID Token locally', e);
    }

    this.authService.googleLogin({
      idToken: response.credential,
      email: decodedProfile.email,
      name: decodedProfile.name,
      picture: decodedProfile.picture
    }).then(() => {
      this.isGoogleLoading = false;
      this.isSuccess = true;
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1200);
    }).catch((err) => {
      this.isGoogleLoading = false;
      this.errorMessage = typeof err === 'string' ? err : 'Google login failed.';
    });
  }
}
