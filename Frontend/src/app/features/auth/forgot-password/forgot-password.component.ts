import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  // Email submission form
  public forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Password reset form (requires 6-digit code sent to email)
  public resetForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  public isLoading = false;
  public isResetting = false;
  public isResending = false;
  public isSuccess = false;
  public passwordUpdated = false;
  public showNewPassword = false;
  public message = '';
  public errorMessage = '';

  private readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  public togglePasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  public async onSubmit(): Promise<void> {
    const emailVal = (this.forgotForm.value.email || '').trim();

    if (!emailVal || !this.emailRegex.test(emailVal)) {
      this.errorMessage = 'Invalid email. Please provide a valid email address.';
      this.message = '';
      this.forgotForm.get('email')?.markAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';
    this.cdr.detectChanges();

    try {
      const res = await this.authService.forgotPassword(emailVal);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.isSuccess = true;
        this.resetForm.patchValue({ code: '', newPassword: '', confirmPassword: '' });
        this.resetForm.markAsPristine();
        this.resetForm.markAsUntouched();

        if (res && res.emailSent) {
          this.message = `A 6-digit verification code has been sent to ${emailVal}. Please check your inbox (and spam folder) and enter the code below.`;
        } else if (res && res.code) {
          this.message = `Verification Code: ${res.code} (Railway network blocked outgoing email port 465. Please enter this 6-digit code below to set your new password).`;
        } else {
          this.message = `A 6-digit verification code has been generated for ${emailVal}. Please enter it below.`;
        }
        this.cdr.detectChanges();
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.errorMessage = typeof err === 'string' ? err : (err?.message || 'Unable to send verification code. Please check your email.');
        this.cdr.detectChanges();
      });
    }
  }

  public async onResetPassword(): Promise<void> {
    const emailVal = (this.forgotForm.value.email || '').trim();
    const codeVal = (this.resetForm.value.code || '').trim();
    const newPass = (this.resetForm.value.newPassword || '').trim();
    const confirmPass = (this.resetForm.value.confirmPassword || '').trim();

    if (!codeVal || codeVal.length !== 6) {
      this.errorMessage = 'Please enter the 6-digit verification code.';
      this.cdr.detectChanges();
      return;
    }

    if (!newPass || newPass.length < 6) {
      this.errorMessage = 'New password must be at least 6 characters long.';
      this.cdr.detectChanges();
      return;
    }

    if (newPass !== confirmPass) {
      this.errorMessage = 'Passwords do not match. Please re-enter your password.';
      this.cdr.detectChanges();
      return;
    }

    this.isResetting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      await this.authService.resetPassword(emailVal, codeVal, newPass);
      this.ngZone.run(() => {
        this.isResetting = false;
        this.passwordUpdated = true;
        this.message = 'Password has been successfully updated! Redirecting to login...';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1800);
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.isResetting = false;
        this.errorMessage = typeof err === 'string' ? err : 'Invalid verification code. Please check your email.';
        this.cdr.detectChanges();
      });
    }
  }

  public async resendLink(): Promise<void> {
    const emailVal = (this.forgotForm.value.email || '').trim();

    if (!emailVal || !this.emailRegex.test(emailVal)) {
      this.errorMessage = 'Invalid email. Please provide a valid email address.';
      this.cdr.detectChanges();
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const res = await this.authService.forgotPassword(emailVal);
      this.ngZone.run(() => {
        this.isResending = false;
        this.resetForm.patchValue({ code: '' });
        if (res && res.emailSent) {
          this.message = `A fresh 6-digit verification code has been dispatched to ${emailVal}! Please check your email and enter it below.`;
        } else if (res && res.code) {
          this.message = `New Verification Code: ${res.code} (Please enter this 6-digit code below to set your new password).`;
        } else {
          this.message = `A fresh 6-digit verification code has been generated. Please enter it below.`;
        }
        this.cdr.detectChanges();
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.isResending = false;
        this.errorMessage = typeof err === 'string' ? err : 'Failed to resend verification code.';
        this.cdr.detectChanges();
      });
    }
  }
}