// src/app/shared/components/login/login.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="login-layout">
      <!-- Background -->
      <div class="login-bg">
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>
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
              <p class="brand-tagline">{{ 'flutter_visual_builder' | translate }}</p>
            </div>

            <div class="features-showcase">
              <h2 class="showcase-title">Build Amazing Flutter Apps</h2>
              <p class="showcase-subtitle">
                Create beautiful, responsive mobile applications with our visual drag-and-drop interface.
              </p>

              <div class="feature-cards">
                <div class="feature-card">
                  <div class="feature-icon">
                    <mat-icon>speed</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Fast Development</h4>
                    <p>Build apps 10x faster with visual tools</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">
                    <mat-icon>phone_android</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Native Performance</h4>
                    <p>Generate clean, optimized Flutter code</p>
                  </div>
                </div>

                <div class="feature-card">
                  <div class="feature-icon">
                    <mat-icon>palette</mat-icon>
                  </div>
                  <div class="feature-content">
                    <h4>Beautiful UI</h4>
                    <p>Create stunning interfaces with ease</p>
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
              <button mat-icon-button [matMenuTriggerFor]="languageMenu"
                      [matTooltip]="'change_language' | translate">
                <mat-icon>language</mat-icon>
              </button>
              <mat-menu #languageMenu="matMenu">
                <button mat-menu-item *ngFor="let lang of availableLanguages"
                        (click)="changeLanguage(lang.code)">
                  <span class="language-option">
                    <span class="flag">{{ lang.flag }}</span>
                    <span>{{ lang.name }}</span>
                  </span>
                </button>
              </mat-menu>
            </div>

            <!-- Login Header -->
            <div class="form-header">
              <div class="header-icon">
                <mat-icon>login</mat-icon>
              </div>
              <div class="header-text">
                <h2>{{ 'login_title' | translate }}</h2>
                <p>{{ 'login_subtitle' | translate }}</p>
              </div>
            </div>

            <!-- Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form">

              <!-- Username Field -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>{{ 'username' | translate }}</mat-label>
                <input matInput
                       formControlName="username"
                       [placeholder]="'username' | translate"
                       autocomplete="username">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                  Username is required
                </mat-error>
              </mat-form-field>

              <!-- Password Field -->
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>{{ 'password' | translate }}</mat-label>
                <input matInput
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       [placeholder]="'password' | translate"
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
                  Password is required
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
                      color="primary"
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
              <p>Need help? Contact your system administrator</p>
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

  availableLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' }
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
      password: ['', [Validators.required]],
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
          this.setErrorMessage(401); // Re-translate with generic error
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
          this.snackBar.open(\`✅ \${successMessage}\`, 'Close', {
            duration: 3000
          });
          this.router.navigate(['/']);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Login error:', err);
          this.setErrorMessage(err.status);

          const errorTitle = this.translationService.instant('login_failed');
          this.snackBar.open(\`❌ \${errorTitle}\`, 'Close', {
            duration: 4000
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
        duration: 3000
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
    if (this.errorMessage) {
      this.setErrorMessage(401); // Default to generic error
    }
  }
}
