// src/app/builder/components/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../shared/services/auth.service';
import { TranslationService } from '../../../shared/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { Subject, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatRippleModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="login-layout">
      <!-- Ocean Mint Background -->
      <div class="ocean-mint-bg">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
        <div class="floating-shape shape-1"></div>
        <div class="floating-shape shape-2"></div>
        <div class="floating-shape shape-3"></div>
      </div>

      <!-- Login Container -->
      <div class="login-container">
        <!-- Left Side - Branding -->
        <div class="branding-section">
          <div class="branding-content">
            <div class="logo-wrapper">
              <div class="logo-icon">
                <mat-icon>build</mat-icon>
              </div>
              <h1 class="brand-name">Flutter Visual Builder</h1>
              <p class="brand-tagline">{{ 'build_beautiful_apps' | translate }}</p>
            </div>

            <div class="features-showcase">
              <h2 class="showcase-title">{{ 'build_faster_deploy_smarter' | translate }}</h2>
              <p class="showcase-subtitle">
                Create stunning Flutter applications with our intuitive visual builder
              </p>

              <div class="feature-cards">
                <div class="feature-card" matRipple>
                  <div class="feature-icon">
                    <mat-icon>speed</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Fast Development</h4>
                    <p>Build Flutter apps 10x faster with visual components</p>
                  </div>
                </div>

                <div class="feature-card" matRipple>
                  <div class="feature-icon">
                    <mat-icon>phone_android</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Cross Platform</h4>
                    <p>Deploy to iOS and Android from a single codebase</p>
                  </div>
                </div>

                <div class="feature-card" matRipple>
                  <div class="feature-icon">
                    <mat-icon>code</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Clean Code</h4>
                    <p>Generate production-ready Flutter code automatically</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="branding-footer">
              <p>&copy; 2025 Flutter Visual Builder. All rights reserved.</p>
            </div>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="form-section">
          <div class="form-wrapper">
            <!-- Language Selector -->
            <div class="language-selector">
              <button mat-icon-button [matMenuTriggerFor]="languageMenu" matTooltip="{{ 'change_language' | translate }}">
                <mat-icon>language</mat-icon>
              </button>
              <mat-menu #languageMenu="matMenu">
                <button mat-menu-item *ngFor="let lang of availableLanguages" (click)="changeLanguage(lang.code)">
                  <span class="language-option">
                    <span class="flag">{{ lang.flag }}</span>
                    <span>{{ lang.name }}</span>
                  </span>
                </button>
              </mat-menu>
            </div>

            <!-- Compact Header -->
            <div class="form-header">
              <div class="header-icon">
                <mat-icon>login</mat-icon>
              </div>
              <div class="header-text">
                <h2>{{ 'welcome_back' | translate }}</h2>
                <p>{{ 'sign_in_to_continue' | translate }}</p>
              </div>
            </div>

            <!-- Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form">
              <!-- Username Field -->
              <mat-form-field appearance="outline" class="form-field-ocean">
                <mat-label>{{ 'username' | translate }}</mat-label>
                <input matInput
                       formControlName="username"
                       [placeholder]="'enter_username' | translate"
                       autocomplete="username">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                  {{ 'username_required' | translate }}
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="outline" class="form-field-ocean">
                <mat-label>{{ 'password' | translate }}</mat-label>
                <input matInput
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       [placeholder]="'enter_password' | translate"
                       autocomplete="current-password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button
                        matSuffix
                        (click)="togglePasswordVisibility()"
                        type="button"
                        class="toggle-btn">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  {{ 'password_required' | translate }}
                </mat-error>
                <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                  {{ 'password_min_length' | translate }}
                </mat-error>
              </mat-form-field>

              <!-- Options Row -->
              <div class="form-options">
                <mat-checkbox formControlName="rememberMe" class="remember-checkbox">
                  {{ 'remember_me' | translate }}
                </mat-checkbox>
                <a href="#" class="forgot-link" (click)="$event.preventDefault()">
                  {{ 'forgot_password' | translate }}
                </a>
              </div>

              <!-- Submit Button -->
              <button type="submit"
                      mat-raised-button
                      class="login-button"
                      [disabled]="!loginForm.valid || isLoading">
                <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                <span *ngIf="!isLoading">
                  <mat-icon>login</mat-icon>
                  {{ 'sign_in' | translate }}
                </span>
              </button>

              <!-- Error Message -->
              <div class="error-card" *ngIf="errorMessage">
                <mat-icon>error_outline</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            </form>

            <!-- Footer -->
            <div class="form-footer">
              <p>{{ 'no_account' | translate }}</p>
              <a href="#" class="contact-link" (click)="$event.preventDefault()">
                {{ 'contact_admin' | translate }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private translationService: TranslationService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Subscribe to language changes to update error messages
    this.translationService.languageChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Re-translate error message if it exists
        if (this.errorMessage) {
          this.updateErrorMessage();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  changeLanguage(languageCode: string): void {
    this.translationService.setLanguage(languageCode).subscribe();
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const credentials = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: () => {
          const successMessage = this.translationService.instant('login_success');
          this.snackBar.open(`✅ ${successMessage}`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.router.navigate(['/']);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Login error:', err);
          this.setErrorMessage(err.status);

          const errorTitle = this.translationService.instant('login_failed');
          this.snackBar.open(`❌ ${errorTitle}`, 'Close', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });

    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });

      this.errorMessage = this.translationService.instant('fill_required_fields');
      const warningMessage = this.translationService.instant('complete_all_fields');
      this.snackBar.open(warningMessage, 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private setErrorMessage(status: number): void {
    if (status === 401) {
      this.errorMessage = this.translationService.instant('invalid_credentials');
    } else if (status === 403) {
      this.errorMessage = this.translationService.instant('access_denied');
    } else if (status === 0) {
      this.errorMessage = this.translationService.instant('connection_error');
    } else {
      this.errorMessage = this.translationService.instant('login_failed');
    }
  }

  private updateErrorMessage(): void {
    // Re-translate the current error message
    if (this.errorMessage) {
      // This will re-apply the translation for the current error
      this.setErrorMessage(401); // Default to generic error
    }
  }
}
