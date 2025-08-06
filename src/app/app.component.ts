// src/app/app.component.ts

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Angular Material Imports
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Angular CDK
import { LayoutModule, BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// App Components
import { WidgetToolboxComponent } from './builder/components/widget-toolbox/widget-toolbox.component';
import { BuilderCanvasComponent } from './builder/components/builder-canvas/builder-canvas.component';
import { PropertiesPanelComponent } from './builder/components/properties-panel/properties-panel.component';
import { LayersPanelComponent } from './builder/components/layers-panel/layers-panel.component';
import { PreviewPanelComponent } from './builder/components/preview-panel/preview-panel.component';

// Services
import { FlutterProjectService } from './builder/services/flutter-project.service';
import { UiBuilderService } from './builder/services/ui-builder.service';
import { AuthService } from './shared/services/auth.service';
import { ConfigService } from './shared/services/config.service';
import { TranslationService } from './shared/services/translation.service';
import { FlutterProject, Screen } from './shared/models';
import { TranslatePipe } from './shared/pipes/translate.pipe';

import { Observable, map, shareReplay } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterOutlet,

    // Material Modules
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatDividerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,

    // CDK Modules
    LayoutModule,

    // App Components
    WidgetToolboxComponent,
    BuilderCanvasComponent,
    PropertiesPanelComponent,
    LayersPanelComponent,
    PreviewPanelComponent,

    // Pipes
    TranslatePipe
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('drawer', { static: false }) drawer?: MatSidenav;

  title = 'Flutter Visual Builder';
  private destroy$ = new Subject<void>();

  // Authentication state
  isAuthenticated = false;
  showConfigButton = false;
  isConfigured = false;
  currentUser: any = null;

  // Layout control - FIXED: Initialize based on current route
  showMainToolbar = false;
  isHandset$!: Observable<boolean>;

  // Panel visibility
  showPropertiesPanel = true;
  showLayersPanel = false;
  showPreviewPanel = false;

  // Current project state
  currentProject: FlutterProject | null = null;
  currentScreen: Screen | null = null;
  projectScreens: Screen[] = [];

  // Language support
  currentLanguage = 'en';
  availableLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' }
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private flutterProjectService: FlutterProjectService,
    private uiBuilderService: UiBuilderService,
    private authService: AuthService,
    private configService: ConfigService,
    private translationService: TranslationService,
    private snackBar: MatSnackBar,
    private router: Router,
    private http: HttpClient
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );

    // FIXED: Set initial showMainToolbar based on current route
    this.updateToolbarVisibility(this.router.url);
  }

  ngOnInit(): void {
    // FIXED: Initialize app first before setting up router events
    this.initializeApp();

    // Subscribe to authentication state
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        console.log('Authentication state changed:', isAuth);
        this.isAuthenticated = isAuth;
        this.showConfigButton = isAuth || this.configService.isConfigured();

        if (isAuth) {
          this.loadUserProfile();
          this.initializeBuilder();
        }
      });

    // Subscribe to route changes to control layout
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      console.log('Navigated to:', event.url);
      this.updateToolbarVisibility(event.url);
    });

    // Subscribe to language changes
    this.translationService.languageChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // FIXED: Extract toolbar visibility logic
  private updateToolbarVisibility(url: string): void {
    const isSpecial = this.isSpecialRoute(url);
    this.showMainToolbar = !isSpecial;
    console.log(`URL: ${url}, isSpecialRoute: ${isSpecial}, showMainToolbar: ${this.showMainToolbar}`);
  }

  private isSpecialRoute(url: string): boolean {
    const specialRoutes = ['/config', '/login'];
    return specialRoutes.some(route => url.startsWith(route));
  }

  private initializeApp(): void {
    console.log('Initializing app...');

    // Check configuration
    this.isConfigured = this.configService.isConfigured();
    console.log('App configured:', this.isConfigured);

    if (!this.isConfigured) {
      console.log('App not configured, navigating to /config');
      this.router.navigate(['/config']);
      return;
    }

    // Initialize translations
    this.initializeTranslations();

    // Check authentication
    const isAuthenticated = this.authService.isAuthenticated();
    console.log('User authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      // Only redirect if not already on special routes
      if (!this.isSpecialRoute(this.router.url)) {
        console.log('Not authenticated, navigating to /login');
        this.router.navigate(['/login']);
      }
    } else {
      // If authenticated and on a special route, redirect to builder
      if (this.isSpecialRoute(this.router.url)) {
        console.log('Authenticated on special route, navigating to /builder');
        this.router.navigate(['/builder']);
      }
    }
  }

  private initializeTranslations(): void {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && this.availableLanguages.some(l => l.code === savedLang)) {
      this.currentLanguage = savedLang;
      this.translationService.setLanguage(savedLang).subscribe();
    } else {
      this.translationService.initializeWithDefaults().subscribe();
    }
  }

  private initializeBuilder(): void {
    // Subscribe to current project
    this.flutterProjectService.currentProject$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.currentProject = project;
      });

    // Subscribe to current screen
    this.flutterProjectService.currentScreen$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screen => {
        this.currentScreen = screen;
        if (screen && screen.ui_structure) {
          this.uiBuilderService.setUIStructure(screen.ui_structure);
        }
      });

    // Subscribe to project screens
    this.flutterProjectService.projectScreens$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screens => {
        this.projectScreens = screens;
      });

    // Load demo project for development
    this.loadDemoProject();
  }

  private loadUserProfile(): void {
    if (!this.configService.isConfigured()) return;

    const baseUrl = this.configService.getBaseUrl();
    this.http.get(`${baseUrl}/auth/me/`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: any) => {
          this.currentUser = profile;

          // Set language from user preference
          if (profile.preference?.lang) {
            this.changeLanguage({
              code: profile.preference.lang,
              name: '',
              nativeName: '',
              flag: '',
              direction: profile.preference.lang === 'ar' ? 'rtl' : 'ltr'
            });
          }
        },
        error: (err) => {
          console.error('Error loading user profile:', err);
        }
      });
  }

  private async loadDemoProject(): Promise<void> {
    try {
      const demoProject: FlutterProject = {
        id: 1,
        name: 'My Flutter App',
        package_name: 'com.example.myapp',
        description: 'A demo Flutter app',
        user: 1,
        supported_languages: [],
        default_language: 'en',
        primary_color: '#2196F3',
        secondary_color: '#03DAC6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      };

      const demoScreen: Screen = {
        id: 1,
        project: 1,
        name: 'Home Screen',
        route: '/',
        is_home: true,
        ui_structure: {
          type: 'container',
          properties: {
            width: null,
            height: null,
            color: '#FFFFFF',
            padding: { all: 16 }
          },
          children: [{
            type: 'text',
            properties: {
              text: 'Welcome to Flutter Visual Builder!',
              fontSize: 24,
              color: '#333333',
              textAlign: 'center',
              fontWeight: 'bold'
            },
            children: []
          }]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.currentProject = demoProject;
      this.currentScreen = demoScreen;
      this.projectScreens = [demoScreen];
      this.uiBuilderService.setUIStructure(demoScreen.ui_structure);

    } catch (error) {
      console.error('Error loading demo project:', error);
    }
  }

  // Language methods
  changeLanguage(language: Language): void {
    this.currentLanguage = language.code;
    this.translationService.setLanguage(language.code).subscribe({
      next: () => {
        console.log('Language changed to:', language.name);
      },
      error: (err) => {
        console.error('Error changing language:', err);
      }
    });
  }

  // Navigation methods
  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/login']);

    this.snackBar.open('Signed out successfully', 'Close', {
      duration: 3000
    });
  }

  goToConfig(): void {
    this.router.navigate(['/config']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';

    const nameParts = [
      this.currentUser.first_name,
      this.currentUser.last_name
    ].filter(part => part && part.trim());

    return nameParts.length > 0 ? nameParts.join(' ') : this.currentUser.username;
  }

  // Toolbar Actions
  onSave(): void {
    if (!this.currentScreen) return;

    const uiStructure = this.uiBuilderService.getUIStructure();

    this.flutterProjectService.updateScreenUIStructure(this.currentScreen.id, uiStructure)
      .subscribe({
        next: () => {
          this.snackBar.open('Screen saved successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        },
        error: (error) => {
          console.error('Error saving screen:', error);
          this.snackBar.open('Error saving screen', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
  }

  onUndo(): void {
    this.uiBuilderService.undo();
  }

  onRedo(): void {
    this.uiBuilderService.redo();
  }

  canUndo(): boolean {
    return this.uiBuilderService.canUndo();
  }

  canRedo(): boolean {
    return this.uiBuilderService.canRedo();
  }

  onClearCanvas(): void {
    this.uiBuilderService.clearCanvas();
    this.snackBar.open('Canvas cleared', 'Close', { duration: 2000 });
  }

  onGenerateCode(): void {
    if (!this.currentProject) {
      this.snackBar.open('No project selected', 'Close', { duration: 3000 });
      return;
    }

    const generatingSnackBar = this.snackBar.open('Generating code...', '', {
      duration: 0
    });

    this.flutterProjectService.generateCode().subscribe({
      next: (result) => {
        generatingSnackBar.dismiss();
        this.snackBar.open(`Generated ${result.file_count} files for ${result.project}`, 'Close', {
          duration: 4000
        });
        console.log('Generated files:', result.files);
      },
      error: (error) => {
        generatingSnackBar.dismiss();
        console.error('Error generating code:', error);
        const errorMsg = error?.error?.detail || 'Error generating code';
        this.snackBar.open(errorMsg, 'Close', { duration: 5000 });
      }
    });
  }

  onBuildAPK(): void {
    if (!this.currentProject) return;

    this.snackBar.open('Building APK... This may take a few minutes', 'Close', {
      duration: 5000
    });

    this.flutterProjectService.buildAPK().subscribe({
      next: (build) => {
        this.snackBar.open('Build started successfully!', 'View Builds', {
          duration: 5000
        });
      },
      error: (error) => {
        console.error('Error starting build:', error);
        this.snackBar.open('Error starting build', 'Close', { duration: 3000 });
      }
    });
  }

  onDownloadProject(): void {
    if (!this.currentProject) return;

    this.flutterProjectService.downloadProject().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentProject?.package_name || 'flutter-project'}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Project downloaded!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error downloading project:', error);
        this.snackBar.open('Error downloading project', 'Close', { duration: 3000 });
      }
    });
  }

  // Panel Toggles
  togglePropertiesPanel(): void {
    this.showPropertiesPanel = !this.showPropertiesPanel;
  }

  toggleLayersPanel(): void {
    this.showLayersPanel = !this.showLayersPanel;
  }

  togglePreviewPanel(): void {
    this.showPreviewPanel = !this.showPreviewPanel;
  }

  // Screen Management
  onScreenSelected(screen: Screen): void {
    this.flutterProjectService.setCurrentScreen(screen);
  }

  onScreenSelectionChange(screenId: number): void {
    const screen = this.projectScreens.find(s => s.id === screenId);
    if (screen) {
      this.onScreenSelected(screen);
    }
  }

  getCurrentScreenName(): string {
    return this.currentScreen?.name || 'No Screen Selected';
  }
}
