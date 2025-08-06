// src/app/shared/components/config/config.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ConfigService } from '../../services/config.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface ConnectionStatus {
  type: 'success' | 'error' | 'info';
  icon: string;
  message: string;
  details?: string;
}

@Component({
  selector: 'app-config',
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
    MatSnackBarModule,
    MatTooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="config-layout">
      <div class="config-container">

        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="header-text">
              <div class="header-icon">
                <mat-icon>settings</mat-icon>
              </div>
              <div>
                <h1>{{ 'system_configuration' | translate }}</h1>
                <p>{{ 'configure_backend' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Configuration Card -->
        <mat-card class="config-card">
          <!-- Current Status -->
          <div class="status-banner" *ngIf="configService.isConfigured()" [class.success]="isConfigValid">
            <div class="status-content">
              <mat-icon class="status-icon">{{ isConfigValid ? 'check_circle' : 'warning' }}</mat-icon>
              <div class="status-text">
                <h4>{{ isConfigValid ? 'Configuration Active' : 'Configuration Needs Update' }}</h4>
                <p>{{ getStatusMessage() }}</p>
              </div>
            </div>
          </div>

          <mat-card-content>
            <!-- Configuration Form -->
            <form [formGroup]="configForm" (ngSubmit)="saveConfig()" class="config-form">

              <!-- URL Input -->
              <mat-form-field appearance="outline" class="url-field">
                <mat-label>{{ 'backend_api_url' | translate }}</mat-label>
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

            </form>
          </mat-card-content>

          <mat-card-actions class="action-buttons">
            <button type="button"
                    mat-button
                    class="test-btn"
                    (click)="testConnection()"
                    [disabled]="!configForm.valid || isLoading"
                    *ngIf="configForm.get('baseUrl')?.value">
              <mat-icon>wifi_find</mat-icon>
              <span>{{ 'test_connection' | translate }}</span>
            </button>

            <button type="button"
                    mat-raised-button
                    color="primary"
                    class="save-btn"
                    (click)="saveConfig()"
                    [disabled]="!configForm.valid || isLoading">
              <div class="button-content" *ngIf="!isLoading">
                <mat-icon>save</mat-icon>
                <span>{{ 'save_configuration' | translate }}</span>
              </div>
              <div class="button-content loading" *ngIf="isLoading">
                <mat-spinner diameter="20"></mat-spinner>
                <span>Saving...</span>
              </div>
            </button>
          </mat-card-actions>

          <!-- Quick Actions -->
          <div class="quick-actions" *ngIf="configService.isConfigured()">
            <div class="actions-grid">
              <button mat-button class="action-card" (click)="goToDashboard()">
                <div class="action-icon dashboard-icon">
                  <mat-icon>dashboard</mat-icon>
                </div>
                <div class="action-text">
                  <span class="action-title">{{ 'dashboard' | translate }}</span>
                  <span class="action-desc">View platform</span>
                </div>
              </button>

              <button mat-button class="action-card" (click)="goToLogin()">
                <div class="action-icon login-icon">
                  <mat-icon>login</mat-icon>
                </div>
                <div class="action-text">
                  <span class="action-title">{{ 'sign_in' | translate }}</span>
                  <span class="action-desc">Access account</span>
                </div>
              </button>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  configForm: FormGroup;
  isLoading = false;
  isConfigValid = false;
  connectionStatus: ConnectionStatus | null = null;

  constructor(
    private fb: FormBuilder,
    public configService: ConfigService,
    private router: Router,
    private http: HttpClient,
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

  testConnection(): void {
    if (!this.configForm.valid) return;

    this.isLoading = true;
    const baseUrl = this.configForm.value.baseUrl.replace(/\/$/, '');

    this.connectionStatus = {
      type: 'info',
      icon: 'sync',
      message: 'Testing connection to your backend server...',
      details: 'This may take a few seconds'
    };

    // Test the connection by trying to reach a health endpoint
    this.http.get(`${baseUrl}/health/`, {
      observe: 'response',
      responseType: 'json'
    }).subscribe({
      next: (response) => {
        this.connectionStatus = {
          type: 'success',
          icon: 'wifi',
          message: 'Connection successful! Your backend is reachable and responding.',
          details: `Response status: ${response.status}`
        };
        this.isConfigValid = true;
        this.snackBar.open('✅ Connection test successful!', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Connection test failed:', error);
        this.connectionStatus = {
          type: 'error',
          icon: 'wifi_off',
          message: 'Connection failed. Please check the URL and try again.',
          details: `Error: ${error.status} ${error.statusText}`
        };
        this.isConfigValid = false;
        this.snackBar.open('❌ Connection test failed', 'Close', {
          duration: 4000
        });
        this.isLoading = false;
      }
    });
  }

  saveConfig(): void {
    if (!this.configForm.valid) {
      this.snackBar.open('❌ Please enter a valid backend URL', 'Close', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;
    const baseUrl = this.configForm.value.baseUrl.replace(/\/$/, '');

    // Save the configuration
    setTimeout(() => {
      this.configService.setBaseUrl(baseUrl);
      this.isConfigValid = true;

      this.snackBar.open('✅ Configuration saved successfully!', 'Close', {
        duration: 3000
      });

      this.connectionStatus = {
        type: 'success',
        icon: 'check_circle',
        message: 'Configuration saved! You can now proceed to sign in.',
        details: `Saved URL: ${baseUrl}`
      };

      this.isLoading = false;

      // Auto-navigate to login after a short delay
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 1000);
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
