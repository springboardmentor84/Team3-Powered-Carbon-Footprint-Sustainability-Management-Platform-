import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  public forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public isLoading = false;
  public isResending = false;
  public isSuccess = false;
  public message = '';
  public errorMessage = '';

  private readonly emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  public onSubmit(): void {
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

    setTimeout(() => {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message = `A password reset link has been successfully sent to ${emailVal}. Please check your inbox and spam folder.`;
        this.cdr.detectChanges();
      });
    }, 700);
  }

  public resendLink(): void {
    const emailVal = (this.forgotForm.value.email || '').trim();

    if (!emailVal || !this.emailRegex.test(emailVal)) {
      this.errorMessage = 'Invalid email. Please provide a valid email address.';
      this.cdr.detectChanges();
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.isResending = false;
        this.isSuccess = true;
        this.message = `A new password reset link has been successfully resent to ${emailVal}! Please check your email.`;
        this.cdr.detectChanges();
      });
    }, 700);
  }
}