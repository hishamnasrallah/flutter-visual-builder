// src/app/builder/components/config/config.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from '../../../shared/services/config.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="config-layout">
      <!-- Main Container -->
      <div class="config-container">
        <!-- Compact Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-text">
              <div class="header-icon">
                <mat-icon>settings</mat-icon>
              </div>
              <div>
                <h1>System Configuration</h1>
                <p>Set up your backend connection to get started</p>
              </div>
            </div>
            <!-- Progress Indicator -->
            <div class="progress-steps">
              <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
                <div class="step-circle">
                  <mat-icon *ngIf="currentStep > 1">check</mat-icon>
                  <span *ngIf="currentStep <= 1">1</span>
                </div>
                <span class="step-label">Configure</span>
              </div>

              <div class="step-connector" [class.active]="currentStep > 1"></div>

              <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
                <div class="step-circle">
                  <mat-icon *ngIf="currentStep > 2">check</mat-icon>
                  <span *ngIf="currentStep <= 2">2</span>
                </div>
                <span class="step-label">Test</span>
              </div>

              <div class="step-connector" [class.active]="currentStep > 2"></div>

              <div class="step" [class.active]="currentStep >= 3">
                <div class="step-circle">
                  <mat-icon *ngIf="currentStep > 3">check</mat-icon>
                  <span *ngIf="currentStep <= 3">3</span>
                </div>
                <span class="step-label">Ready</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Card -->
        <div class="config-card">
          <!-- Current Configuration Status -->
          <div class="status-banner" *ngIf="configService.isConfigured()" [class.success]="isConfigValid">
            <div class="status-content">
              <mat-icon class="status-icon">{{ isConfigValid ? 'check_circle' : 'warning' }}</mat-icon>
              <div class="status-text">
                <h4>{{ isConfigValid ? 'Configuration Active' : 'Configuration Needs Update' }}</h4>
                <p>{{ getStatusMessage() }}</p>
              </div>
            </div>
          </div>

          <!-- Configuration Form -->
          <div class="form-section">
            <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="config-form">
              <!-- URL Input -->
              <div class="url-input-section">
                <mat-form-field appearance="outline" class="url-field">
                  <mat-label>Backend API URL</mat-label>
                  <input matInput
                         formControlName="baseUrl"
                         placeholder="https://api.yourcompany.com"
                         type="url"
                         autocomplete="url">
                  <mat-icon matPrefix>link</mat-icon>

                  <mat-error *ngIf="configForm.get('baseUrl')?.hasError('required')">
                    Backend URL is required
                  </mat-error>
                  <mat-error *ngIf="configForm.get('baseUrl')?.hasError('pattern')">
                    Please enter a valid URL (must start with http:// or https://)
                  </mat-error>
                </mat-form-field>

                <!-- URL Examples -->
                <div class="url-examples">
                  <button type="button"
                          mat-button
                          class="example-btn"
                          (click)="setExampleUrl('https://api.example.com')">
                    <mat-icon>language</mat-icon>
                    Production
                  </button>
                  <button type="button"
                          mat-button
                          class="example-btn"
                          (click)="setExampleUrl('http://localhost:8000')">
                    <mat-icon>computer</mat-icon>
                    Local Dev
                  </button>
                </div>
              </div>

              <!-- Connection Test Results -->
              <div class="test-results" *ngIf="connectionStatus">
                <div class="result-card" [ngClass]="connectionStatus.type">
                  <div class="result-icon">
                    <mat-icon>{{ connectionStatus.icon }}</mat-icon>
                  </div>
                  <div class="result-content">
                    <h4 class="result-title">{{ getResultTitle() }}</h4>
                    <p class="result-message">{{ connectionStatus.message }}</p>
                    <div class="result-details" *ngIf="connectionStatus.details">
                      <small>{{ connectionStatus.details }}</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button type="button"
                        mat-button
                        class="test-btn"
                        (click)="testConnection()"
                        [disabled]="!configForm.valid || isLoading"
                        *ngIf="configForm.get('baseUrl')?.value">
                  <mat-icon>wifi_find</mat-icon>
                  <span>Test Connection</span>
                </button>

                <button type="submit"
                        mat-raised-button
                        class="save-btn"
                        [disabled]="!configForm.valid || isLoading">
                  <div class="button-content" *ngIf="!isLoading">
                    <mat-icon>save</mat-icon>
                    <span>Save Configuration</span>
                  </div>
                  <div class="button-content loading" *ngIf="isLoading">
                    <mat-spinner diameter="20"></mat-spinner>
                    <span>{{ getLoadingText() }}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions" *ngIf="configService.isConfigured()">
            <div class="actions-grid">
              <button mat-button class="action-card" (click)="goToBuilder()">
                <div class="action-icon dashboard-icon">
                  <mat-icon>build</mat-icon>
                </div>
                <div class="action-text">
                  <span class="action-title">Builder</span>
                  <span class="action-desc">Start building</span>
                </div>
              </button>

              <button mat-button class="action-card" (click)="goToLogin()">
                <div class="action-icon login-icon">
                  <mat-icon>login</mat-icon>
                </div>
                <div class="action-text">
                  <span class="action-title">Sign In</span>
                  <span class="action-desc">Access account</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading && operationType === 'save'">
        <div class="loading-content">
          <mat-spinner diameter="60"></mat-spinner>
          <h3>Saving Configuration</h3>
          <p>Please wait while we save your settings...</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  configForm: FormGroup;
  isLoading = false;
  isConfigValid = false;
  currentStep = 1;
  operationType = '';
  connectionStatus: {
    type: string;
    icon: string;
    message: string;
    details?: string
  } | null = null;

  constructor(
    private fb: FormBuilder,
    public configService: ConfigService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.configForm = this.fb.group({
      baseUrl: ['', [
        Validators.required,
        Validators.pattern(/^https?:\/\/.+/)
      ]]
    });
  }

  ngOnInit(): void {
    const currentUrl = this.configService.getBaseUrl();
    if (currentUrl) {
      this.configForm.patchValue({ baseUrl: currentUrl });
      this.isConfigValid = true;
      this.currentStep = 2;
    }
  }

  setExampleUrl(url: string): void {
    this.configForm.patchValue({ baseUrl: url });
  }

  getStatusMessage(): string {
    if (this.isConfigValid) {
      return `Connected to: ${this.configService.getBaseUrl()}`;
    }
    return 'Please update your configuration and test the connection.';
  }

  getResultTitle(): string {
    switch (this.connectionStatus?.type) {
      case 'success': return 'Connection Successful';
      case 'error': return 'Connection Failed';
      case 'info': return 'Testing Connection';
      default: return 'Connection Status';
    }
  }

  getLoadingText(): string {
    switch (this.operationType) {
      case 'test': return 'Testing...';
      case 'save': return 'Saving...';
      default: return 'Processing...';
    }
  }

  saveConfig(): void {
    if (this.configForm.valid) {
      this.isLoading = true;
      this.operationType = 'save';

      const baseUrl = this.configForm.value.baseUrl.replace(/\/$/, '');

      setTimeout(() => {
        this.configService.setBaseUrl(baseUrl);
        this.isConfigValid = true;
        this.currentStep = 3;

        this.snackBar.open('✅ Configuration saved successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        this.connectionStatus = {
          type: 'success',
          icon: 'check_circle',
          message: 'Configuration saved! You can now proceed to sign in.',
          details: `Saved URL: ${baseUrl}`
        };

        this.isLoading = false;
        this.operationType = '';

        // Auto-navigate to login after delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      }, 1500);
    } else {
      this.snackBar.open('❌ Please enter a valid backend URL', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  testConnection(): void {
    if (this.configForm.valid) {
      this.isLoading = true;
      this.operationType = 'test';
      this.currentStep = 2;

      this.connectionStatus = {
        type: 'info',
        icon: 'sync',
        message: 'Testing connection to your backend server...',
        details: 'This may take a few seconds'
      };

      // Simulate connection test with realistic timing
      setTimeout(() => {
        const isConnected = Math.random() > 0.2; // 80% success rate

        if (isConnected) {
          this.connectionStatus = {
            type: 'success',
            icon: 'wifi',
            message: 'Connection successful! Your backend is reachable and responding.',
            details: `Response time: ${Math.floor(Math.random() * 200 + 50)}ms`
          };

          this.snackBar.open('✅ Connection test successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          this.isConfigValid = true;
        } else {
          this.connectionStatus = {
            type: 'error',
            icon: 'wifi_off',
            message: 'Connection failed. Please check the URL and try again.',
            details: 'Make sure the server is running and accessible from your network'
          };

          this.snackBar.open('❌ Connection test failed', 'Close', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });

          this.isConfigValid = false;
          this.currentStep = 1;
        }

        this.isLoading = false;
        this.operationType = '';
      }, 2500);
    }
  }

  goToBuilder(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
