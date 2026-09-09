import { Component, OnInit, inject, NgZone } from '@angular/core';
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

  ngOnInit(): void {
    this.initGoogleIdentity();
  }

  /**
   * Initializes Google Identity Services if loaded and client ID is available
   */
  private initGoogleIdentity(): void {
    if (typeof window === 'undefined') return;

    // Retry briefly if script is loading asynchronously
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google?.accounts?.id) {
        clearInterval(checkGoogle);
        if (environment.googleClientId && environment.googleClientId.trim()) {
          try {
            google.accounts.id.initialize({
              client_id: environment.googleClientId.trim(),
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
      }
    }, 300);

    // Timeout check after 4 seconds
    setTimeout(() => clearInterval(checkGoogle), 4000);
  }

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

  /**
   * Handler for the "Sign in with Google" button click
   */
  public signInWithGoogle(): void {
    this.errorMessage = '';

    const clientId = environment.googleClientId?.trim();
    if (!clientId) {
      this.errorMessage = 'Google Client ID is not configured. Please add GOOGLE_CLIENT_ID to frontend/.env file.';
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
    }).catch((err: any) => {
      this.isGoogleLoading = false;
      this.errorMessage = typeof err === 'string' ? err : 'Google login failed.';
    });
  }
}
