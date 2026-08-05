import { Component, inject } from '@angular/core';
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

  public forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public isLoading = false;
  public isSuccess = false;
  public message = '';
  public errorMessage = '';

  public onSubmit() {
    if (this.forgotForm.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.message = '';

    setTimeout(() => {
      this.isLoading = false;
      this.isSuccess = true;
      this.message = `A password reset link has been successfully sent to ${this.forgotForm.value.email}. Please check your spam folder if you do not receive it shortly.`;
    }, 1500);
  }
}